"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ExchangeCard,
  type ExchangeCardData,
} from "@/components/relationship/exchange-card"
import {
  ExchangeForm,
  type ExchangeFormKind,
} from "@/components/relationship/exchange-form"
import { formatKRW } from "@/lib/format/money"
import { cn } from "@/lib/utils"
import {
  createEvent,
  createGift,
  createLoan,
  markLoanReturned,
} from "@/lib/actions/exchange"
import type { EventRecord, Gift, Loan } from "@/lib/supabase/types"

interface ExchangeSectionProps {
  personId: string
  events: EventRecord[]
  gifts: Gift[]
  loans: Loan[]
}

function ymd(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso
}

export function ExchangeSection({
  personId,
  events,
  gifts,
  loans,
}: ExchangeSectionProps) {
  const [adder, setAdder] = React.useState<ExchangeFormKind | null>(null)
  const [pending, startTransition] = React.useTransition()

  const summary = React.useMemo(() => {
    let eventReceived = 0
    let eventSent = 0
    for (const e of events) {
      if (e.amount_paid == null) continue
      if (e.attended === true) eventSent += e.amount_paid
      else if (e.attended === false) eventReceived += e.amount_paid
    }
    let giftReceived = 0
    let giftSent = 0
    for (const g of gifts) {
      if (g.direction === "received") giftReceived += 1
      else giftSent += 1
    }
    let outstandingLent = 0
    let outstandingBorrowed = 0
    for (const l of loans) {
      if (l.returned_at) continue
      if (l.direction === "lent") outstandingLent += l.amount
      else outstandingBorrowed += l.amount
    }
    return {
      eventReceived,
      eventSent,
      giftReceived,
      giftSent,
      outstandingLent,
      outstandingBorrowed,
    }
  }, [events, gifts, loans])

  const cards: ExchangeCardData[] = [
    ...events.map<ExchangeCardData>((e) => ({
      id: e.id,
      kind: "event",
      flow: e.attended === false ? "received" : "sent",
      occasion: e.event_type,
      amount: e.amount_paid,
      itemName: null,
      occurredAt: e.occurred_at,
      returnedAt: null,
      dueAt: null,
      memo: e.memo,
    })),
    ...gifts.map<ExchangeCardData>((g) => ({
      id: g.id,
      kind: "gift",
      flow: g.direction,
      occasion: g.reason,
      amount: g.amount,
      itemName: g.item_name,
      occurredAt: g.occurred_at,
      returnedAt: null,
      dueAt: null,
      notifiedAt: g.notified_at,
      memo: null,
    })),
    ...loans.map<ExchangeCardData>((l) => ({
      id: l.id,
      kind: "loan",
      flow: l.direction,
      occasion: null,
      amount: l.amount,
      itemName: null,
      occurredAt: l.occurred_at,
      returnedAt: l.returned_at,
      dueAt: l.due_at,
      memo: l.memo,
    })),
  ].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  const handleMarkReturned = (id: string) => {
    startTransition(async () => {
      const today = new Date().toISOString().slice(0, 10)
      const res = await markLoanReturned({ id, returned_at: today })
      if (res.ok) toast.success("회수 처리되었어요")
      else toast.error(res.error.message)
    })
  }

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">주고받은 기록</h3>
        <span className="text-[11px] text-muted-foreground">
          {cards.length}건
        </span>
      </div>

      {summary.eventReceived || summary.eventSent ? (
        <div className="mb-2">
          <p className="text-[11px] text-muted-foreground mb-1">경조사비</p>
          <div className="grid grid-cols-2 gap-2">
            <SummaryMini
              label="받음"
              value={summary.eventReceived}
              tone="text-success"
            />
            <SummaryMini
              label="보냄"
              value={summary.eventSent}
              tone="text-destructive"
            />
          </div>
        </div>
      ) : null}

      {summary.giftReceived || summary.giftSent ? (
        <div className="mb-2">
          <p className="text-[11px] text-muted-foreground mb-1">선물 (건수)</p>
          <div className="grid grid-cols-2 gap-2">
            <CountMini
              label="받음"
              value={summary.giftReceived}
              tone="text-success"
            />
            <CountMini
              label="보냄"
              value={summary.giftSent}
              tone="text-destructive"
            />
          </div>
        </div>
      ) : null}

      {summary.outstandingLent || summary.outstandingBorrowed ? (
        <div className="mb-3">
          <p className="text-[11px] text-muted-foreground mb-1">미정산 대여</p>
          <div className="grid grid-cols-2 gap-2">
            {summary.outstandingLent > 0 ? (
              <SummaryMini
                label="받을 돈"
                value={summary.outstandingLent}
                tone="text-warning"
              />
            ) : (
              <div />
            )}
            {summary.outstandingBorrowed > 0 ? (
              <SummaryMini
                label="갚을 돈"
                value={summary.outstandingBorrowed}
                tone="text-warning"
              />
            ) : (
              <div />
            )}
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setAdder("event")}>
          + 경조사
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAdder("gift")}>
          + 선물
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAdder("loan")}>
          + 대여
        </Button>
      </div>

      {adder ? (
        <div className="rounded-xl border border-border bg-card p-3 mb-3">
          {adder === "event" ? (
            <ExchangeForm
              kind="event"
              onCancel={() => setAdder(null)}
              onSubmit={(v) => {
                startTransition(async () => {
                  const res = await createEvent({
                    person_id: personId,
                    event_type: v.event_type,
                    occurred_at: ymd(v.occurred_at),
                    location: v.location || null,
                    attended: v.direction === "received" ? false : true,
                    amount_paid: v.amount,
                    memo: v.memo || null,
                  })
                  if (res.ok) {
                    setAdder(null)
                    toast.success("경조사가 기록됐어요")
                  } else {
                    toast.error(res.error.message)
                  }
                })
              }}
            />
          ) : adder === "gift" ? (
            <ExchangeForm
              kind="gift"
              onCancel={() => setAdder(null)}
              onSubmit={(v) => {
                startTransition(async () => {
                  const res = await createGift({
                    person_id: personId,
                    direction: v.direction,
                    kind: v.kind,
                    amount: v.amount,
                    item_name: v.item_name || null,
                    occurred_at: ymd(v.occurred_at),
                    reason: v.occasion || null,
                    notified_at: v.notified_at,
                  })
                  if (res.ok) {
                    setAdder(null)
                    toast.success("선물이 기록됐어요")
                  } else {
                    toast.error(res.error.message)
                  }
                })
              }}
            />
          ) : (
            <ExchangeForm
              kind="loan"
              onCancel={() => setAdder(null)}
              onSubmit={(v) => {
                startTransition(async () => {
                  const res = await createLoan({
                    person_id: personId,
                    direction: v.direction,
                    amount: v.amount,
                    occurred_at: ymd(v.occurred_at),
                    due_at: v.due_at ? ymd(v.due_at) : null,
                    memo: v.memo || null,
                  })
                  if (res.ok) {
                    setAdder(null)
                    toast.success("대여가 기록됐어요")
                  } else {
                    toast.error(res.error.message)
                  }
                })
              }}
            />
          )}
        </div>
      ) : null}

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          이 인물과의 경조사·선물·대여 기록이 없어요.
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => (
            <ExchangeCard
              key={`${c.kind}-${c.id}`}
              data={c}
              onMore={
                c.kind === "loan" && !c.returnedAt
                  ? () => handleMarkReturned(c.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
      {pending ? (
        <p className="mt-1 text-[11px] text-muted-foreground">처리 중...</p>
      ) : null}
    </section>
  )
}

function SummaryMini({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", tone)}>
        {formatKRW(value)}
      </p>
    </div>
  )
}

function CountMini({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-md border border-border bg-card px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", tone)}>
        {value}건
      </p>
    </div>
  )
}
