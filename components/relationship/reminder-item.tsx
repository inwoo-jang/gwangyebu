"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { REMINDER_TYPE_LABEL } from "@/lib/format/relationship"
import {
  fullDateKo,
  relativeKo,
  timeKo,
} from "@/lib/format/date"
import type { Reminder } from "@/lib/supabase/types"

interface ReminderItemProps {
  reminder: Reminder & { person_name?: string }
  onComplete?: () => void
  onSnooze?: () => void
}

export function ReminderItem({
  reminder,
  onComplete,
  onSnooze,
}: ReminderItemProps) {
  const typeInfo = REMINDER_TYPE_LABEL[reminder.reminder_type]
  const isDone = reminder.status === "done"
  const isSnoozed = reminder.status === "snoozed"

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        isDone
          ? "border-border opacity-60"
          : "border-border hover:bg-accent/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="text-xl"
          role="presentation"
        >
          {typeInfo.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/persons/${reminder.person_id}`}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {reminder.person_name ?? "인물"}
            </Link>
            <span className="text-xs text-muted-foreground">
              · {typeInfo.label}
            </span>
            {isSnoozed ? (
              <span className="text-xs text-warning">· 연기됨</span>
            ) : null}
            {isDone ? (
              <span className="text-xs text-muted-foreground line-through">
                완료
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-1 text-sm",
              isDone ? "line-through text-muted-foreground" : "text-foreground",
            )}
          >
            {reminder.message ?? "연락할 시간이에요"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {fullDateKo(reminder.scheduled_at)} · {timeKo(reminder.scheduled_at)}
            <span className="ml-1">({relativeKo(reminder.scheduled_at)})</span>
          </p>
        </div>
      </div>
      {!isDone ? (
        <div className="mt-3 flex gap-2">
          {onComplete ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onComplete}
              className="gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              완료
            </Button>
          ) : null}
          {onSnooze ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSnooze}
              className="gap-1"
            >
              <Clock className="h-3.5 w-3.5" />
              내일로 연기
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
