-- 관계부: 관계유형 enum 보강 (연인/썸/직접입력) + 사용자 라벨 컬럼

-- enum에 새 값 추가 (PostgreSQL 12+)
alter type public.relationship_type add value if not exists 'lover';
alter type public.relationship_type add value if not exists 'crush';
alter type public.relationship_type add value if not exists 'custom';

-- 직접입력용 라벨 (relationship_type='custom'일 때 사용자가 입력한 텍스트)
alter table public.persons
  add column if not exists relationship_label text;

alter table public.persons
  add constraint persons_relationship_label_length
    check (
      relationship_label is null
      or char_length(relationship_label) between 1 and 30
    );
