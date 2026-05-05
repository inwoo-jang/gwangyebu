/**
 * 한국어 날짜 포맷 유틸.
 */
import { ko } from "date-fns/locale"
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  differenceInDays,
} from "date-fns"

export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "3일 전", "내일", "오늘" */
export function relativeKo(value: Date | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return "기록 없음"
  if (isToday(d)) return "오늘"
  if (isTomorrow(d)) return "내일"
  if (isYesterday(d)) return "어제"
  return formatDistanceToNow(d, { addSuffix: true, locale: ko })
}

/** "마지막 연락 12일 전" 포맷 */
export function daysAgoKo(
  value: Date | string | null | undefined,
): string {
  const d = toDate(value)
  if (!d) return "기록 없음"
  const diff = differenceInDays(new Date(), d)
  if (diff <= 0) return "오늘"
  if (diff === 1) return "1일 전"
  return `${diff}일 전`
}

/** "2026년 5월 4일 (월)" */
export function fullDateKo(value: Date | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return ""
  return format(d, "yyyy년 M월 d일 (eee)", { locale: ko })
}

/** "오후 3:24" */
export function timeKo(value: Date | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return ""
  return format(d, "a h:mm", { locale: ko })
}

/** "5월 4일" — 짧은 월일 */
export function shortDateKo(value: Date | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return ""
  return format(d, "M월 d일", { locale: ko })
}

/** datetime-local input value */
export function toLocalInput(value: Date | string | null | undefined): string {
  const d = toDate(value) ?? new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 0시0분 기준 오늘 시작 */
export function startOfTodayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
