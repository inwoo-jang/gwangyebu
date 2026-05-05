import type {
  GuestContactLog,
  GuestEvent,
  GuestGift,
  GuestLoan,
  GuestNote,
  GuestPerson,
  GuestPersonTag,
  GuestReminder,
  GuestState,
  GuestTag,
} from "./types"

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

function daysAhead(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString()
}

export function buildSeed(): Pick<
  GuestState,
  | "persons"
  | "tags"
  | "personTags"
  | "contacts"
  | "reminders"
  | "notes"
  | "events"
  | "gifts"
  | "loans"
  | "scores"
> {
  const now = new Date().toISOString()

  const tagFriend: GuestTag = {
    id: uid(),
    name: "친구",
    color: null,
    created_at: now,
  }
  const tagWork: GuestTag = {
    id: uid(),
    name: "직장",
    color: null,
    created_at: now,
  }
  const tagFamily: GuestTag = {
    id: uid(),
    name: "가족",
    color: null,
    created_at: now,
  }

  const p1: GuestPerson = {
    id: uid(),
    name: "김지수",
    nickname: "지수",
    photo_url: null,
    gender: "female",
    profile_index: 3,
    avatar_bg: 1,
    relationship_type: "friend",
    phone_number: "01012345678",
    instagram_handle: "jisoo.kim",
    kakao_nickname: "지수🌸",
    birth_year: 1995,
    birth_month: 5,
    birth_day: 12,
    mbti: "ENFP",
    food_preference: "매운 음식 안 먹음",
    how_we_met: "대학교 동아리",
    memo: "최근 이직 준비 중",
    reminder_interval_days: 30,
    last_contact_at: daysAgo(12),
    status: "active",
    business_card_url: null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  }
  const p2: GuestPerson = {
    id: uid(),
    name: "이민호",
    nickname: "민호 과장",
    photo_url: null,
    gender: "male",
    profile_index: 5,
    avatar_bg: 4,
    relationship_type: "colleague",
    phone_number: "01098765432",
    instagram_handle: null,
    kakao_nickname: "이민호 과장",
    birth_year: 1990,
    birth_month: 11,
    birth_day: 3,
    mbti: "ISTJ",
    food_preference: null,
    how_we_met: "이전 직장 동료",
    memo: null,
    reminder_interval_days: 60,
    last_contact_at: daysAgo(45),
    status: "active",
    business_card_url: null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  }
  const p3: GuestPerson = {
    id: uid(),
    name: "엄마",
    nickname: null,
    photo_url: null,
    gender: "female",
    profile_index: 12,
    avatar_bg: 6,
    relationship_type: "family",
    phone_number: "01055555555",
    instagram_handle: null,
    kakao_nickname: null,
    birth_year: 1965,
    birth_month: 3,
    birth_day: 22,
    mbti: null,
    food_preference: null,
    how_we_met: null,
    memo: "건강식 좋아하심",
    reminder_interval_days: 7,
    last_contact_at: daysAgo(3),
    status: "active",
    business_card_url: null,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  }

  const personTags: GuestPersonTag[] = [
    { person_id: p1.id, tag_id: tagFriend.id, created_at: now },
    { person_id: p2.id, tag_id: tagWork.id, created_at: now },
    { person_id: p3.id, tag_id: tagFamily.id, created_at: now },
  ]

  const contacts: GuestContactLog[] = [
    {
      id: uid(),
      person_id: p1.id,
      channel: "kakao",
      custom_channel: null,
      direction: "outbound",
      occurred_at: daysAgo(12),
      memo: "안부 연락",
      created_at: daysAgo(12),
    },
    {
      id: uid(),
      person_id: p2.id,
      channel: "phone",
      custom_channel: null,
      direction: "inbound",
      occurred_at: daysAgo(45),
      memo: "프로젝트 문의",
      created_at: daysAgo(45),
    },
    {
      id: uid(),
      person_id: p3.id,
      channel: "phone",
      custom_channel: null,
      direction: "outbound",
      occurred_at: daysAgo(3),
      memo: null,
      created_at: daysAgo(3),
    },
  ]

  const reminders: GuestReminder[] = [
    {
      id: uid(),
      person_id: p2.id,
      reminder_type: "followup",
      scheduled_at: daysAhead(2),
      repeat_rule: "none",
      channel: "inapp",
      status: "active",
      message: "오랜만에 안부 전하기",
      completed_at: null,
      created_at: now,
      updated_at: now,
    },
  ]

  const notes: GuestNote[] = [
    {
      id: uid(),
      person_id: p1.id,
      body: "다음에 만날 때 추천한 책 빌려주기로 함",
      pinned: false,
      created_at: daysAgo(20),
      updated_at: daysAgo(20),
    },
  ]

  // 경조사 (이민호 결혼식 참석 + 축의금)
  const events: GuestEvent[] = [
    {
      id: uid(),
      person_id: p2.id,
      event_type: "wedding",
      occurred_at: daysAgo(180),
      amount: 100_000,
      direction: "sent",
      attended: true,
      location: "강남 메리어트",
      memo: "동기들과 같이 참석",
      created_at: daysAgo(180),
    },
  ]

  // 선물 (지수 생일선물 받음 / 보냄)
  const gifts: GuestGift[] = [
    {
      id: uid(),
      person_id: p1.id,
      direction: "sent",
      kind: "item",
      amount: null,
      item_name: "향초 세트",
      occasion: "생일",
      occurred_at: daysAgo(60),
      notified_at: daysAgo(63),
      linked_event_id: null,
      memo: "지수가 좋아하는 우드 향",
      created_at: daysAgo(60),
    },
    {
      id: uid(),
      person_id: p3.id,
      direction: "received",
      kind: "item",
      amount: null,
      item_name: "용돈",
      occasion: "생일",
      occurred_at: daysAgo(40),
      notified_at: null,
      linked_event_id: null,
      memo: "엄마가 챙겨주신 용돈",
      created_at: daysAgo(40),
    },
  ]

  // 대여 (지수에게 5만원 빌려줌, 미회수)
  const loans: GuestLoan[] = [
    {
      id: uid(),
      person_id: p1.id,
      direction: "lent",
      amount: 50_000,
      occurred_at: daysAgo(15),
      due_at: null,
      returned_at: null,
      memo: "택시비 잠깐 빌려줌",
      created_at: daysAgo(15),
    },
  ]

  return {
    persons: [p1, p2, p3],
    tags: [tagFriend, tagWork, tagFamily],
    personTags,
    contacts,
    reminders,
    notes,
    events,
    gifts,
    loans,
    scores: [],
  }
}
