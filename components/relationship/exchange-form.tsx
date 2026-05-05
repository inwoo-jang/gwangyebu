"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { parseKRW, formatKRW } from "@/lib/format/money"
import type { EventType } from "@/lib/supabase/types"
import type {
  ExchangeDirection,
  GiftKind,
  LoanDirection,
} from "@/lib/guest/types"

export type ExchangeFormKind = "event" | "gift" | "loan"

interface BaseProps {
  onCancel?: () => void
}

// ---- 경조사 ----
interface EventValue {
  event_type: EventType
  occurred_at: string
  amount: number | null
  direction: ExchangeDirection | null
  attended: boolean
  location: string
  memo: string
}
interface EventProps extends BaseProps {
  kind: "event"
  initial?: Partial<EventValue>
  onSubmit: (value: EventValue) => void
}

// ---- 선물 ----
interface GiftValue {
  direction: ExchangeDirection
  kind: GiftKind
  amount: number | null
  item_name: string
  occasion: string
  occurred_at: string
  /** "선물 준비 메시지를 보낸 시각" — null이면 미발송 */
  notified_at: string | null
  memo: string
}
interface GiftProps extends BaseProps {
  kind: "gift"
  initial?: Partial<GiftValue>
  onSubmit: (value: GiftValue) => void
}

// ---- 대여 ----
interface LoanValue {
  direction: LoanDirection
  amount: number
  occurred_at: string
  due_at: string | null
  memo: string
}
interface LoanProps extends BaseProps {
  kind: "loan"
  initial?: Partial<LoanValue>
  onSubmit: (value: LoanValue) => void
}

type ExchangeFormProps = EventProps | GiftProps | LoanProps

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "wedding", label: "결혼식" },
  { value: "funeral", label: "장례식" },
  { value: "firstbirthday", label: "돌잔치" },
  { value: "birthday", label: "생일" },
  { value: "anniversary", label: "기념일" },
  { value: "other", label: "기타" },
]

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function ExchangeForm(props: ExchangeFormProps) {
  if (props.kind === "event") return <EventInner {...props} />
  if (props.kind === "gift") return <GiftInner {...props} />
  return <LoanInner {...props} />
}

// ===== Event =====
function EventInner({ initial, onSubmit, onCancel }: EventProps) {
  const [eventType, setEventType] = React.useState<EventType>(
    initial?.event_type ?? "wedding",
  )
  const [date, setDate] = React.useState(initial?.occurred_at ?? todayLocal())
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? initial.amount.toLocaleString("ko-KR") : "",
  )
  const [direction, setDirection] = React.useState<ExchangeDirection | null>(
    initial?.direction ?? "sent",
  )
  const [attended, setAttended] = React.useState(initial?.attended ?? true)
  const [location, setLocation] = React.useState(initial?.location ?? "")
  const [memo, setMemo] = React.useState(initial?.memo ?? "")

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">종류</Label>
          <Select
            options={EVENT_TYPE_OPTIONS}
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <DirectionToggle
        options={[
          { id: "sent", label: "보냄" },
          { id: "received", label: "받음" },
        ]}
        value={direction ?? "sent"}
        onChange={(v) => setDirection(v as ExchangeDirection)}
      />

      <div className="space-y-1">
        <Label className="text-xs">금액 (경조사비)</Label>
        <Input
          inputMode="numeric"
          value={amount}
          placeholder="100,000"
          onChange={(e) => {
            const n = parseKRW(e.target.value)
            setAmount(n != null ? n.toLocaleString("ko-KR") : "")
          }}
        />
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {formatKRW(parseKRW(amount))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 h-9 text-xs">
          <input
            type="checkbox"
            checked={attended}
            onChange={(e) => setAttended(e.target.checked)}
          />
          참석함
        </label>
        <Input
          placeholder="장소 (선택)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          rows={2}
          value={memo}
          maxLength={300}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <Footer
        onCancel={onCancel}
        onSubmit={() =>
          onSubmit({
            event_type: eventType,
            occurred_at: new Date(`${date}T09:00:00`).toISOString(),
            amount: parseKRW(amount),
            direction,
            attended,
            location: location.trim(),
            memo: memo.trim(),
          })
        }
      />
    </div>
  )
}

