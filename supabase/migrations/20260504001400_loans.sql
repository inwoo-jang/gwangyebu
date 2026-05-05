-- 관계부: 금전 대여/대출 (loans)
-- 게스트 모드의 GuestLoan과 동일한 스키마.
-- direction: 'lent' (내가 빌려줌) / 'borrowed' (내가 빌림)

create type public.loan_direction as enum ('lent', 'borrowed');

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  direction public.loan_direction not null,
  amount int not null,
  occurred_at date not null,
  due_at date,
  returned_at date,
  memo text,
  created_at timestamptz not null default now(),
  constraint loans_amount_positive check (amount > 0),
  constraint loans_memo_length check (
    memo is null or char_length(memo) <= 500
  )
);

create index loans_user_id_idx on public.loans(user_id);
create index loans_person_occurred_idx
  on public.loans(person_id, occurred_at desc);
create index loans_user_open_idx
  on public.loans(user_id, returned_at)
  where returned_at is null;

create or replace function public.assert_loan_owner()
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

create trigger trg_loans_assert_owner
  before insert or update on public.loans
  for each row execute function public.assert_loan_owner();

alter table public.loans enable row level security;

create policy "loans_select_own"
  on public.loans for select
  using (auth.uid() = user_id);

create policy "loans_insert_own"
  on public.loans for insert
  with check (auth.uid() = user_id);

create policy "loans_update_own"
  on public.loans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "loans_delete_own"
  on public.loans for delete
  using (auth.uid() = user_id);
