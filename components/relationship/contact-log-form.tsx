"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CONTACT_CHANNEL_OPTIONS } from "@/lib/format/relationship"
import { cn } from "@/lib/utils"
import type { ContactChannel } from "@/lib/supabase/types"

export interface ContactLogFormValue {
  date: string // YYYY-MM-DD
  time: string // HH:MM
  channel: ContactChannel
  /** channel === "custom"일 때 사용자가 직접 입력한 채널 라벨 */
  customChannel: string | null
  memo: string
}

interface ContactLogFormProps {
  initial?: Partial<ContactLogFormValue>
  onSubmit: (value: ContactLogFormValue) => void
  onCancel?: () => void
  submitLabel?: string
  /** 메모 자동 채움 (AI 요약 결과 등). 비어 있으면 사용자 직접 입력. */
  prefilledMemo?: string
}

const CHANNELS_GRID: { value: ContactChannel; label: string; icon: string }[] = [
  { value: "kakao", label: "카톡", icon: "💛" },
  { value: "phone", label: "전화", icon: "📞" },
  { value: "sms", label: "문자", icon: "💬" },
  { value: "email", label: "이메일", icon: "✉️" },
  { value: "inperson", label: "대면", icon: "☕️" },
  { value: "instagram_dm", label: "인스타 DM", icon: "📷" },
  { value: "custom", label: "직접입력", icon: "✏️" },
]

function todayLocalDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function nowLocalTimeString(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/**
 * 연락 기록 폼: 날짜 → 채널 → 메모.
 * 인라인/Sheet 어디든 끼울 수 있게 stateless.
 */
export function ContactLogForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "저장",
  prefilledMemo,
}: ContactLogFormProps) {
  const [date, setDate] = React.useState<string>(
    initial?.date ?? todayLocalDateString(),
  )
  const [time, setTime] = React.useState<string>(
    initial?.time ?? nowLocalTimeString(),
  )
  const [channel, setChannel] = React.useState<ContactChannel>(
    initial?.channel ?? "kakao",
  )
  const [customChannel, setCustomChannel] = React.useState<string>(
    initial?.customChannel ?? "",
  )
  const [memo, setMemo] = React.useState<string>(
    initial?.memo ?? prefilledMemo ?? "",
  )

  React.useEffect(() => {
    if (prefilledMemo && !memo) setMemo(prefilledMemo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledMemo])

  const handleSubmit = () => {
    onSubmit({
      date,
      time,
      channel,
      customChannel:
        channel === "custom" && customChannel.trim()
          ? customChannel.trim()
          : null,
      memo: memo.trim(),
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayLocalDateString()}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">시각</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">채널</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {CHANNELS_GRID.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setChannel(c.value)}
              className={cn(
                "flex items-center justify-center gap-1 rounded-md border px-1 h-9 text-xs tap",
                channel === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent/30",
              )}
              aria-pressed={channel === c.value}
            >
              <span aria-hidden>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
        {/* a11y/fallback */}
        <input type="hidden" value={channel} readOnly />
        <span className="sr-only">
          {CONTACT_CHANNEL_OPTIONS.find((o) => o.value === channel)?.label}
        </span>
      </div>

      {channel === "custom" ? (
        <div className="space-y-1">
          <Label className="text-xs">채널 이름</Label>
          <Input
            placeholder="예: 디스코드, 줌, 슬랙…"
            value={customChannel}
            onChange={(e) => setCustomChannel(e.target.value)}
            maxLength={30}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          rows={3}
          maxLength={500}
          placeholder="간단한 내용 (선택). AI가 채워준 요약은 그대로 두거나 수정해서 저장."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel} type="button">
            취소
          </Button>
        ) : null}
        <Button size="sm" onClick={handleSubmit} type="button">
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
