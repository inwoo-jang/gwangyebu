"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ReminderItem } from "@/components/relationship/reminder-item"
import { completeReminder, createReminder } from "@/lib/actions/reminders"
import type { Reminder } from "@/lib/supabase/types"

interface ReminderListItemProps {
  reminder: Reminder & { person_name: string }
}

export function ReminderListItem({ reminder }: ReminderListItemProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const onComplete = () => {
    startTransition(async () => {
      const res = await completeReminder({ id: reminder.id })
      if (res.ok) {
        toast.success("리마인더를 완료했어요")
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  const onSnooze = () => {
    startTransition(async () => {
      // 현재 active를 완료시키고 +1d로 신규 생성
      await completeReminder({ id: reminder.id })
      const next = new Date(reminder.scheduled_at)
      next.setDate(next.getDate() + 1)
      const res = await createReminder({
        person_id: reminder.person_id,
        reminder_type: reminder.reminder_type,
        scheduled_at: next.toISOString(),
        repeat_rule: reminder.repeat_rule,
        channel: reminder.channel,
        message: reminder.message ?? null,
      })
      if (res.ok) {
        toast.success("내일로 연기되었어요")
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  return (
    <div aria-busy={pending}>
      <ReminderItem
        reminder={reminder}
        onComplete={onComplete}
        onSnooze={onSnooze}
      />
    </div>
  )
}
