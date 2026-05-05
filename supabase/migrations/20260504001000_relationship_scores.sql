-- 관계부: 관계 건강도 점수 + 추천 + 피드백 + 프로바이더 사용량

-- ===== relationship_scores (인물당 1) =====
create table public.relationship_scores (
  person_id uuid primary key references public.persons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null,
  factors jsonb not null default '{}'::jsonb,
  last_reason text,
  provider public.ai_provider not null default 'rule_based',
  computed_at timestamptz not null default now(),
  constraint relationship_scores_range check (score between 0 and 100)
);

create index relationship_scores_user_id_idx
  on public.relationship_scores(user_id);
create index relationship_scores_user_score_idx
  on public.relationship_scores(user_id, score desc);

create or replace function public.assert_score_owner()
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

create trigger trg_relationship_scores_assert_owner
  before insert or update on public.relationship_scores
  for each row execute function public.assert_score_owner();

alter table public.relationship_scores enable row level security;

create policy "relationship_scores_select_own"
  on public.relationship_scores for select
  using (auth.uid() = user_id);

create policy "relationship_scores_insert_own"
  on public.relationship_scores for insert
  with check (auth.uid() = user_id);

create policy "relationship_scores_update_own"
  on public.relationship_scores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "relationship_scores_delete_own"
  on public.relationship_scores for delete
  using (auth.uid() = user_id);


-- ===== recommendations =====
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  rank int not null,
  reason text,
  suggested_action text,
  week_of date not null,
  status public.recommendation_status not null default 'new',
  created_at timestamptz not null default now(),
  constraint recommendations_rank_range check (rank between 1 and 5),
  constraint recommendations_user_person_week_uniq
    unique (user_id, person_id, week_of)
);

create index recommendations_user_week_idx
  on public.recommendations(user_id, week_of desc);

create or replace function public.assert_recommendation_owner()
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

create trigger trg_recommendations_assert_owner
  before insert or update on public.recommendations
  for each row execute function public.assert_recommendation_owner();

alter table public.recommendations enable row level security;

create policy "recommendations_select_own"
  on public.recommendations for select
  using (auth.uid() = user_id);

create policy "recommendations_insert_own"
  on public.recommendations for insert
  with check (auth.uid() = user_id);

create policy "recommendations_update_own"
  on public.recommendations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recommendations_delete_own"
  on public.recommendations for delete
  using (auth.uid() = user_id);


-- ===== ai_feedback =====
create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid references public.persons(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  signal public.ai_feedback_signal not null,
  created_at timestamptz not null default now()
);

create index ai_feedback_user_id_idx on public.ai_feedback(user_id);
create index ai_feedback_person_id_idx
  on public.ai_feedback(person_id)
  where person_id is not null;

alter table public.ai_feedback enable row level security;

create policy "ai_feedback_select_own"
  on public.ai_feedback for select
  using (auth.uid() = user_id);

create policy "ai_feedback_insert_own"
  on public.ai_feedback for insert
  with check (auth.uid() = user_id);

create policy "ai_feedback_update_own"
  on public.ai_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ai_feedback_delete_own"
  on public.ai_feedback for delete
  using (auth.uid() = user_id);


-- ===== provider_usage =====
create table public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.ai_provider not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_micro_krw int not null default 0,
  purpose text,
  created_at timestamptz not null default now(),
  constraint provider_usage_input_tokens_nonneg check (input_tokens >= 0),
  constraint provider_usage_output_tokens_nonneg check (output_tokens >= 0),
  constraint provider_usage_cost_nonneg check (cost_micro_krw >= 0)
);

create index provider_usage_user_created_idx
  on public.provider_usage(user_id, created_at desc);

alter table public.provider_usage enable row level security;

create policy "provider_usage_select_own"
  on public.provider_usage for select
  using (auth.uid() = user_id);

create policy "provider_usage_insert_own"
  on public.provider_usage for insert
  with check (auth.uid() = user_id);

create policy "provider_usage_update_own"
  on public.provider_usage for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "provider_usage_delete_own"
  on public.provider_usage for delete
  using (auth.uid() = user_id);
