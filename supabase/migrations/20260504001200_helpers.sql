-- 관계부: 추가 헬퍼 함수 (도메인 로직)
-- 주의: handle_updated_at()은 20260504000000_extensions.sql 에 정의됨

-- ContactLog 변경 시 Person.last_contact_at 재계산
create or replace function public.update_person_last_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_person_id uuid;
begin
  if (tg_op = 'DELETE') then
    target_person_id := old.person_id;
  else
    target_person_id := new.person_id;
  end if;

  update public.persons
     set last_contact_at = (
       select max(occurred_at)
         from public.contacts_log
        where person_id = target_person_id
     ),
     updated_at = now()
   where id = target_person_id;

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

create trigger trg_contacts_log_update_last_contact
  after insert or update or delete on public.contacts_log
  for each row execute function public.update_person_last_contact();

-- 회원가입 시 public.users 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name',
             new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
