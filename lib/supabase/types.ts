/**
 * Supabase DB 타입 placeholder.
 * TODO: `supabase gen types typescript --local > lib/supabase/database.types.ts` 로
 * 자동 생성된 타입으로 교체할 것.
 *
 * 현재는 핵심 엔티티의 수동 인터페이스만 노출한다.
 */

// ===== Enum 타입 =====
export type RelationshipType =
  | "family"
  | "friend"
  | "colleague"
  | "client"
  | "acquaintance"
  | "lover"
  | "crush"
  | "custom"
  | "etc"

export type PersonStatus = "active" | "inactive"

export type ContactChannel =
  | "phone"
  | "kakao"
  | "sms"
  | "email"
  | "inperson"
  | "instagram_dm"
  | "custom"
  /** @deprecated v6 이후 'custom'으로 표시. 데이터 호환을 위해 유지. */
  | "other"

export type ContactDirection = "outbound" | "inbound" | "unknown"

export type ReminderType = "followup" | "birthday" | "event" | "custom"
export type ReminderRepeat = "none" | "yearly"
export type ReminderChannel = "inapp" | "webpush" | "kakao"
export type ReminderStatus = "active" | "done" | "dismissed" | "snoozed"

export type EventType =
  | "wedding"
  | "funeral"
  | "firstbirthday"
  | "birthday"
  | "anniversary"
  | "other"

export type GiftDirection = "sent" | "received"
export type GiftKind = "cash" | "item"
export type LoanDirection = "lent" | "borrowed"

export type MessageSource = "kakao" | "sms" | "email" | "other"

export type AiProvider = "claude" | "gemini" | "auto" | "rule_based"
export type RecommendationStatus = "new" | "seen" | "accepted" | "dismissed"
export type AiFeedbackSignal =
  | "thumbs_up"
  | "thumbs_down"
  | "lower_priority"
  | "dismiss"

// ===== 엔티티 인터페이스 =====
export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  photo_url: string | null
  locale: string
  timezone: string
  onboarding: Record<string, unknown>
  ai_provider: AiProvider
  notification_prefs: NotificationPrefs
  created_at: string
  updated_at: string
}

export interface NotificationPrefs {
  reminders: boolean
  ai: boolean
  events: boolean
  quiet_hours: { start: string; end: string }
}

export interface Person {
  id: string
  user_id: string
  name: string
  /** 닉네임/애칭 */
  nickname: string | null
  photo_url: string | null
  /** "male" | "female" — 프로필 이미지 폴더 선택 */
  gender: "male" | "female"
  /** 1~30. /profiles/{gender}/{N}.png */
  profile_index: number
  /** 1~6. 파스텔 배경 팔레트 인덱스 */
  avatar_bg: number
  relationship_type: RelationshipType
  /** relationship_type='custom'일 때 사용자가 입력한 라벨 */
  relationship_label: string | null
  /** 휴대폰 번호 */
  phone_number: string | null
  /** 카톡 친구 목록에 보이는 이름 */
  kakao_nickname: string | null
  /** 인스타그램 핸들 (@ 없이) */
  instagram_handle: string | null
  birth_year: number | null
  birth_month: number | null
  birth_day: number | null
  mbti: string | null
  food_preference: string | null
  how_we_met: string | null
  memo: string | null
  reminder_interval_days: number
  last_contact_at: string | null
  status: PersonStatus
  /** 명함 이미지 URL (Storage public URL) */
  business_card_url: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

export interface PersonTag {
  person_id: string
  tag_id: string
  user_id: string
  created_at: string
}

export interface ContactLog {
  id: string
  user_id: string
  person_id: string
  channel: ContactChannel
  /** channel === "custom"일 때 사용자 입력 라벨 */
  custom_channel: string | null
  direction: ContactDirection
  occurred_at: string
  memo: string | null
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  person_id: string
  reminder_type: ReminderType
  scheduled_at: string
  repeat_rule: ReminderRepeat
  channel: ReminderChannel
  status: ReminderStatus
  /** 짧은 제목 (예: "민호 결혼식") */
  title: string | null
  /** 일정 장소 (예: "강남 메리어트") */
  location: string | null
  /** 함께하는 사람들 (메인 person_id 외) */
  co_person_ids: string[]
  message: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  person_id: string
  body: string
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface EventRecord {
  id: string
  user_id: string
  person_id: string
  event_type: EventType
  occurred_at: string
  location: string | null
  attended: boolean | null
  amount_paid: number | null
  memo: string | null
  created_at: string
}

export interface Gift {
  id: string
  user_id: string
  person_id: string
  linked_event_id: string | null
  direction: GiftDirection
  kind: GiftKind
  amount: number | null
  item_name: string | null
  estimated_value: number | null
  occurred_at: string
  reason: string | null
  notified_at: string | null
  created_at: string
}

export interface Loan {
  id: string
  user_id: string
  person_id: string
  direction: LoanDirection
  amount: number
  occurred_at: string
  due_at: string | null
  returned_at: string | null
  memo: string | null
  created_at: string
}

export interface Message {
  id: string
  user_id: string
  person_id: string
  source: MessageSource
  body: string | null
  image_url: string | null
  occurred_at: string
  created_at: string
}

export interface RelationshipScore {
  person_id: string
  user_id: string
  score: number
  factors: Record<string, unknown>
  last_reason: string | null
  provider: AiProvider
  computed_at: string
}

export interface Recommendation {
  id: string
  user_id: string
  person_id: string
  rank: number
  reason: string | null
  suggested_action: string | null
  week_of: string
  status: RecommendationStatus
  created_at: string
}

export interface AIFeedback {
  id: string
  user_id: string
  person_id: string | null
  recommendation_id: string | null
  signal: AiFeedbackSignal
  created_at: string
}

export interface ProviderUsage {
  id: string
  user_id: string
  provider: AiProvider
  model: string
  input_tokens: number
  output_tokens: number
  cost_micro_krw: number
  purpose: string | null
  created_at: string
}

export interface UserSettings {
  ai_provider: AiProvider
  notification_prefs: NotificationPrefs
  locale: string
  timezone: string
  display_name: string | null
}

// 추후 supabase gen types 결과를 다음 alias로 export 예정.
// 임시 generic Database 타입 (typed clients용)
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>
  }
}
