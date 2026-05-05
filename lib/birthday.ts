/**
 * 생일 임박 탐지 유틸.
 *
 * - 인물의 birth_month/birth_day로 올해(혹은 내년 초반)의 다가오는 생일 계산
 * - "주고받은 이력이 있는지"는 호출 측에서 gifts 배열을 검사
 */

import type { GuestGift, GuestPerson } from "@/lib/guest/types"

export interface UpcomingBirthday {
  person: GuestPerson
  /** 다가오는 생일의 ISO 날짜 (이번주/내년 등 가장 가까운 미래) */
  nextBirthday: string
  /** 오늘부터 며칠 남았는지 (0=오늘) */
  daysUntil: number
  /** 이 사람과 선물을 주고받은 이력이 있는지 */
  hasGiftHistory: boolean
  /** 받은 선물 건수 (오늘 기준 과거) */
  receivedCount: number
  /** 보낸 선물 건수 */
  sentCount: number
}

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

/**
 * 오늘 자정 기준으로 다가오는 생일을 계산.
 * birth_month/birth_day가 오늘보다 과거면 내년으로 넘김.
 * 윤년 2/29의 경우 당해 2월 마지막날(2/28 또는 2/29)로 보정.
 */
function nextBirthdayDate(
  month: number,
  day: number,
  today: Date = new Date(),
): Date | null {
  if (!month || !day) return null
  const year = today.getFullYear()
  const todayStart = new Date(year, today.getMonth(), today.getDate())

  function safeDate(y: number, m: number, d: number): Date {
    // 2/29가 평년이면 2/28로 폴백
    const candidate = new Date(y, m - 1, d)
    if (candidate.getMonth() !== m - 1) {
      // 윤년 보정 (예: 비윤년의 2/29 → 2/28)
      return new Date(y, m - 1, 0) // 이전 달 마지막날 → m-1의 28일
    }
    return candidate
  }

  const thisYear = safeDate(year, month, day)
  if (thisYear.getTime() >= todayStart.getTime()) return thisYear
  return safeDate(year + 1, month, day)
}

export function findUpcomingBirthdays(
  persons: GuestPerson[],
  gifts: GuestGift[],
  options: { withinDays?: number } = {},
): UpcomingBirthday[] {
  const withinDays = options.withinDays ?? 30
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const giftCountByPerson = new Map<string, { sent: number; received: number }>()
  for (const g of gifts) {
    const acc = giftCountByPerson.get(g.person_id) ?? { sent: 0, received: 0 }
    if (g.direction === "sent") acc.sent += 1
    else acc.received += 1
    giftCountByPerson.set(g.person_id, acc)
  }

  const out: UpcomingBirthday[] = []
  for (const p of persons) {
    if (!p.birth_month || !p.birth_day) continue
    const next = nextBirthdayDate(p.birth_month, p.birth_day, today)
    if (!next) continue
    const days = Math.round(
      (next.getTime() - todayStart.getTime()) / 86_400_000,
    )
    if (days < 0 || days > withinDays) continue
    const counts = giftCountByPerson.get(p.id) ?? { sent: 0, received: 0 }
    out.push({
      person: p,
      nextBirthday: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
      daysUntil: days,
      hasGiftHistory: counts.sent + counts.received > 0,
      sentCount: counts.sent,
      receivedCount: counts.received,
    })
  }
  out.sort((a, b) => a.daysUntil - b.daysUntil)
  return out
}

export function describeDaysUntil(daysUntil: number): string {
  if (daysUntil === 0) return "오늘"
  if (daysUntil === 1) return "내일"
  if (daysUntil <= 7) return `${daysUntil}일 뒤`
  if (daysUntil <= 30) return `${daysUntil}일 뒤`
  return `${daysUntil}일 뒤`
}
