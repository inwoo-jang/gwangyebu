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
import { PersonSelect } from "@/components/relationship/person-select"
import { PersonMultiSelect } from "@/components/relationship/person-multi-select"
import { createReminder } from "@/lib/actions/reminders"
import { toLocalInput } from "@/lib/format/date"
import type {
  Person,
  ReminderType,
  ReminderChannel,
} from "@/lib/supabase/types"

interface ReminderCreateFormProps {
  /** 인물 상세에서 호출 시 고정. 없으면 폼 안에서 인물 선택. */
  personId?: string
  /** 인물 미고정 모드에서 후보 인물 목록 */
  availablePersons?: Person[]
  /** 외부에서 시트 자동 오픈 (예: /reminders?add=1) */
  defaultOpen?: boolean
  trigger?: React.ReactNode
  /** 시트 닫힘을 외부에서 알고 싶을 때 */
  onClose?: () => void
}

export function ReminderCreateForm({
  personId,
  availablePersons,
  defaultOpen,
  trigger,
  onClose,
}: ReminderCreateFormProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(defaultOpen ?? false)
  React.useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen])

  const [selectedPersonId, setSelectedPersonId] = React.useState<string>(
    personId ?? "",
  )
  React.useEffect(() => {
    if (personId) setSelectedPersonId(personId)
  }, [personId])

  const [type, setType] = React.useState<ReminderType>("followup")
  const [channel, setChannel] = React.useState<ReminderChannel>("inapp")
  const [scheduledLocal, setScheduledLocal] = React.useState(
    toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  )
  const [title, setTitle] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [coPersonIds, setCoPersonIds] = React.useState<string[]>([])
  const [message, setMessage] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const handleClose = (next: boolean) => {
    setOpen(next)
    if (!next) onClose?.()
  }

  const reset = () => {
    setType("followup")
    setChannel("inapp")
    setScheduledLocal(
      toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    )
    setTitle("")
    setLocation("")
    setCoPersonIds([])
    setMessage("")
  }

  const submit = () => {
    if (!selectedPersonId) {
      toast.error("인물을 선택해 주세요")
      return
    }
    const date = new Date(scheduledLocal)
    if (Number.isNaN(date.getTime())) {
      toast.error("일자가 올바르지 않아요")
      return
    }

    startTransition(async () => {
      const res = await createReminder({
        person_id: selectedPersonId,
        reminder_type: type,
        scheduled_at: date.toISOString(),
        repeat_rule: type === "birthday" ? "yearly" : "none",
        channel,
        title: title.trim() || null,
        location: location.trim() || null,
        co_person_ids: coPersonIds,
        message: message.trim() || null,
      })
      if (res.ok) {
        toast.success("리마인더가 추가되었어요")
        handleClose(false)
        reset()
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  const isPersonFixed = Boolean(personId)

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-1">
            <Bell className="h-4 w-4" /> 리마인더
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>리마인더 추가</SheetTitle>
          <SheetDescription>
            언제·누구에게·어디서 — 자세한 일정도 챙길 수 있어요.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {!isPersonFixed && availablePersons && availablePersons.length > 0 ? (
            <div className="space-y-1.5">
              <Label>
                대상 인물 <span className="text-destructive">*</span>
              </Label>
              <PersonSelect
                persons={availablePersons}
                value={selectedPersonId}
                onChange={setSelectedPersonId}
                placeholder="인물 선택 (필수)"
              />
              {!selectedPersonId ? (
                <p className="text-[11px] text-warning">
                  인물을 먼저 선택해 주세요.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
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
              <Label htmlFor="r-channel">알림 채널</Label>
              <Select
                id="r-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as ReminderChannel)}
                options={[
                  { value: "inapp", label: "앱 내" },
                  { value: "webpush", label: "웹 푸시" },
                  { value: "kakao", label: "카카오 알림" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-title">제목</Label>
            <Input
              id="r-title"
              maxLength={100}
              placeholder="예: 민호 결혼식, 지수 생일 카톡"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-when">일시 *</Label>
            <Input
              id="r-when"
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-loc">장소</Label>
            <Input
              id="r-loc"
              maxLength={100}
              placeholder="예: 강남 메리어트 그랜드볼룸"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {availablePersons && availablePersons.length > 1 ? (
            <div className="space-y-1.5">
              <Label>함께하는 사람</Label>
              <PersonMultiSelect
                persons={availablePersons}
                values={coPersonIds}
                onChange={setCoPersonIds}
                excludeIds={
                  selectedPersonId ? [selectedPersonId] : undefined
                }
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="r-msg">메모</Label>
            <Textarea
              id="r-msg"
              rows={3}
              maxLength={1000}
              placeholder="예: 축의금 10만원 / 같이 갈 사람 약속 잡기"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2 pb-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => handleClose(false)}
            >
              취소
            </Button>
            <Button className="flex-1" onClick={submit} disabled={pending}>
              {pending ? "저장 중..." : "추가"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
