"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CONTACT_CHANNEL_OPTIONS,
} from "@/lib/format/relationship"
import { logContact } from "@/lib/actions/contacts"
import type { ContactChannel, ContactDirection } from "@/lib/supabase/types"

const DIRECTION_OPTIONS: { value: ContactDirection; label: string }[] = [
  { value: "outbound", label: "내가 먼저 (보냄)" },
  { value: "inbound", label: "상대가 먼저 (받음)" },
  { value: "unknown", label: "선택 안 함" },
]

interface LogContactDialogProps {
  personId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function LogContactDialog({
  personId,
  trigger,
  onSuccess,
}: LogContactDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [channel, setChannel] = React.useState<ContactChannel>("kakao")
  const [direction, setDirection] = React.useState<ContactDirection>(
    "outbound",
  )
  const [memo, setMemo] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const submit = () => {
    startTransition(async () => {
      const res = await logContact({
        person_id: personId,
        channel,
        direction,
        memo: memo.trim() ? memo.trim() : null,
        occurred_at: new Date().toISOString(),
      })
      if (res.ok) {
        toast.success("연락 기록이 추가되었어요")
        setOpen(false)
        setMemo("")
        onSuccess?.()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default" className="gap-1">
            💬 연락 기록
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>연락 기록 추가</DialogTitle>
          <DialogDescription>
            채널과 메모를 입력하면 마지막 연락일이 자동으로 갱신돼요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="log-channel">채널</Label>
            <Select
              id="log-channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value as ContactChannel)}
              options={CONTACT_CHANNEL_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="log-direction">방향</Label>
            <Select
              id="log-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value as ContactDirection)}
              options={DIRECTION_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="log-memo">메모 (선택)</Label>
            <Textarea
              id="log-memo"
              maxLength={500}
              placeholder="어떤 이야기를 나눴나요?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {memo.length}/500
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
