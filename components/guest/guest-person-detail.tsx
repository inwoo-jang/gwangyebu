"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, HelpCircle } from "lucide-react"
import { toast } from "sonner"

import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { AnalysisGuideDialog } from "@/components/relationship/analysis-guide-dialog"
import { BusinessCardSection } from "@/components/relationship/business-card-section"
import { ContactActions } from "@/components/relationship/contact-actions"
import {
  ContactLogForm,
  type ContactLogFormValue,
} from "@/components/relationship/contact-log-form"
import {
  ContactCalendar,
  type CalendarContact,
} from "@/components/relationship/contact-calendar"
import { GuestImportContacts } from "@/components/guest/guest-import-contacts"
import {
  ExchangeCard,
  type ExchangeCardData,
} from "@/components/relationship/exchange-card"
import {
  ExchangeForm,
  type ExchangeFormKind,
} from "@/components/relationship/exchange-form"
import { Button } from "@/components/ui/button"
import { formatKRW } from "@/lib/format/money"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagChip } from "@/components/relationship/tag-chip"
import { RelationshipScoreGauge } from "@/components/relationship/relationship-score-gauge"
import {
  EventTimeline,
  type TimelineItem,
} from "@/components/relationship/event-timeline"
import { ReminderItem } from "@/components/relationship/reminder-item"
import { useGuestStore } from "@/lib/guest/store"
import { analyzePerson } from "@/lib/guest/analyze"
import { useGuestHydrated } from "@/lib/guest/use-hydrated"
import { GuestLoading } from "@/components/guest/guest-loading"
import { colorIndexForTag } from "@/lib/format/tag"
import { RELATIONSHIP_TYPE_LABEL } from "@/lib/format/relationship"
import { daysAgoKo, fullDateKo } from "@/lib/format/date"
import type {
  ContactLog,
  Note,
  Reminder,
} from "@/lib/supabase/types"
import type {
  GuestContactLog,
  GuestNote,
  GuestReminder,
} from "@/lib/guest/types"

function toContactLog(c: GuestContactLog): ContactLog {
  return { ...c, user_id: "guest" }
}
function toNote(n: GuestNote): Note {
  return { ...n, user_id: "guest" }
}
function toReminder(r: GuestReminder): Reminder {
  return { ...r, user_id: "guest" }
}

