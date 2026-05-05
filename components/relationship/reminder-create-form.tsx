"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { createReminder } from "@/lib/actions/reminders"
import { toLocalInput } from "@/lib/format/date"
import type { ReminderType } from "@/lib/supabase/types"

interface ReminderCreateFormProps {
  personId: string
  trigger?: React.ReactNode
}

export function ReminderCreateForm({
  personId,
  trigger,
}: ReminderCreateFormProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState<ReminderType>("followup")
  const [scheduledLocal, setScheduledLocal] = React.useState(
    toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  )
  const [message, setMessage] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const submit = () => {
    const date = new Date(scheduledLocal)
    if (Number.isNaN(date.getTime())) {
      toast.error("일자가 올바르지 않아요")
      return
    }

    startTransition(async () => {
      const res = await createReminder({
        person_id: personId,
        reminder_type: type,
        scheduled_at: date.toISOString(),
        message: message.trim() || null,
        repeat_rule: type === "birthday" ? "yearly" : "none",
        channel: "inapp",
      })
      if (res.ok) {
        toast.success("리마인더가 추가되었어요")
        setOpen(false)
        setMessage("")
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-1">
            <Bell className="h-4 w-4" /> 리마인더
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>리마인더 추가</SheetTitle>
          <SheetDescription>
            언제 다시 연락할지 알려드릴게요.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-type">유형</Label>
            <Select
              id="r-type"
              value={type}
              onChange={(e) => setType(e.target.value as ReminderType)}
              options={[
                { value: "followup", label: "팔로우업" },
                { value: "birthday", label: "생일" },
                { value: "event", label: "기념일" },
                { value: "custom", label: "직접" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-when">일시</Label>
            <Input
              id="r-when"
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-msg">메시지 (선택)</Label>
            <Textarea
              id="r-msg"
              maxLength={200}
              placeholder="예: 생일 축하 카톡 보내기"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={submit}
              disabled={pending}
            >
              {pending ? "저장 중..." : "추가"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
