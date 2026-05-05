-- 관계부: 인물별 자유 메모

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_body_length check (char_length(body) between 1 and 5000)
);

create index notes_user_id_idx on public.notes(user_id);
create index notes_person_pinned_created_idx
  on public.notes(person_id, pinned desc, created_at desc);

create trigger set_notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

create or replace function public.assert_note_owner()
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

create trigger trg_notes_assert_owner
  before insert or update on public.notes
  for each row execute function public.assert_note_owner();

alter table public.notes enable row level security;

create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);
