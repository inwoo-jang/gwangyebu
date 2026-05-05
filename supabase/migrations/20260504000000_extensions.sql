-- 관계부: 필요한 확장 기능 활성화 + 공통 헬퍼 함수
-- pgcrypto: gen_random_uuid()
-- citext: 대소문자 무시 텍스트 (필요 시)

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- updated_at 자동 갱신 트리거 함수 (모든 테이블 공용)
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
