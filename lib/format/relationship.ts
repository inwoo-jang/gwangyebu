/**
 * 도메인 enum → 한국어 라벨 매핑.
 */
import type {
  RelationshipType,
  ContactChannel,
  ContactDirection,
  ReminderType,
} from "@/lib/supabase/types"

export const RELATIONSHIP_TYPE_LABEL: Record<
  RelationshipType,
  { label: string; colorIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }
> = {
  family: { label: "가족", colorIndex: 1 },
  friend: { label: "친구", colorIndex: 3 },
  colleague: { label: "동료", colorIndex: 4 },
  client: { label: "고객사", colorIndex: 2 },
  acquaintance: { label: "지인", colorIndex: 5 },
  etc: { label: "기타", colorIndex: 8 },
}

export const RELATIONSHIP_TYPE_OPTIONS: {
  value: RelationshipType
  label: string
}[] = [
  { value: "family", label: "가족" },
  { value: "friend", label: "친구" },
  { value: "colleague", label: "동료" },
  { value: "client", label: "고객사" },
  { value: "acquaintance", label: "지인" },
  { value: "etc", label: "기타" },
]

export const CONTACT_CHANNEL_LABEL: Record<
  ContactChannel,
  { label: string; icon: string }
> = {
  phone: { label: "전화", icon: "📞" },
  kakao: { label: "카톡", icon: "💬" },
  sms: { label: "문자", icon: "✉" },
  email: { label: "이메일", icon: "📧" },
  inperson: { label: "대면", icon: "👥" },
  instagram_dm: { label: "인스타 DM", icon: "📷" },
  custom: { label: "직접입력", icon: "✏" },
  other: { label: "직접입력", icon: "✏" },
}

/** 사용자에게 보여줄 채널 옵션 — legacy 'other'는 제외. */
export const CONTACT_CHANNEL_OPTIONS: {
  value: ContactChannel
  label: string
}[] = [
  { value: "kakao", label: "카톡" },
  { value: "phone", label: "전화" },
  { value: "sms", label: "문자" },
  { value: "email", label: "이메일" },
  { value: "inperson", label: "대면" },
  { value: "instagram_dm", label: "인스타 DM" },
  { value: "custom", label: "직접입력" },
]

export const CONTACT_DIRECTION_LABEL: Record<ContactDirection, string> = {
  outbound: "보냄",
  inbound: "받음",
  unknown: "",
}

export const REMINDER_TYPE_LABEL: Record<
  ReminderType,
  { label: string; icon: string }
> = {
  followup: { label: "팔로우업", icon: "🔔" },
  birthday: { label: "생일", icon: "🎂" },
  event: { label: "기념일", icon: "🎉" },
  custom: { label: "직접", icon: "✏" },
}

export const MBTI_OPTIONS = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const
