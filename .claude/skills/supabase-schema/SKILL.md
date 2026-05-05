---
name: supabase-schema
description: Supabase Postgres 스키마 마이그레이션, RLS 정책, 트리거를 작성한다. user_id 기반 멀티테넌시, updated_at 자동 갱신, 인덱스 패턴 포함. "Supabase 스키마", "RLS", "마이그레이션" 요청에 사용.
---

# Supabase 스키마 스킬

## 디렉토리

`supabase/migrations/{YYYYMMDDHHMMSS}_{name}.sql`

## 표준 테이블 패턴

```sql
create table public.persons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  nickname text,
  mbti text,
  birthday date,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index persons_user_id_idx on public.persons(user_id);
create index persons_last_contacted_at_idx on public.persons(user_id, last_contacted_at desc);

alter table public.persons enable row level security;

create policy "users can read own persons"
  on public.persons for select
  using (auth.uid() = user_id);

create policy "users can insert own persons"
  on public.persons for insert
  with check (auth.uid() = user_id);

create policy "users can update own persons"
  on public.persons for update
  using (auth.uid() = user_id);

create policy "users can delete own persons"
  on public.persons for delete
  using (auth.uid() = user_id);
```

## updated_at 트리거

```sql
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.persons
  for each row execute function public.handle_updated_at();
```

## 규칙

- **모든 테이블 RLS 활성화** + 4개 정책 (select/insert/update/delete) 명시
- `user_id`는 `not null references auth.users(id) on delete cascade`
- 자주 조회되는 컬럼에 복합 인덱스 (`user_id, sort_column`)
- enum은 Postgres `create type` 또는 `text` + `check` 제약
- 외래키는 항상 명시
- JSON은 `jsonb` 사용
- 마이그레이션은 idempotent하지 않아도 됨 (한 번만 실행)
