/**
 * 게스트 모드 데이터 타입.
 *
 * Supabase DB 타입(`lib/supabase/types.ts`)을 가능한 한 미러링하지만,
 * - user_id 필드는 제거 (게스트 모드는 단일 사용자)
 * - id는 string (crypto.randomUUID() 또는 nanoid 형식)
 * - 날짜는 ISO 문자열
 */
import type {
  RelationshipType,
  PersonStatus,
  ContactChannel,
  ContactDirection,
  ReminderType,
  ReminderRepeat,
  ReminderChannel,
  ReminderStatus,
  EventType,
  AiProvider,
  NotificationPrefs,
} from "@/lib/supabase/types"

export type ExchangeDirection = "sent" | "received"
export type LoanDirection = "lent" | "borrowed"
export type GiftKind = "cash" | "item"

export interface GuestPerson {
  id: string
  name: string
  /** 닉네임/애칭 (예: "지수", "민호 형") */
  nickname: string | null
  photo_url: string | null
  /** "male" | "female" — 프로필 이미지 폴더 선택 */
  gender: "male" | "female"
  /** 1~30. /profiles/{gender}/{N}.png */
  profile_index: number
  /** 1~6. 파스텔 배경 팔레트 인덱스 */
  avatar_bg: number
  relationship_type: RelationshipType
  /** 휴대폰 번호 (저장 형식: 숫자만 또는 하이픈 포함, 사용 시 포매팅) */
  phone_number: string | null
  /**
   * 카톡 친구 목록에 보이는 이름.
   * - 전화번호로 카톡과 연동돼 있으면: 전화번호부에 저장한 이름
   * - 아니면: 친구가 본인이 직접 설정한 닉네임
   * 사용자가 카톡 검색창에서 이 이름으로 친구를 찾을 수 있게 함.
   */
  kakao_nickname: string | null
  /** 인스타그램 핸들 (예: jisoo.kim) — @ 없이 저장 */
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
  /**
   * 명함 이미지 (JPEG base64 dataURL).
   * 9:5 한국 명함 비율로 자동 크롭됨. localStorage 용량 절약을 위해
   * 800×444 JPEG q=0.85로 다운샘플링.
   */
  business_card_url: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface GuestTag {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface GuestPersonTag {
  person_id: string
  tag_id: string
  created_at: string
}

export interface GuestContactLog {
  id: string
  person_id: string
  channel: ContactChannel
  /** channel === "custom"일 때 사용자가 입력한 채널 라벨 */
  custom_channel: string | null
  direction: ContactDirection
  occurred_at: string
  memo: string | null
  created_at: string
}

export interface GuestReminder {
  id: string
  person_id: string
  reminder_type: ReminderType
  scheduled_at: string
  repeat_rule: ReminderRepeat
  channel: ReminderChannel
  status: ReminderStatus
  message: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface GuestNote {
  id: string
  person_id: string
  body: string
  pinned: boolean
  created_at: string
  updated_at: string
}

/**
 * 경조사 (결혼/장례/생일/돌 등). 경조사비 금액과 참석 여부를 함께 추적.
 */
export interface GuestEvent {
  id: string
  person_id: string
  event_type: EventType
  occurred_at: string
  /** 경조사비 금액 (KRW). null이면 미입력 */
  amount: number | null
  /** 보냈는지 받았는지. null이면 단순 "참석" 기록 */
  direction: ExchangeDirection | null
  attended: boolean | null
  location: string | null
  memo: string | null
  created_at: string
}

/**
 * 선물 (생일선물 / 취업선물 / 기타).
 *
 * 선물은 금액 비교가 무의미해서 "항목/사유/날짜/메시지 보냄 여부"가 핵심.
 * - amount는 옵션 (사용자가 가격을 적고 싶을 때만)
 * - notified_at: "곧 선물 보낼게~" 같은 준비 메시지를 상대에게 보낸 시각.
 *   null이면 아직 안 보냄.
 */
export interface GuestGift {
  id: string
  person_id: string
  direction: ExchangeDirection
  kind: GiftKind
  /** (선택) 추정가/금액 — 표시는 부수적 */
  amount: number | null
  /** 물건/현금 항목 이름 (예: "향초 세트", "스타벅스 기프티콘") */
  item_name: string | null
  occasion: string | null
  occurred_at: string
  /** 선물 준비 메시지를 상대에게 보낸 시각. null이면 미발송 */
  notified_at: string | null
  /** 연결된 GuestEvent.id (옵션) */
  linked_event_id: string | null
  memo: string | null
  created_at: string
}

/**
 * 돈 빌려준/빌린 기록. 회수 상태 추적.
 */
export interface GuestLoan {
  id: string
  person_id: string
  direction: LoanDirection
  amount: number
  /** 빌려준/빌린 날짜 */
  occurred_at: string
  /** 약속 회수일 (옵션) */
  due_at: string | null
  /** 실제 회수/상환 완료일 (null이면 미회수) */
  returned_at: string | null
  memo: string | null
  created_at: string
}

export interface GuestRelationshipScore {
  person_id: string
  score: number
  factors: Record<string, unknown>
  last_reason: string | null
  provider: AiProvider
  computed_at: string
}

export interface GuestSettings {
  display_name: string | null
  ai_provider: AiProvider
  notification_prefs: NotificationPrefs
  locale: string
  timezone: string
}

export interface GuestState {
  persons: GuestPerson[]
  tags: GuestTag[]
  personTags: GuestPersonTag[]
  contacts: GuestContactLog[]
  reminders: GuestReminder[]
  notes: GuestNote[]
  events: GuestEvent[]
  gifts: GuestGift[]
  loans: GuestLoan[]
  scores: GuestRelationshipScore[]
  settings: GuestSettings
  /** 첫 진입 시 시드 1회 적용 여부 */
  seeded: boolean
}

export const GUEST_STORAGE_KEY = "gwangyebu-guest-v1"
export const GUEST_COOKIE_NAME = "guestMode"
