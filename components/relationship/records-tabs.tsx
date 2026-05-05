"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Cake, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { ExchangeCard } from "@/components/relationship/exchange-card"
import { ExchangeForm } from "@/components/relationship/exchange-form"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { PersonSelect } from "@/components/relationship/person-select"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { formatKRW } from "@/lib/format/money"
import { fullDateKo } from "@/lib/format/date"
import {
  describeDaysUntil,
  findUpcomingBirthdays,
} from "@/lib/birthday"
import { cn } from "@/lib/utils"
import {
  createEvent,
  createGift,
  createLoan,
  markLoanReturned,
  updateGift,
} from "@/lib/actions/exchange"
import type {
  EventRecord,
  Gift,
  Loan,
  Person,
} from "@/lib/supabase/types"

type Tab = "event" | "gift" | "loan"

const TABS: { id: Tab; label: string }[] = [
  { id: "event", label: "경조사" },
  { id: "gift", label: "선물" },
  { id: "loan", label: "대여" },
]

interface RecordsTabsProps {
  persons: Person[]
  events: EventRecord[]
  gifts: Gift[]
  loans: Loan[]
}

function ymd(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso
}

export function RecordsTabs({ persons, events, gifts, loans }: RecordsTabsProps) {
  const searchParams = useSearchParams()
  const urlTab = searchParams.get("tab")
  const urlAdd = searchParams.get("add")
  const normalizedTab: Tab =
    urlTab === "gift" || urlTab === "loan" || urlTab === "event"
      ? urlTab
      : "event"
  const [tab, setTab] = React.useState<Tab>(normalizedTab)

  // URL 변경(예: + FAB로 같은 페이지 다른 탭/add) 시 동기화
  React.useEffect(() => {
    setTab(normalizedTab)
  }, [normalizedTab])

  // ?add=1 이 들어올 때마다 카운터 증가 → 자식이 effect로 어더 자동 오픈
  const [openSeq, setOpenSeq] = React.useState(0)
  React.useEffect(() => {
    if (urlAdd === "1") setOpenSeq((s) => s + 1)
  }, [urlAdd, normalizedTab])

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="카테고리" className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 h-9 rounded-full border text-xs font-medium tap",
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "event" ? (
        <EventTab
          persons={persons}
          events={events}
          openSeq={tab === "event" ? openSeq : 0}
        />
      ) : tab === "gift" ? (
        <GiftTab
          persons={persons}
          gifts={gifts}
          openSeq={tab === "gift" ? openSeq : 0}
        />
      ) : (
        <LoanTab
          persons={persons}
          loans={loans}
          openSeq={tab === "loan" ? openSeq : 0}
        />
      )}
    </div>
  )
}

type Period = "month" | "year" | "all"