export function GuestPersonDetail({ personId }: { personId: string }) {
  const router = useRouter()
  const hydrated = useGuestHydrated()

  // 스토어에서는 원본 배열/객체만 꺼낸다 (참조 안정).
  // 파생 값은 useMemo로 계산해서 무한 루프 방지.
  const persons = useGuestStore((s) => s.persons)
  const allPersonTags = useGuestStore((s) => s.personTags)
  const allTags = useGuestStore((s) => s.tags)
  const allContacts = useGuestStore((s) => s.contacts)
  const allNotes = useGuestStore((s) => s.notes)
  const allScores = useGuestStore((s) => s.scores)
  const allReminders = useGuestStore((s) => s.reminders)
  const allEvents = useGuestStore((s) => s.events)
  const allGifts = useGuestStore((s) => s.gifts)
  const allLoans = useGuestStore((s) => s.loans)
  const settings = useGuestStore((s) => s.settings)
  const addEvent = useGuestStore((s) => s.addEvent)
  const addGift = useGuestStore((s) => s.addGift)
  const addLoan = useGuestStore((s) => s.addLoan)
  const markLoanReturned = useGuestStore((s) => s.markLoanReturned)
  const setBusinessCard = useGuestStore((s) => s.setBusinessCard)
  const clearBusinessCard = useGuestStore((s) => s.clearBusinessCard)
  const [analysisGuideOpen, setAnalysisGuideOpen] = React.useState(false)

  const person = React.useMemo(
    () => persons.find((p) => p.id === personId),
    [persons, personId],
  )
  const tagsForPerson = React.useMemo(() => {
    const ids = new Set(
      allPersonTags
        .filter((pt) => pt.person_id === personId)
        .map((pt) => pt.tag_id),
    )
    return allTags.filter((t) => ids.has(t.id))
  }, [allPersonTags, allTags, personId])
  const contacts = React.useMemo(
    () =>
      allContacts
        .filter((c) => c.person_id === personId)
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        ),
    [allContacts, personId],
  )
  const notes = React.useMemo(
    () =>
      allNotes
        .filter((n) => n.person_id === personId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        ),
    [allNotes, personId],
  )
  const score = React.useMemo(
    () => allScores.find((sc) => sc.person_id === personId),
    [allScores, personId],
  )
  const events = React.useMemo(
    () =>
      allEvents
        .filter((e) => e.person_id === personId)
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        ),
    [allEvents, personId],
  )
  const gifts = React.useMemo(
    () =>
      allGifts
        .filter((g) => g.person_id === personId)
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        ),
    [allGifts, personId],
  )
  const loans = React.useMemo(
    () =>
      allLoans
        .filter((l) => l.person_id === personId)
        .sort(
          (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime(),
        ),
    [allLoans, personId],
  )
  const exchangeSummary = React.useMemo(() => {
    // 경조사: 보낸/받은 합계
    let eventReceived = 0
    let eventSent = 0
    for (const e of events) {
      if (e.amount == null) continue
      if (e.direction === "received") eventReceived += e.amount
      else if (e.direction === "sent") eventSent += e.amount
    }
    // 선물: 건수 (금액 X)
    let giftReceived = 0
    let giftSent = 0
    for (const g of gifts) {
      if (g.direction === "received") giftReceived += 1
      else giftSent += 1
    }
    // 대여: 미회수만 분리
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
  const upcomingReminder = React.useMemo(
    () =>
      allReminders
        .filter((r) => r.person_id === personId && r.status !== "done")
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        )[0],
    [allReminders, personId],
  )

  const logContact = useGuestStore((s) => s.logContact)
  const addNote = useGuestStore((s) => s.addNote)
  const createReminder = useGuestStore((s) => s.createReminder)
  const completeReminder = useGuestStore((s) => s.completeReminder)
  const snoozeReminder = useGuestStore((s) => s.snoozeReminder)
  const deletePerson = useGuestStore((s) => s.deletePerson)
  const setScore = useGuestStore((s) => s.setScore)

  if (!hydrated) {
    return <GuestLoading title="인물" />
  }

  if (!person) {
    return (
      <AppShell header={<AppHeader title="인물" back={{ href: "/" }} />}>
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          인물을 찾을 수 없어요.
        </div>
      </AppShell>
    )
  }

  const relInfo = RELATIONSHIP_TYPE_LABEL[person.relationship_type]
  const relLabel =
    person.relationship_type === "custom" && person.relationship_label
      ? person.relationship_label
      : relInfo.label
  const birthday =
    person.birth_month && person.birth_day
      ? `${person.birth_year ? `${person.birth_year}.` : ""}${person.birth_month}월 ${person.birth_day}일`
      : null

  const timeline: TimelineItem[] = [
    ...contacts.map<TimelineItem>((c) => ({
      kind: "contact",
      data: toContactLog(c),
      ts: c.occurred_at,
    })),
    ...notes.map<TimelineItem>((n) => ({
      kind: "note",
      data: toNote(n),
      ts: n.created_at,
    })),
  ]

  const handleQuickAnalyze = () => {
    setScore(analyzePerson({ person, contacts, notes }))
    toast.success("관계 건강도를 다시 계산했어요")
  }

  const handleDelete = () => {
    if (!confirm(`"${person.name}"을(를) 삭제할까요? 되돌릴 수 없어요.`))
      return
    deletePerson(person.id)
    toast.success("삭제되었어요")
    router.push("/")
  }

  return (
    <AppShell
      header={
        <AppHeader
          title={person.name}
          back={{ href: "/" }}
          actions={
            <Button asChild size="icon" variant="ghost" aria-label="편집">
              <Link href={`/persons/${person.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      }
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <ProfileAvatar
            gender={person.gender}
            profileIndex={person.profile_index}
            bgId={person.avatar_bg}
            name={person.name}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {person.name}
              {person.nickname ? (
                <span className="ml-1.5 text-base font-normal text-muted-foreground">
                  ({person.nickname})
                </span>
              ) : null}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {relLabel}
              {person.mbti ? ` · ${person.mbti}` : ""}
              {birthday ? ` · 🎂 ${birthday}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {person.last_contact_at
                ? `마지막 연락 ${daysAgoKo(person.last_contact_at)} (${fullDateKo(person.last_contact_at)})`
                : "아직 연락 기록이 없어요"}
            </p>
          </div>
          <RelationshipScoreGauge score={score?.score ?? null} size="md" />
        </div>

        {tagsForPerson.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tagsForPerson.map((t) => (
              <TagChip
                key={t.id}
                tag={{
                  id: t.id,
                  name: t.name,
                  colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                }}
                size="sm"
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        <LogContactPanel
          onSubmit={(value) => {
            const occurredAt = new Date(
              `${value.date}T${value.time || "09:00"}:00`,
            ).toISOString()
            logContact({
              person_id: person.id,
              channel: value.channel,
              custom_channel: value.customChannel,
              direction: "outbound",
              occurred_at: occurredAt,
              memo: value.memo || null,
            })
            toast.success("연락이 기록되었어요")
          }}
        />
        <GuestImportContacts
          personId={person.id}
          personName={person.name}
          selfName={settings?.display_name ?? undefined}
        />
        <ReminderInline
          onSubmit={(scheduled_at, message) => {
            createReminder({
              person_id: person.id,
              reminder_type: "followup",
              scheduled_at,
              repeat_rule: "none",
              channel: "inapp",
              message: message || null,
            })
            toast.success("리마인더를 추가했어요")
          }}
        />
        <div className="inline-flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleQuickAnalyze}>
            ✨ 관계 분석
          </Button>
          <button
            type="button"
            onClick={() => setAnalysisGuideOpen(true)}
            aria-label="관계 분석 기준 보기"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </section>

      {(person.phone_number || person.kakao_nickname || person.instagram_handle) ? (
        <div className="mt-4">
          <ContactActions
            phoneNumber={person.phone_number}
            kakaoNickname={person.kakao_nickname}
            instagramHandle={person.instagram_handle}
            personName={person.name}
          />
        </div>
      ) : null}

      {score?.last_reason ? (
        <section className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/90">
          {score.last_reason}
        </section>
      ) : null}

      {upcomingReminder ? (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            다음 리마인더
          </h3>
          <ReminderItem
            reminder={{
              ...toReminder(upcomingReminder),
              person_name: person.name,
            }}
            onComplete={() => completeReminder(upcomingReminder.id)}
            onSnooze={() =>
              snoozeReminder(
                upcomingReminder.id,
                new Date(Date.now() + 86_400_000).toISOString(),
              )
            }
          />
        </section>
      ) : null}

      {(person.memo || person.how_we_met || person.food_preference) ? (
        <section className="mt-5 space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
          {person.how_we_met ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                알게 된 경로
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{person.how_we_met}</p>
            </div>
          ) : null}
          {person.food_preference ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                음식 취향
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">
                {person.food_preference}
              </p>
            </div>
          ) : null}
          {person.memo ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">메모</p>
              <p className="mt-0.5 whitespace-pre-wrap">{person.memo}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">연락 캘린더</h3>
          <span className="text-[11px] text-muted-foreground">
            {contacts.length}건
          </span>
        </div>
        <ContactCalendar
          contacts={contacts.map<CalendarContact>((c) => ({
            id: c.id,
            occurredAt: c.occurred_at,
            channel: c.channel,
            customChannel: c.custom_channel,
            memo: c.memo,
          }))}
        />
      </section>

      <ExchangeSection
        personId={person.id}
        events={events}
        gifts={gifts}
        loans={loans}
        summary={exchangeSummary}
        onAddEvent={(v) =>
          addEvent({
            person_id: person.id,
            event_type: v.event_type,
            occurred_at: v.occurred_at,
            amount: v.amount,
            direction: v.direction,
            attended: v.attended,
            location: v.location || null,
            memo: v.memo || null,
          })
        }
        onAddGift={(v) =>
          addGift({
            person_id: person.id,
            direction: v.direction,
            kind: v.kind,
            amount: v.amount,
            item_name: v.item_name || null,
            occasion: v.occasion || null,
            occurred_at: v.occurred_at,
            notified_at: v.notified_at,
            linked_event_id: null,
            memo: v.memo || null,
          })
        }
        onAddLoan={(v) =>
          addLoan({
            person_id: person.id,
            direction: v.direction,
            amount: v.amount,
            occurred_at: v.occurred_at,
            due_at: v.due_at,
            memo: v.memo || null,
          })
        }
        onMarkReturned={(id) => {
          markLoanReturned(id)
          toast.success("회수 처리되었어요")
        }}
      />

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">타임라인</h3>
        </div>
        <EventTimeline items={timeline} />
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          새 메모 추가
        </h3>
        <NoteInline
          onSubmit={(body) => {
            addNote(person.id, body)
            toast.success("메모를 저장했어요")
          }}
        />
      </section>

      <BusinessCardSection
        cardUrl={person.business_card_url ?? null}
        personName={person.name}
        onChange={(dataUrl) => setBusinessCard(person.id, dataUrl)}
        onClear={() => clearBusinessCard(person.id)}
      />

      <section className="mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="gap-2 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          이 인물 삭제
        </Button>
      </section>

      <AnalysisGuideDialog
        open={analysisGuideOpen}
        onOpenChange={setAnalysisGuideOpen}
      />
    </AppShell>
  )
}

function LogContactPanel({
  onSubmit,
}: {
  onSubmit: (value: ContactLogFormValue) => void
}) {
  const [open, setOpen] = React.useState(false)
  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        💬 연락 기록
      </Button>
    )
  }
  return (
    <div className="w-full rounded-xl border border-border bg-card p-3">
      <ContactLogForm
        onSubmit={(value) => {
          onSubmit(value)
          setOpen(false)
        }}
        onCancel={() => setOpen(false)}
        submitLabel="저장"
      />
    </div>
  )
}

function ReminderInline({
  onSubmit,
}: {
  onSubmit: (scheduled_at: string, message: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const [date, setDate] = React.useState(tomorrow)
  const [message, setMessage] = React.useState("")
  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        ⏰ 리마인더
      </Button>
    )
  }
  return (
    <div className="w-full rounded-xl border border-border bg-card p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">메시지</Label>
          <Input
            placeholder="안부 묻기"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          취소
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSubmit(new Date(`${date}T09:00:00`).toISOString(), message)
            setOpen(false)
            setMessage("")
          }}
        >
          추가
        </Button>
      </div>
    </div>
  )
}

function NoteInline({ onSubmit }: { onSubmit: (body: string) => void }) {
  const [body, setBody] = React.useState("")
  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        placeholder="이번 만남에서 알게 된 점, 다음에 챙길 것…"
        value={body}
        maxLength={2000}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!body.trim()}
          onClick={() => {
            onSubmit(body.trim())
            setBody("")
          }}
        >
          메모 저장
        </Button>
      </div>
    </div>
  )
}

function ExchangeSection({
  events,
  gifts,
  loans,
  summary,
  onAddEvent,
  onAddGift,
  onAddLoan,
  onMarkReturned,
}: {
  personId: string
  events: import("@/lib/guest/types").GuestEvent[]
  gifts: import("@/lib/guest/types").GuestGift[]
  loans: import("@/lib/guest/types").GuestLoan[]
  summary: {
    eventReceived: number
    eventSent: number
    giftReceived: number
    giftSent: number
    outstandingLent: number
    outstandingBorrowed: number
  }
  onAddEvent: (
    v: {
      event_type: import("@/lib/supabase/types").EventType
      occurred_at: string
      amount: number | null
      direction: import("@/lib/guest/types").ExchangeDirection | null
      attended: boolean
      location: string
      memo: string
    },
  ) => void
  onAddGift: (
    v: {
      direction: import("@/lib/guest/types").ExchangeDirection
      kind: import("@/lib/guest/types").GiftKind
      amount: number | null
      item_name: string
      occasion: string
      occurred_at: string
      notified_at: string | null
      memo: string
    },
  ) => void
  onAddLoan: (
    v: {
      direction: import("@/lib/guest/types").LoanDirection
      amount: number
      occurred_at: string
      due_at: string | null
      memo: string
    },
  ) => void
  onMarkReturned: (id: string) => void
}) {
  const [adder, setAdder] = React.useState<ExchangeFormKind | null>(null)

  const cards: ExchangeCardData[] = [
    ...events.map<ExchangeCardData>((e) => ({
      id: e.id,
      kind: "event",
      flow: e.direction === "received" ? "received" : "sent",
      occasion: e.event_type,
      amount: e.amount,
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
      occasion: g.occasion,
      amount: g.amount,
      itemName: g.item_name,
      occurredAt: g.occurred_at,
      returnedAt: null,
      dueAt: null,
      notifiedAt: g.notified_at,
      memo: g.memo,
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

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">주고받은 기록</h3>
        <span className="text-[11px] text-muted-foreground">{cards.length}건</span>
      </div>

      {(summary.eventReceived || summary.eventSent) ? (
        <div className="mb-2">
          <p className="text-[11px] text-muted-foreground mb-1">경조사비</p>
          <div className="grid grid-cols-2 gap-2">
            <SummaryMini label="받음" value={summary.eventReceived} tone="text-success" />
            <SummaryMini label="보냄" value={summary.eventSent} tone="text-destructive" />
          </div>
        </div>
      ) : null}

      {(summary.giftReceived || summary.giftSent) ? (
        <div className="mb-2">
          <p className="text-[11px] text-muted-foreground mb-1">선물 (건수)</p>
          <div className="grid grid-cols-2 gap-2">
            <CountMini label="받음" value={summary.giftReceived} tone="text-success" />
            <CountMini label="보냄" value={summary.giftSent} tone="text-destructive" />
          </div>
        </div>
      ) : null}

      {(summary.outstandingLent || summary.outstandingBorrowed) ? (
        <div className="mb-3">
          <p className="text-[11px] text-muted-foreground mb-1">미정산 대여</p>
          <div className="grid grid-cols-2 gap-2">
            {summary.outstandingLent > 0 ? (
              <SummaryMini label="받을 돈" value={summary.outstandingLent} tone="text-warning" />
            ) : (
              <div />
            )}
            {summary.outstandingBorrowed > 0 ? (
              <SummaryMini label="갚을 돈" value={summary.outstandingBorrowed} tone="text-warning" />
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
                onAddEvent(v)
                setAdder(null)
                toast.success("경조사가 기록됐어요")
              }}
            />
          ) : adder === "gift" ? (
            <ExchangeForm
              kind="gift"
              onCancel={() => setAdder(null)}
              onSubmit={(v) => {
                onAddGift(v)
                setAdder(null)
                toast.success("선물이 기록됐어요")
              }}
            />
          ) : (
            <ExchangeForm
              kind="loan"
              onCancel={() => setAdder(null)}
              onSubmit={(v) => {
                onAddLoan(v)
                setAdder(null)
                toast.success("대여가 기록됐어요")
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
                  ? () => onMarkReturned(c.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
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
    <div className="rounded-lg border border-border bg-card px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${tone}`}>
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
    <div className="rounded-lg border border-border bg-card px-2 py-1.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${tone}`}>
        {value}건
      </p>
    </div>
  )
}
