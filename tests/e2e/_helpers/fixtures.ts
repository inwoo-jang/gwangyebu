/**
 * E2E 공용 픽스처 — 인물·리마인더·태그·연락 로그 샘플.
 *
 * 시드/네트워크 mock 양쪽에서 재사용하기 위해 평문 객체로 정의.
 */

export const FIXTURE_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "qa@example.com",
  display_name: "QA 테스터",
}

export const FIXTURE_PERSONS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "김지수",
    relationship_type: "friend" as const,
    mbti: "ENFP",
    memo: "동아리에서 만난 친구",
    last_contact_at: "2026-04-30T09:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "박민준",
    relationship_type: "colleague" as const,
    mbti: "ISTJ",
    memo: null,
    last_contact_at: "2026-03-12T09:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "최수아",
    relationship_type: "family" as const,
    mbti: null,
    memo: "사촌 누나",
    last_contact_at: null,
  },
]

export const FIXTURE_TAGS = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "친한친구" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "회사" },
  { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "가족" },
]

export const FIXTURE_CONTACT_LOGS = [
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    person_id: FIXTURE_PERSONS[0].id,
    channel: "kakao" as const,
    direction: "outbound" as const,
    occurred_at: "2026-04-30T09:00:00.000Z",
    memo: "안부 인사",
  },
]

export const FIXTURE_REMINDERS = [
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    person_id: FIXTURE_PERSONS[1].id,
    person_name: "박민준",
    reminder_type: "followup" as const,
    scheduled_at: "2026-05-05T09:00:00.000Z",
    repeat_rule: "none" as const,
    channel: "inapp" as const,
    status: "active" as const,
    message: "오랜만에 안부 전해보기",
  },
]

/**
 * AI 분석 결과 fixture (RelationshipScoreRecord 형태).
 */
export const FIXTURE_AI_ANALYSIS = {
  person_id: FIXTURE_PERSONS[0].id,
  user_id: FIXTURE_USER.id,
  score: 72,
  factors: { last_contact_days: 4, balance: "even" },
  last_reason: "최근 카톡으로 활발히 연락하고 있어요. 다음 주 한 번 더 챙겨보세요.",
  provider: "claude" as const,
  model: "claude-sonnet-4-5",
  computed_at: "2026-05-04T00:00:00.000Z",
}
