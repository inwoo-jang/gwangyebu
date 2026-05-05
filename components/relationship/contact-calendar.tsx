"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONTACT_CHANNEL_LABEL } from "@/lib/format/relationship"
import { fullDateKo, timeKo } from "@/lib/format/date"
import type { ContactChannel } from "@/lib/supabase/types"

export interface CalendarContact {
  id: string
  occurredAt: string
  channel: ContactChannel
  customChannel?: string | null
  memo: string | null
}

interface ContactCalendarProps {
  contacts: CalendarContact[]
  /** 초기 표시 월 (해당 월의 1일). 미지정 시 오늘. */
  initialMonth?: Date
  onSelectContact?: (id: string) => void
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function ContactCalendar({
  contacts,
  initialMonth,
  onSelectContact,
}: ContactCalendarProps) {
  const [month, setMonth] = React.useState(() =>
    startOfMonth(initialMonth ?? new Date()),
  )
  const [selected, setSelected] = React.useState<Date | null>(null)

  // 인덱싱: dayKey → contacts on that date
  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarContact[]>()
    for (const c of contacts) {
      const d = new Date(c.occurredAt)
      const key = dayKey(d)
      const arr = map.get(key) ?? []
      arr.push(c)
      map.set(key, arr)
    }
    // 같은 날 내에서 시간 오름차순
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() -
          new Date(b.occurredAt).getTime(),
      )
    }
    return map
  }, [contacts])

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`
  const firstDayOfWeek = month.getDay() // 0(일)~6(토)
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate()
  const today = new Date()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const goPrev = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  const goNext = () =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))

  const selectedContacts = selected ? byDay.get(dayKey(selected)) ?? [] : []

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={goPrev}
          aria-label="이전 달"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/30 tap"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold tabular-nums">{monthLabel}</h3>
        <button
          type="button"
          onClick={goNext}
          aria-label="다음 달"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/30 tap"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-2 pb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "h-7 text-center text-[11px] text-muted-foreground tabular-nums",
              i === 0 ? "text-destructive/80" : "",
              i === 6 ? "text-primary/80" : "",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/50 px-2 pb-2 rounded-md">
        {cells.map((c, idx) => {
          if (!c) {
            return <div key={idx} className="h-12 bg-card" />
          }
          const isToday = isSameDay(c, today)
          const isSelected = selected != null && isSameDay(c, selected)
          const list = byDay.get(dayKey(c)) ?? []
          const hasContact = list.length > 0
          const dow = c.getDay()
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelected(c)}
              className={cn(
                "h-12 flex flex-col items-center justify-start py-1 text-xs bg-card hover:bg-accent/30 transition-colors tap",
                isSelected ? "ring-2 ring-primary" : "",
              )}
            >
              <span
                className={cn(
                  "tabular-nums",
                  isToday
                    ? "rounded-full bg-primary text-primary-foreground px-1.5"
                    : dow === 0
                      ? "text-destructive/80"
                      : dow === 6
                        ? "text-primary/80"
                        : "text-foreground",
                )}
              >
                {c.getDate()}
              </span>
              {hasContact ? (
                <span
                  className="mt-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-primary"
                  aria-label={`${list.length}건 연락`}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {selected ? (
        <div className="border-t border-border px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {fullDateKo(selected.toISOString())}
          </p>
          {selectedContacts.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              이 날의 연락 기록이 없어요.
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {selectedContacts.map((c) => {
                const channelInfo = CONTACT_CHANNEL_LABEL[c.channel]
                const channelLabel =
                  c.channel === "custom" && c.customChannel
                    ? c.customChannel
                    : channelInfo.label
                return (
                  <li
                    key={c.id}
                    className={cn(
                      "rounded-md p-2 text-xs",
                      onSelectContact
                        ? "cursor-pointer hover:bg-accent/30"
                        : "",
                    )}
                    onClick={() => onSelectContact?.(c.id)}
                  >
                    <span className="mr-1" aria-hidden>
                      {channelInfo.icon}
                    </span>
                    <span className="font-medium">
                      {channelLabel}
                    </span>
                    <span className="ml-1 text-muted-foreground tabular-nums">
                      {timeKo(c.occurredAt)}
                    </span>
                    {c.memo ? (
                      <p className="mt-0.5 text-muted-foreground line-clamp-2">
                        {c.memo}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
