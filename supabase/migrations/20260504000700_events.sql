-- 관계부: 경조사 (M2 기능, 스키마는 미리 도입)

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  event_type public.event_type not null,
  occurred_at date not null,
  location text,
  attended boolean,
  amount_paid int,
  memo text,
  created_at timestamptz not null default now(),
  constraint events_location_length check (
    location is null or char_length(location) <= 100
  ),
  constraint events_amount_paid_nonneg check (
    amount_paid is null or amount_paid >= 0
  ),
  constraint events_memo_length check (
    memo is null or char_length(memo) <= 500
  )
);

create index events_user_id_idx on public.events(user_id);
create index events_person_occurred_idx
  on public.events(person_id, occurred_at desc);

create or replace function public.assert_event_owner()
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

create trigger trg_events_assert_owner
  before insert or update on public.events
  for each row execute function public.assert_event_owner();

alter table public.events enable row level security;

create policy "events_select_own"
  on public.events for select
  using (auth.uid() = user_id);

create policy "events_insert_own"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "events_update_own"
  on public.events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "events_delete_own"
  on public.events for delete
  using (auth.uid() = user_id);
