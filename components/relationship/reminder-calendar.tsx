"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { fullDateKo, timeKo } from "@/lib/format/date"
import { REMINDER_TYPE_LABEL } from "@/lib/format/relationship"
import type { ReminderType, ReminderStatus } from "@/lib/supabase/types"

export interface CalendarReminder {
  id: string
  scheduledAt: string
  reminderType: ReminderType
  message: string | null
  status: ReminderStatus
  personName: string
}

interface ReminderCalendarProps {
  reminders: CalendarReminder[]
  initialMonth?: Date
  onSelectReminder?: (id: string) => void
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

export function ReminderCalendar({
  reminders,
  initialMonth,
  onSelectReminder,
}: ReminderCalendarProps) {
  const [month, setMonth] = React.useState(() =>
    startOfMonth(initialMonth ?? new Date()),
  )
  const [selected, setSelected] = React.useState<Date | null>(() => new Date())

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarReminder[]>()
    for (const r of reminders) {
      const d = new Date(r.scheduledAt)
      const key = dayKey(d)
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime(),
      )
    }
    return map
  }, [reminders])

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`
  const firstDayOfWeek = month.getDay()
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
  const goToday = () => {
    const t = new Date()
    setMonth(startOfMonth(t))
    setSelected(t)
  }

  const selectedItems = selected ? byDay.get(dayKey(selected)) ?? [] : []

  // 도트 색: 지난 active=destructive, 오늘=primary, 미래=foreground/40
  function dotToneClass(items: CalendarReminder[]): string {
    const hasOverdue = items.some(
      (r) =>
        r.status === "active" &&
        new Date(r.scheduledAt).getTime() <
          new Date(today.toDateString()).getTime(),
    )
    if (hasOverdue) return "bg-destructive"
    return "bg-primary"
  }

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
        <button
          type="button"
          onClick={goToday}
          className="text-sm font-semibold tabular-nums hover:underline"
          aria-label="오늘로 이동"
        >
          {monthLabel}
        </button>
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
          if (!c) return <div key={idx} className="h-12 bg-card" />
          const isToday = isSameDay(c, today)
          const isSelected = selected != null && isSameDay(c, selected)
          const list = byDay.get(dayKey(c)) ?? []
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
              {list.length > 0 ? (
                <span className="mt-0.5 inline-flex items-center gap-0.5">
                  <span
                    className={cn(
                      "inline-flex h-1.5 w-1.5 rounded-full",
                      dotToneClass(list),
                    )}
                    aria-hidden
                  />
                  {list.length > 1 ? (
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {list.length}
                    </span>
                  ) : null}
                </span>
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
          {selectedItems.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              이 날 예정된 리마인더가 없어요.
            </p>
          ) : (
            <ul className="mt-1 space-y-1">
              {selectedItems.map((r) => {
                const typeInfo = REMINDER_TYPE_LABEL[r.reminderType]
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "rounded-md p-2 text-xs",
                      onSelectReminder
                        ? "cursor-pointer hover:bg-accent/30"
                        : "",
                      r.status === "done" ? "opacity-50 line-through" : "",
                    )}
                    onClick={() => onSelectReminder?.(r.id)}
                  >
                    <span className="mr-1" aria-hidden>
                      {typeInfo.icon}
                    </span>
                    <span className="font-medium">{r.personName}</span>
                    <span className="ml-1 text-muted-foreground tabular-nums">
                      {timeKo(r.scheduledAt)}
                    </span>
                    {r.message ? (
                      <p className="mt-0.5 text-muted-foreground line-clamp-2">
                        {r.message}
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
