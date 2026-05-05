-- 관계부: 리마인더

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  reminder_type public.reminder_type not null default 'followup',
  scheduled_at timestamptz not null,
  repeat_rule public.reminder_repeat not null default 'none',
  channel public.reminder_channel not null default 'inapp',
  status public.reminder_status not null default 'active',
  message text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminders_message_length check (
    message is null or char_length(message) <= 200
  )
);

create index reminders_user_scheduled_idx
  on public.reminders(user_id, scheduled_at);
create index reminders_person_status_idx
  on public.reminders(person_id, status);

-- 인물당 활성 followup 1개 (부분 unique)
create unique index reminders_person_active_followup_uniq
  on public.reminders(person_id)
  where reminder_type = 'followup' and status = 'active';

create trigger set_reminders_updated_at
  before update on public.reminders
  for each row execute function public.handle_updated_at();

-- person ↔ user 일관성
create or replace function public.assert_reminder_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  person_owner uuid;
begin
  select user_id into person_owner from public.persons where id = new.person_id;
  if person_owner is null then
    raise exception 'person not found';
  end if;
  if new.user_id <> person_owner then
    raise exception 'user_id mismatch with person owner';
  end if;
  return new;
end;
$$;

create trigger trg_reminders_assert_owner
  before insert or update on public.reminders
  for each row execute function public.assert_reminder_owner();

alter table public.reminders enable row level security;

create policy "reminders_select_own"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "reminders_insert_own"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "reminders_update_own"
  on public.reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reminders_delete_own"
  on public.reminders for delete
  using (auth.uid() = user_id);
