-- 관계부: gifts.notified_at 보강
-- 선물 준비 메시지를 상대에게 보냈는지 여부 (게스트 모드 패리티)

alter table public.gifts
  add column if not exists notified_at timestamptz;
