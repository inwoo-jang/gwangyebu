-- 관계부: 메시지 / 캡처 저장 (M2)

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  source public.message_source not null default 'other',
  body text,
  image_url text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint messages_body_length check (
    body is null or char_length(body) <= 10000
  ),
  constraint messages_has_content check (
    (body is not null and char_length(body) > 0) or image_url is not null
  )
);

create index messages_user_id_idx on public.messages(user_id);
create index messages_person_occurred_idx
  on public.messages(person_id, occurred_at desc);

create or replace function public.assert_message_owner()
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

create trigger trg_messages_assert_owner
  before insert or update on public.messages
  for each row execute function public.assert_message_owner();

alter table public.messages enable row level security;

create policy "messages_select_own"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "messages_insert_own"
  on public.messages for insert
  with check (auth.uid() = user_id);

create policy "messages_update_own"
  on public.messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);
