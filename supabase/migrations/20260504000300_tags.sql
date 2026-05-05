-- 관계부: tags + person_tags (N:M 조인)

-- ===== public.tags =====
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  constraint tags_name_length check (char_length(name) between 1 and 20),
  constraint tags_color_format check (
    color is null or color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  constraint tags_user_name_unique unique (user_id, name)
);

create index tags_user_id_idx on public.tags(user_id);

alter table public.tags enable row level security;

create policy "tags_select_own"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "tags_insert_own"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "tags_update_own"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tags_delete_own"
  on public.tags for delete
  using (auth.uid() = user_id);


-- ===== public.person_tags (N:M 조인) =====
create table public.person_tags (
  person_id uuid not null references public.persons(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, tag_id)
);

create index person_tags_tag_id_idx on public.person_tags(tag_id);
create index person_tags_user_id_idx on public.person_tags(user_id);

-- 양쪽 user_id 일관성 검증 트리거 (Person/Tag와 동일 사용자)
create or replace function public.assert_person_tag_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  person_owner uuid;
  tag_owner uuid;
begin
  select user_id into person_owner from public.persons where id = new.person_id;
  select user_id into tag_owner from public.tags where id = new.tag_id;

  if person_owner is null or tag_owner is null then
    raise exception 'person or tag not found';
  end if;
  if person_owner <> tag_owner then
    raise exception 'person and tag must belong to the same user';
  end if;
  if new.user_id <> person_owner then
    raise exception 'user_id mismatch with person/tag owner';
  end if;
  return new;
end;
$$;

create trigger trg_person_tags_assert_owner
  before insert or update on public.person_tags
  for each row execute function public.assert_person_tag_owner();

alter table public.person_tags enable row level security;

create policy "person_tags_select_own"
  on public.person_tags for select
  using (auth.uid() = user_id);

create policy "person_tags_insert_own"
  on public.person_tags for insert
  with check (auth.uid() = user_id);

create policy "person_tags_update_own"
  on public.person_tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "person_tags_delete_own"
  on public.person_tags for delete
  using (auth.uid() = user_id);
