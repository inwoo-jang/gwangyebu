-- 관계부: 리마인더 보강 (제목, 장소, 함께하는 사람들)

alter table public.reminders
  add column if not exists title text,
  add column if not exists location text,
  add column if not exists co_person_ids uuid[] not null default '{}';

alter table public.reminders
  add constraint reminders_title_length
    check (title is null or char_length(title) <= 100),
  add constraint reminders_location_length
    check (location is null or char_length(location) <= 100);

-- 기존 message 길이 제한도 1000자로 완화 (메모성 길어질 수 있음)
alter table public.reminders
  drop constraint if exists reminders_message_length;

alter table public.reminders
  add constraint reminders_message_length
    check (message is null or char_length(message) <= 1000);
