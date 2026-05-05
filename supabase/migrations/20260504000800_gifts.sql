-- 관계부: 선물 주고받음 (M2)

create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  linked_event_id uuid references public.events(id) on delete set null,
  direction public.gift_direction not null,
  kind public.gift_kind not null,
  amount int,
  item_name text,
  estimated_value int,
  occurred_at date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint gifts_amount_nonneg check (amount is null or amount >= 0),
  constraint gifts_estimated_value_nonneg check (
    estimated_value is null or estimated_value >= 0
  ),
  constraint gifts_item_name_length check (
    item_name is null or char_length(item_name) between 1 and 50
  ),
  constraint gifts_reason_length check (
    reason is null or char_length(reason) <= 100
  ),
  constraint gifts_kind_fields check (
    (kind = 'cash' and amount is not null and item_name is null)
    or (kind = 'item' and item_name is not null)
  )
);

create index gifts_user_id_idx on public.gifts(user_id);
create index gifts_person_direction_occurred_idx
  on public.gifts(person_id, direction, occurred_at desc);
create index gifts_linked_event_id_idx
  on public.gifts(linked_event_id)
  where linked_event_id is not null;

create or replace function public.assert_gift_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  person_owner uuid;
  event_owner uuid;
begin
  select user_id into person_owner from public.persons where id = new.person_id;
  if person_owner is null then
    raise exception 'person not found';
  end if;
  if new.user_id <> person_owner then
    raise exception 'user_id mismatch with person owner';
  end if;

  if new.linked_event_id is not null then
    select user_id into event_owner from public.events where id = new.linked_event_id;
    if event_owner is null then
      raise exception 'linked event not found';
    end if;
    if event_owner <> new.user_id then
      raise exception 'linked event must belong to the same user';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_gifts_assert_owner
  before insert or update on public.gifts
  for each row execute function public.assert_gift_owner();

alter table public.gifts enable row level security;

create policy "gifts_select_own"
  on public.gifts for select
  using (auth.uid() = user_id);

create policy "gifts_insert_own"
  on public.gifts for insert
  with check (auth.uid() = user_id);

create policy "gifts_update_own"
  on public.gifts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "gifts_delete_own"
  on public.gifts for delete
  using (auth.uid() = user_id);
