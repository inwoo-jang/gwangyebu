-- 관계부: Storage 버킷
-- business-cards: 명함 이미지 (9:5 비율, 800×444 JPEG)
-- 사용자별 폴더: {user_id}/{person_id}.jpg

insert into storage.buckets (id, name, public)
values ('business-cards', 'business-cards', true)
on conflict (id) do nothing;

-- RLS: 사용자는 본인 폴더에서만 read/write
create policy "business_cards_select_own"
  on storage.objects for select
  using (
    bucket_id = 'business-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "business_cards_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'business-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "business_cards_update_own"
  on storage.objects for update
  using (
    bucket_id = 'business-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "business_cards_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'business-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
