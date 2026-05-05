/**
 * 게스트 모드용 룰 기반 관계 건강도 산출.
 *
 * AI 호출 없이 빠르게 점수와 한 줄 코멘트를 만든다.
 * - 마지막 연락 후 경과일 / 리마인더 주기 비율로 기본점수
 * - 메모/연락 이력 누적 시 보너스
 * - 0~100 클램프
 */

import type {
  GuestContactLog,
  GuestNote,
  GuestPerson,
  GuestRelationshipScore,
} from "./types"

export interface AnalyzeInput {
  person: GuestPerson
  contacts: GuestContactLog[]
  notes: GuestNote[]
}

export function analyzePerson({
  person,
  contacts,
  notes,
}: AnalyzeInput): GuestRelationshipScore {
  const last = person.last_contact_at
    ? new Date(person.last_contact_at).getTime()
    : 0
  const days = last ? Math.floor((Date.now() - last) / 86_400_000) : 999
  const interval = person.reminder_interval_days || 30
  let score = Math.max(
    0,
    Math.min(100, Math.round(100 - (days / interval) * 60)),
  )
  if (notes.length > 0) score += 5
  if (contacts.length >= 3) score += 5
  score = Math.max(0, Math.min(100, score))
  const reason =
    days >= interval
      ? `마지막 연락 후 ${days}일 — 안부 한 번 전해보세요.`
      : "최근 연락이 잘 유지되고 있어요."
  return {
    person_id: person.id,
    score,
    factors: {
      days,
      interval,
      contacts: contacts.length,
      notes: notes.length,
    },
    last_reason: reason,
    provider: "rule_based",
    computed_at: new Date().toISOString(),
  }
}
