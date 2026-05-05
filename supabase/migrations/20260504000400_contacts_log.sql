-- 관계부: 연락 이력 로그
-- 트리거 update_person_last_contact() 는 helpers 마이그레이션에서 부착

create table public.contacts_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  channel public.contact_channel not null default 'other',
  direction public.contact_direction not null default 'unknown',
  occurred_at timestamptz not null,
  memo text,
  created_at timestamptz not null default now(),
  constraint contacts_log_memo_length check (
    memo is null or char_length(memo) <= 500
  )
);

create index contacts_log_user_id_idx on public.contacts_log(user_id);
create index contacts_log_person_occurred_idx
  on public.contacts_log(person_id, occurred_at desc);

-- person_id ↔ user_id 일관성 검증
create or replace function public.assert_contacts_log_owner()
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

create trigger trg_contacts_log_assert_owner
  before insert or update on public.contacts_log
  for each row execute function public.assert_contacts_log_owner();

alter table public.contacts_log enable row level security;

create policy "contacts_log_select_own"
  on public.contacts_log for select
  using (auth.uid() = user_id);

create policy "contacts_log_insert_own"
  on public.contacts_log for insert
  with check (auth.uid() = user_id);

create policy "contacts_log_update_own"
  on public.contacts_log for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contacts_log_delete_own"
  on public.contacts_log for delete
  using (auth.uid() = user_id);
