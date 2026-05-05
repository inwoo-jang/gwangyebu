-- 관계부: persons 테이블 보강 (게스트 모드 기능 패리티)
-- 닉네임, 아바타 선택(gender/profile_index/avatar_bg),
-- 휴대폰/카톡/인스타그램, 명함 이미지

alter table public.persons
  add column if not exists nickname text,
  add column if not exists gender text not null default 'female',
  add column if not exists profile_index int not null default 1,
  add column if not exists avatar_bg int not null default 1,
  add column if not exists phone_number text,
  add column if not exists kakao_nickname text,
  add column if not exists instagram_handle text,
  add column if not exists business_card_url text;

alter table public.persons
  add constraint persons_nickname_length
    check (nickname is null or char_length(nickname) between 1 and 30),
  add constraint persons_gender_values
    check (gender in ('female', 'male')),
  add constraint persons_profile_index_range
    check (profile_index between 1 and 30),
  add constraint persons_avatar_bg_range
    check (avatar_bg between 1 and 6),
  add constraint persons_phone_number_length
    check (phone_number is null or char_length(phone_number) <= 20),
  add constraint persons_kakao_nickname_length
    check (kakao_nickname is null or char_length(kakao_nickname) between 1 and 50),
  add constraint persons_instagram_handle_length
    check (instagram_handle is null or char_length(instagram_handle) between 1 and 30);

-- 이름/닉네임 검색은 ilike 기반. (B-tree로는 LIKE 'foo%'만 가속, 부분일치는 풀스캔)
-- 사용자별 인물수가 많지 않아 별도 인덱스 없이 RLS 필터링으로 충분.