function EventTab({
  persons,
  events,
  openSeq,
}: {
  persons: Person[]
  events: EventRecord[]
  openSeq: number
}) {
  const router = useRouter()
  const [period, setPeriod] = React.useState<Period>("month")
  const [cursor, setCursor] = React.useState<Date>(new Date())
  const [personFilter, setPersonFilter] = React.useState<string>("")
  const [adderOpen, setAdderOpen] = React.useState(false)
  const [adderPersonId, setAdderPersonId] = React.useState<string>("")
  const [pending, startTransition] = React.useTransition()
  const adderRef = React.useRef<HTMLDivElement>(null)

  // openSeq 증가 시 어더 오픈 (탭 전환 후 + 같은 카테고리 재진입 모두 처리)
  React.useEffect(() => {
    if (openSeq > 0) setAdderOpen(true)
  }, [openSeq])

  // 어더가 열리거나 다시 열릴 때마다 화면 가운데로 스크롤
  React.useEffect(() => {
    if (adderOpen) {
      adderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [adderOpen, openSeq])

  const personIndex = React.useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  )

  const filtered = React.useMemo(() => {
    return events
      .filter((e) => {
        if (personFilter && e.person_id !== personFilter) return false
        const d = new Date(e.occurred_at)
        if (period === "month") {
          return (
            d.getFullYear() === cursor.getFullYear() &&
            d.getMonth() === cursor.getMonth()
          )
        }
        if (period === "year") return d.getFullYear() === cursor.getFullYear()
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime(),
      )
  }, [events, personFilter, period, cursor])

  const summary = React.useMemo(() => {
    let received = 0
    let sent = 0
    for (const e of filtered) {
      if (e.amount_paid == null) continue
      // attended === false: 받음, true: 보냄(우리가 참석)
      if (e.attended === false) received += e.amount_paid
      else sent += e.amount_paid
    }
    return { received, sent, count: filtered.length }
  }, [filtered])

  const periodLabel =
    period === "month"
      ? `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`
      : period === "year"
        ? `${cursor.getFullYear()}년`
        : "전체"

  const stepCursor = (delta: number) => {
    if (period === "month") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
    } else if (period === "year") {
      setCursor(new Date(cursor.getFullYear() + delta, 0, 1))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PeriodToggle value={period} onChange={setPeriod} />
        {period !== "all" ? (
          <div className="ml-auto inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepCursor(-1)}
              aria-label="이전"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold tabular-nums min-w-[5rem] text-center">
              {periodLabel}
            </span>
            <button
              type="button"
              onClick={() => stepCursor(1)}
              aria-label="다음"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="ml-auto text-xs text-muted-foreground">
            전체 기간
          </span>
        )}
      </div>

      <section className="grid grid-cols-2 gap-2">
        <SummaryCell
          label="받은 합계"
          value={summary.received}
          tone="text-success"
        />
        <SummaryCell
          label="보낸 합계"
          value={summary.sent}
          tone="text-destructive"
        />
      </section>

      {persons.length > 0 ? (
        <select
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
        >
          <option value="">전체 인물</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}

      <Button
        size="sm"
        variant="outline"
        onClick={() => setAdderOpen(true)}
        className="gap-1.5 w-full"
        disabled={persons.length === 0}
      >
        <Plus className="h-3.5 w-3.5" />
        경조사 추가
      </Button>

      {adderOpen ? (
        <section
          ref={adderRef}
          className="rounded-xl border-2 border-primary bg-primary/5 p-3 space-y-3 shadow-soft scroll-mt-20"
        >
          <h3 className="text-sm font-semibold">경조사 추가</h3>
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">
              누구의 경조사인가요? <span className="text-destructive">*</span>
            </p>
            <PersonSelect
              persons={persons}
              value={adderPersonId}
              onChange={setAdderPersonId}
              placeholder="인물 선택 (필수)"
            />
            {!adderPersonId ? (
              <p className="mt-1 text-[11px] text-warning">
                인물을 먼저 선택해 주세요.
              </p>
            ) : null}
          </div>
          <ExchangeForm
            kind="event"
            onCancel={() => setAdderOpen(false)}
            onSubmit={(v) => {
              if (!adderPersonId) {
                toast.error("인물을 먼저 선택해 주세요")
                return
              }
              startTransition(async () => {
                const res = await createEvent({
                  person_id: adderPersonId,
                  event_type: v.event_type,
                  occurred_at: ymd(v.occurred_at),
                  location: v.location || null,
                  attended: v.direction === "received" ? false : true,
                  amount_paid: v.amount,
                  memo: v.memo || null,
                })
                if (res.ok) {
                  toast.success("경조사가 기록됐어요")
                  setAdderOpen(false)
                  router.refresh()
                } else {
                  toast.error(res.error.message)
                }
              })
            }}
          />
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎀"
          title="이 기간에 경조사 기록이 없어요"
          description="결혼식·장례식 등의 경조사비를 기록하면 자동으로 합계가 잡혀요."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <ExchangeCard
              key={e.id}
              data={{
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
                personName: personIndex.get(e.person_id)?.name,
              }}
            />
          ))}
        </div>
      )}
      {pending ? (
        <p className="text-[11px] text-muted-foreground">처리 중...</p>
      ) : null}
    </div>
  )
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period
  onChange: (p: Period) => void
}) {
  const opts: { id: Period; label: string }[] = [
    { id: "month", label: "월별" },
    { id: "year", label: "연별" },
    { id: "all", label: "전체" },
  ]
  return (
    <div className="inline-flex rounded-md border border-border bg-card overflow-hidden">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "h-8 px-3 text-xs font-medium",
            value === o.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent/30",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function GiftTab({
  persons,
  gifts,
  openSeq,
}: {
  persons: Person[]
  gifts: Gift[]
  openSeq: number
}) {
  const router = useRouter()
  const [adderOpen, setAdderOpen] = React.useState(false)
  const [adderPersonId, setAdderPersonId] = React.useState<string>("")
  const [filter, setFilter] = React.useState<"all" | "sent" | "received">(
    "all",
  )
  const [personFilter, setPersonFilter] = React.useState<string>("")
  const [pending, startTransition] = React.useTransition()
  const adderRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (openSeq > 0) setAdderOpen(true)
  }, [openSeq])
  React.useEffect(() => {
    if (adderOpen) {
      adderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [adderOpen, openSeq])

  const personIndex = React.useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  )

  const upcoming = React.useMemo(
    () => findUpcomingBirthdays(persons, gifts, { withinDays: 30 }),
    [persons, gifts],
  )

  const filtered = React.useMemo(() => {
    return gifts
      .filter((g) => {
        if (personFilter && g.person_id !== personFilter) return false
        if (filter !== "all" && g.direction !== filter) return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime(),
      )
  }, [gifts, filter, personFilter])

  const counts = React.useMemo(() => {
    let sent = 0
    let received = 0
    for (const g of filtered) {
      if (g.direction === "sent") sent += 1
      else received += 1
    }
    return { sent, received, total: filtered.length }
  }, [filtered])

  return (
    <div className="space-y-4">
      {upcoming.length > 0 ? (
        <CollapsibleSection
          icon={<Cake className="h-4 w-4 text-primary" />}
          title="다가오는 생일"
          meta={`${upcoming.length}건`}
          defaultOpen
          className="border-primary/30"
        >
          <ul className="space-y-2">
            {upcoming.map((u) => (
              <li
                key={u.person.id}
                className="flex items-center gap-3 rounded-lg bg-accent/20 p-2"
              >
                <ProfileAvatar
                  gender={u.person.gender}
                  profileIndex={u.person.profile_index}
                  bgId={u.person.avatar_bg}
                  name={u.person.name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/persons/${u.person.id}`}
                      className="text-sm font-semibold hover:underline truncate"
                    >
                      {u.person.name}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      · {fullDateKo(u.nextBirthday)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-primary">
                      {describeDaysUntil(u.daysUntil)}
                    </span>
                    {u.hasGiftHistory ? (
                      <>
                        <span className="mx-1">·</span>
                        주고받은 사람 (받음 {u.receivedCount} / 보냄{" "}
                        {u.sentCount})
                      </>
                    ) : (
                      <>
                        <span className="mx-1">·</span>
                        선물 이력 없음
                      </>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    setAdderOpen(true)
                    setAdderPersonId(u.person.id)
                  }}
                >
                  + 선물
                </Button>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        title="통계"
        defaultOpen={false}
        meta={`${counts.total}건`}
      >
        <div className="grid grid-cols-3 gap-2">
          <CountCell label="총 건수" value={counts.total} />
          <CountCell
            label="보냄"
            value={counts.sent}
            tone="text-destructive"
          />
          <CountCell label="받음" value={counts.received} tone="text-success" />
        </div>
      </CollapsibleSection>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "sent", "received"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "h-7 rounded-full border px-3 text-[11px]",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f === "all" ? "전체" : f === "sent" ? "보냄" : "받음"}
          </button>
        ))}
      </div>

      {persons.length > 0 ? (
        <select
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
        >
          <option value="">전체 인물</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}

      <Button
        size="sm"
        variant="outline"
        onClick={() => setAdderOpen(true)}
        className="gap-1.5 w-full"
        disabled={persons.length === 0}
      >
        <Plus className="h-3.5 w-3.5" />
        선물 추가
      </Button>

      {adderOpen ? (
        <section
          ref={adderRef}
          className="rounded-xl border-2 border-primary bg-primary/5 p-3 space-y-3 shadow-soft scroll-mt-20"
        >
          <h3 className="text-sm font-semibold">선물 추가</h3>
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">
              누구에게/누구로부터? <span className="text-destructive">*</span>
            </p>
            <PersonSelect
              persons={persons}
              value={adderPersonId}
              onChange={setAdderPersonId}
              placeholder="인물 선택 (필수)"
            />
            {!adderPersonId ? (
              <p className="mt-1 text-[11px] text-warning">
                인물을 먼저 선택해 주세요.
              </p>
            ) : null}
          </div>
          <ExchangeForm
            kind="gift"
            onCancel={() => setAdderOpen(false)}
            onSubmit={(v) => {
              if (!adderPersonId) {
                toast.error("인물을 먼저 선택해 주세요")
                return
              }
              startTransition(async () => {
                const res = await createGift({
                  person_id: adderPersonId,
                  direction: v.direction,
                  kind: v.kind,
                  amount: v.amount,
                  item_name: v.item_name || null,
                  occurred_at: ymd(v.occurred_at),
                  reason: v.occasion || null,
                  notified_at: v.notified_at,
                })
                if (res.ok) {
                  toast.success("선물이 기록됐어요")
                  setAdderOpen(false)
                  router.refresh()
                } else {
                  toast.error(res.error.message)
                }
              })
            }}
          />
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="선물 기록이 없어요"
          description="생일·기념일에 주고받은 선물을 자유롭게 기록해보세요."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <ExchangeCard
              key={g.id}
              data={{
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
                personName: personIndex.get(g.person_id)?.name,
              }}
              onMore={
                g.notified_at
                  ? undefined
                  : () => {
                      startTransition(async () => {
                        const res = await updateGift({
                          id: g.id,
                          notified_at: new Date().toISOString(),
                        })
                        if (res.ok) {
                          toast.success("준비 메시지 보냄으로 기록됨")
                          router.refresh()
                        } else {
                          toast.error(res.error.message)
                        }
                      })
                    }
              }
            />
          ))}
        </div>
      )}
      {pending ? (
        <p className="text-[11px] text-muted-foreground">처리 중...</p>
      ) : null}
    </div>
  )
}

function LoanTab({
  persons,
  loans,
  openSeq,
}: {
  persons: Person[]
  loans: Loan[]
  openSeq: number
}) {
  const router = useRouter()
  const [adderOpen, setAdderOpen] = React.useState(false)
  const [adderPersonId, setAdderPersonId] = React.useState<string>("")
  const [filter, setFilter] = React.useState<"open" | "all">("open")
  const [personFilter, setPersonFilter] = React.useState<string>("")
  const [pending, startTransition] = React.useTransition()
  const adderRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (openSeq > 0) setAdderOpen(true)
  }, [openSeq])
  React.useEffect(() => {
    if (adderOpen) {
      adderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [adderOpen, openSeq])

  const personIndex = React.useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  )

  const filtered = React.useMemo(() => {
    return loans
      .filter((l) => {
        if (personFilter && l.person_id !== personFilter) return false
        if (filter === "open" && l.returned_at) return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() -
          new Date(a.occurred_at).getTime(),
      )
  }, [loans, filter, personFilter])

  const summary = React.useMemo(() => {
    let lent = 0
    let borrowed = 0
    let outstandingLent = 0
    let outstandingBorrowed = 0
    for (const l of loans) {
      if (personFilter && l.person_id !== personFilter) continue
      if (l.direction === "lent") {
        lent += l.amount
        if (!l.returned_at) outstandingLent += l.amount
      } else {
        borrowed += l.amount
        if (!l.returned_at) outstandingBorrowed += l.amount
      }
    }
    return { lent, borrowed, outstandingLent, outstandingBorrowed }
  }, [loans, personFilter])

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-2">
        <SummaryCell
          label="받을 돈 (미회수)"
          value={summary.outstandingLent}
          tone="text-warning"
        />
        <SummaryCell
          label="갚을 돈 (미반환)"
          value={summary.outstandingBorrowed}
          tone="text-warning"
        />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <SummaryCell
          label="총 빌려준 금액"
          value={summary.lent}
          tone="text-foreground"
        />
        <SummaryCell
          label="총 빌린 금액"
          value={summary.borrowed}
          tone="text-foreground"
        />
      </section>

      <div className="flex gap-1.5">
        {(["open", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "h-7 rounded-full border px-3 text-[11px]",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f === "open" ? "미회수만" : "전체"}
          </button>
        ))}
      </div>

      {persons.length > 0 ? (
        <select
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs"
        >
          <option value="">전체 인물</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}

      <Button
        size="sm"
        variant="outline"
        onClick={() => setAdderOpen(true)}
        className="gap-1.5 w-full"
        disabled={persons.length === 0}
      >
        <Plus className="h-3.5 w-3.5" />
        대여/대출 추가
      </Button>

      {adderOpen ? (
        <section
          ref={adderRef}
          className="rounded-xl border-2 border-primary bg-primary/5 p-3 space-y-3 shadow-soft scroll-mt-20"
        >
          <h3 className="text-sm font-semibold">대여 추가</h3>
          <div>
            <p className="mb-1 text-[11px] text-muted-foreground">
              누구와의 거래인가요? <span className="text-destructive">*</span>
            </p>
            <PersonSelect
              persons={persons}
              value={adderPersonId}
              onChange={setAdderPersonId}
              placeholder="인물 선택 (필수)"
            />
            {!adderPersonId ? (
              <p className="mt-1 text-[11px] text-warning">
                인물을 먼저 선택해 주세요.
              </p>
            ) : null}
          </div>
          <ExchangeForm
            kind="loan"
            onCancel={() => setAdderOpen(false)}
            onSubmit={(v) => {
              if (!adderPersonId) {
                toast.error("인물을 먼저 선택해 주세요")
                return
              }
              startTransition(async () => {
                const res = await createLoan({
                  person_id: adderPersonId,
                  direction: v.direction,
                  amount: v.amount,
                  occurred_at: ymd(v.occurred_at),
                  due_at: v.due_at ? ymd(v.due_at) : null,
                  memo: v.memo || null,
                })
                if (res.ok) {
                  toast.success("대여가 기록됐어요")
                  setAdderOpen(false)
                  router.refresh()
                } else {
                  toast.error(res.error.message)
                }
              })
            }}
          />
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon="💰"
          title="대여 기록이 없어요"
          description={
            filter === "open"
              ? "미회수 건이 없어요. 깨끗하네요!"
              : "빌려주거나 빌린 돈을 기록해보세요."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <ExchangeCard
              key={l.id}
              data={{
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
                personName: personIndex.get(l.person_id)?.name,
              }}
              onMore={
                l.returned_at
                  ? undefined
                  : () => {
                      startTransition(async () => {
                        const today = new Date().toISOString().slice(0, 10)
                        const res = await markLoanReturned({
                          id: l.id,
                          returned_at: today,
                        })
                        if (res.ok) {
                          toast.success("회수 처리되었어요")
                          router.refresh()
                        } else {
                          toast.error(res.error.message)
                        }
                      })
                    }
              }
            />
          ))}
        </div>
      )}
      {pending ? (
        <p className="text-[11px] text-muted-foreground">처리 중...</p>
      ) : null}
    </div>
  )
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-base font-semibold tabular-nums", tone)}>
        {formatKRW(value)}
      </p>
    </div>
  )
}

function CountCell({
  label,
  value,
  tone = "text-foreground",
}: {
  label: string
  value: number
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-base font-semibold tabular-nums", tone)}>
        {value}건
      </p>
    </div>
  )
}