// ===== Gift =====
function GiftInner({ initial, onSubmit, onCancel }: GiftProps) {
  const [direction, setDirection] = React.useState<ExchangeDirection>(
    initial?.direction ?? "sent",
  )
  const [itemName, setItemName] = React.useState(initial?.item_name ?? "")
  const [occasion, setOccasion] = React.useState(initial?.occasion ?? "생일")
  const [date, setDate] = React.useState(initial?.occurred_at ?? todayLocal())
  const [memo, setMemo] = React.useState(initial?.memo ?? "")
  const [showAmount, setShowAmount] = React.useState(
    Boolean(initial?.amount && initial.amount > 0),
  )
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? initial.amount.toLocaleString("ko-KR") : "",
  )
  const [notifiedDate, setNotifiedDate] = React.useState<string>(
    initial?.notified_at ? initial.notified_at.slice(0, 10) : "",
  )
  const messageSent = Boolean(notifiedDate)

  return (
    <div className="space-y-3">
      <DirectionToggle
        options={[
          { id: "sent", label: "보냄" },
          { id: "received", label: "받음" },
        ]}
        value={direction}
        onChange={(v) => setDirection(v as ExchangeDirection)}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">사유</Label>
          <Input
            value={occasion}
            placeholder="생일 / 취업 / 졸업…"
            onChange={(e) => setOccasion(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">선물한 날</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">선물 항목 *</Label>
        <Input
          value={itemName}
          placeholder="향초 세트, 스타벅스 기프티콘…"
          onChange={(e) => setItemName(e.target.value)}
        />
      </div>

      <section className="rounded-md border border-border bg-card p-2.5 space-y-2">
        <label className="flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            checked={messageSent}
            onChange={(e) => {
              if (e.target.checked) {
                setNotifiedDate(notifiedDate || todayLocal())
              } else {
                setNotifiedDate("")
              }
            }}
            className="mt-0.5"
          />
          <div className="flex-1">
            <p className="font-medium text-foreground">
              준비 메시지를 보냈음
            </p>
            <p className="text-[10px] text-muted-foreground">
              ‘곧 선물 보낼게~’ 같은 메시지를 미리 전했다면 체크.
            </p>
          </div>
        </label>
        {messageSent ? (
          <Input
            type="date"
            value={notifiedDate}
            onChange={(e) => setNotifiedDate(e.target.value)}
            className="w-full"
          />
        ) : null}
      </section>

      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setShowAmount((v) => !v)}
          className="text-[11px] text-muted-foreground underline"
        >
          {showAmount ? "금액 숨기기" : "금액 입력 (선택)"}
        </button>
        {showAmount ? (
          <div className="space-y-1">
            <Input
              inputMode="numeric"
              value={amount}
              placeholder="35,000"
              onChange={(e) => {
                const n = parseKRW(e.target.value)
                setAmount(n != null ? n.toLocaleString("ko-KR") : "")
              }}
            />
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {formatKRW(parseKRW(amount))}
            </p>
          </div>
        ) : null}
      </section>

      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          rows={2}
          value={memo}
          maxLength={300}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <Footer
        onCancel={onCancel}
        disabled={itemName.trim().length === 0}
        onSubmit={() =>
          onSubmit({
            direction,
            kind: "item",
            amount: showAmount ? parseKRW(amount) : null,
            item_name: itemName.trim(),
            occasion: occasion.trim(),
            occurred_at: new Date(`${date}T09:00:00`).toISOString(),
            notified_at: notifiedDate
              ? new Date(`${notifiedDate}T09:00:00`).toISOString()
              : null,
            memo: memo.trim(),
          })
        }
      />
    </div>
  )
}

// ===== Loan =====
function LoanInner({ initial, onSubmit, onCancel }: LoanProps) {
  const [direction, setDirection] = React.useState<LoanDirection>(
    initial?.direction ?? "lent",
  )
  const [amount, setAmount] = React.useState(
    initial?.amount != null ? initial.amount.toLocaleString("ko-KR") : "",
  )
  const [date, setDate] = React.useState(initial?.occurred_at ?? todayLocal())
  const [dueDate, setDueDate] = React.useState(initial?.due_at ?? "")
  const [memo, setMemo] = React.useState(initial?.memo ?? "")

  return (
    <div className="space-y-3">
      <DirectionToggle
        options={[
          { id: "lent", label: "빌려줌" },
          { id: "borrowed", label: "빌림" },
        ]}
        value={direction}
        onChange={(v) => setDirection(v as LoanDirection)}
      />

      <div className="space-y-1">
        <Label className="text-xs">금액 *</Label>
        <Input
          inputMode="numeric"
          value={amount}
          placeholder="50,000"
          onChange={(e) => {
            const n = parseKRW(e.target.value)
            setAmount(n != null ? n.toLocaleString("ko-KR") : "")
          }}
        />
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {formatKRW(parseKRW(amount))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">
            {direction === "lent" ? "빌려준 날" : "빌린 날"}
          </Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">회수 예정일 (선택)</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          rows={2}
          value={memo}
          maxLength={300}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <Footer
        onCancel={onCancel}
        disabled={parseKRW(amount) == null || (parseKRW(amount) ?? 0) <= 0}
        onSubmit={() =>
          onSubmit({
            direction,
            amount: parseKRW(amount) ?? 0,
            occurred_at: new Date(`${date}T09:00:00`).toISOString(),
            due_at: dueDate
              ? new Date(`${dueDate}T09:00:00`).toISOString()
              : null,
            memo: memo.trim(),
          })
        }
      />
    </div>
  )
}

function DirectionToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "h-9 rounded-md border text-sm tap",
            value === o.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Footer({
  onCancel,
  onSubmit,
  disabled,
}: {
  onCancel?: () => void
  onSubmit: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      {onCancel ? (
        <Button size="sm" variant="ghost" onClick={onCancel} type="button">
          취소
        </Button>
      ) : null}
      <Button size="sm" onClick={onSubmit} type="button" disabled={disabled}>
        저장
      </Button>
    </div>
  )
}
