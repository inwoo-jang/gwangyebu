-- 관계부: 도메인 enum 타입 정의
-- 참고: docs/data-model.md §4

-- 인물
create type public.relationship_type as enum
  ('family', 'friend', 'colleague', 'client', 'acquaintance', 'etc');

create type public.person_status as enum ('active', 'inactive');

-- 연락
create type public.contact_channel as enum
  ('phone', 'kakao', 'sms', 'email', 'inperson', 'other');

create type public.contact_direction as enum
  ('outbound', 'inbound', 'unknown');

-- 리마인더
create type public.reminder_type as enum
  ('followup', 'birthday', 'event', 'custom');

create type public.reminder_repeat as enum ('none', 'yearly');

create type public.reminder_channel as enum ('inapp', 'webpush', 'kakao');

create type public.reminder_status as enum
  ('active', 'done', 'dismissed', 'snoozed');

-- 경조사
create type public.event_type as enum
  ('wedding', 'funeral', 'firstbirthday', 'birthday', 'anniversary', 'other');

-- 선물
create type public.gift_direction as enum ('sent', 'received');
create type public.gift_kind as enum ('cash', 'item');

-- 메시지
create type public.message_source as enum ('kakao', 'sms', 'email', 'other');

-- AI
create type public.ai_provider as enum
  ('claude', 'gemini', 'auto', 'rule_based');

create type public.recommendation_status as enum
  ('new', 'seen', 'accepted', 'dismissed');

create type public.ai_feedback_signal as enum
  ('thumbs_up', 'thumbs_down', 'lower_priority', 'dismiss');
