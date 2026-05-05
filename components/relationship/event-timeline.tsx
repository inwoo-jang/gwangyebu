import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { ContactLogItem } from "@/components/relationship/contact-log-item"
import { NoteItem } from "@/components/relationship/note-item"
import { EmptyState } from "@/components/common/empty-state"
import type { ContactLog, Note } from "@/lib/supabase/types"

export type TimelineItem =
  | { kind: "contact"; data: ContactLog; ts: string }
  | { kind: "note"; data: Note; ts: string }

interface EventTimelineProps {
  items: TimelineItem[]
}

export function EventTimeline({ items }: EventTimelineProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="아직 기록이 없어요"
        description="연락 기록 또는 메모를 남겨보세요."
        size="sm"
      />
    )
  }

  // group by date (yyyy-MM-dd)
  const groups = new Map<string, TimelineItem[]>()
  for (const item of items) {
    const d = new Date(item.ts)
    const key = format(d, "yyyy-MM-dd")
    const arr = groups.get(key) ?? []
    arr.push(item)
    groups.set(key, arr)
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0,
  )

  return (
    <div className="space-y-5">
      {sortedKeys.map((key) => {
        const date = new Date(`${key}T00:00:00`)
        const dayLabel = format(date, "M월 d일 (eee)", { locale: ko })
        return (
          <section key={key} className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              {dayLabel}
            </h3>
            <div className="space-y-2">
              {groups.get(key)?.map((item, idx) => {
                if (item.kind === "contact") {
                  return (
                    <ContactLogItem
                      key={`c-${item.data.id ?? idx}`}
                      log={item.data}
                    />
                  )
                }
                return (
                  <NoteItem key={`n-${item.data.id ?? idx}`} note={item.data} />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
