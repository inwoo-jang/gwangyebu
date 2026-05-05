-- 관계부: 사용자 추가 설정 (디바이스 푸시 구독 등)
-- 핵심 알림/AI 선호는 public.users.notification_prefs / ai_provider 컬럼 사용.
-- 이 테이블은 디바이스별 Web Push 구독을 다중 보관한다.

create table public.user_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_push_subscriptions_endpoint_uniq unique (user_id, endpoint)
);

create index user_push_subscriptions_user_id_idx
  on public.user_push_subscriptions(user_id);

create trigger set_user_push_subscriptions_updated_at
  before update on public.user_push_subscriptions
  for each row execute function public.handle_updated_at();

alter table public.user_push_subscriptions enable row level security;

create policy "user_push_subscriptions_select_own"
  on public.user_push_subscriptions for select
  using (auth.uid() = user_id);

create policy "user_push_subscriptions_insert_own"
  on public.user_push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "user_push_subscriptions_update_own"
  on public.user_push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_push_subscriptions_delete_own"
  on public.user_push_subscriptions for delete
  using (auth.uid() = user_id);
