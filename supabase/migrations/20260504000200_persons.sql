-- 관계부: users 프로필 + persons 테이블
-- public.users는 auth.users를 1:1로 확장한 사용자 프로필.
-- persons는 사용자가 관리하는 인물.

-- ===== public.users (프로필) =====
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  photo_url text,
  locale text not null default 'ko-KR',
  timezone text not null default 'Asia/Seoul',
  onboarding jsonb not null default '{}'::jsonb,
  ai_provider public.ai_provider not null default 'auto',
  notification_prefs jsonb not null default jsonb_build_object(
    'reminders', true,
    'ai', true,
    'events', true,
    'quiet_hours', jsonb_build_object('start', '22:00', 'end', '07:00')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 30
  )
);

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_delete_own"
  on public.users for delete
  using (auth.uid() = id);


-- ===== public.persons =====
create table public.persons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  photo_url text,
  relationship_type public.relationship_type not null default 'etc',
  birth_year int,
  birth_month int,
  birth_day int,
  mbti text,
  food_preference text,
  how_we_met text,
  memo text,
  reminder_interval_days int not null default 30,
  last_contact_at timestamptz,
  status public.person_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint persons_name_length check (char_length(name) between 1 and 50),
  constraint persons_birth_year_range check (
    birth_year is null
    or (birth_year between 1900 and extract(year from now())::int)
  ),
  constraint persons_birth_month_range check (
    birth_month is null or birth_month between 1 and 12
  ),
  constraint persons_birth_day_range check (
    birth_day is null or birth_day between 1 and 31
  ),
  constraint persons_mbti_length check (
    mbti is null or char_length(mbti) = 4
  ),
  constraint persons_food_preference_length check (
    food_preference is null or char_length(food_preference) <= 200
  ),
  constraint persons_how_we_met_length check (
    how_we_met is null or char_length(how_we_met) <= 100
  ),
  constraint persons_memo_length check (
    memo is null or char_length(memo) <= 2000
  ),
  constraint persons_reminder_interval_days_range check (
    reminder_interval_days between 0 and 365
  )
);

create index persons_user_id_idx on public.persons(user_id);
create index persons_user_active_last_contact_idx
  on public.persons(user_id, last_contact_at desc nulls last)
  where status = 'active' and deleted_at is null;
create index persons_user_deleted_idx on public.persons(user_id, deleted_at);
create index persons_user_birthday_idx
  on public.persons(user_id, birth_month, birth_day)
  where birth_month is not null and birth_day is not null;

create trigger set_persons_updated_at
  before update on public.persons
  for each row execute function public.handle_updated_at();

alter table public.persons enable row level security;

create policy "persons_select_own"
  on public.persons for select
  using (auth.uid() = user_id);

create policy "persons_insert_own"
  on public.persons for insert
  with check (auth.uid() = user_id);

create policy "persons_update_own"
  on public.persons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "persons_delete_own"
  on public.persons for delete
  using (auth.uid() = user_id);
