"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { isToday, isThisWeek, isThisMonth, isThisYear, isPast } from "date-fns"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ReminderItem } from "@/components/relationship/reminder-item"
import {
  ReminderCalendar,
  type CalendarReminder,
} from "@/components/relationship/reminder-calendar"
import { PersonSelect } from "@/components/relationship/person-select"
import { PersonMultiSelect } from "@/components/relationship/person-multi-select"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/common/empty-state"
import { useGuestStore } from "@/lib/guest/store"
import { useGuestHydrated } from "@/lib/guest/use-hydrated"
import { GuestLoading } from "@/components/guest/guest-loading"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { cn } from "@/lib/utils"
import type {
  Reminder,
  ReminderType,
  ReminderChannel,
} from "@/lib/supabase/types"
import type { GuestReminder } from "@/lib/guest/types"

interface ViewReminder extends Reminder {
  person_name: string
}

function toView(r: GuestReminder, personName: string): ViewReminder {
  return { ...r, user_id: "guest", person_name: personName }
}

type RangeFilter = "today" | "week" | "month" | "year" | "all"

const RANGE_TABS: { id: RangeFilter; label: string }[] = [
  { id: "today", label: "오늘" },
  { id: "week", label: "이번 주" },
  { id: "month", label: "이번 달" },
  { id: "year", label: "올해" },
  { id: "all", label: "전체" },
]

function inRange(d: Date, range: RangeFilter): boolean {
  switch (range) {
    case "today":
      return isToday(d)
    case "week":
      return isThisWeek(d, { weekStartsOn: 1 })
    case "month":
      return isThisMonth(d)
    case "year":
      return isThisYear(d)
    case "all":
      return true
  }
}

export function GuestReminders() {
  const hydrated = useGuestHydrated()
  const reminders = useGuestStore((s) => s.reminders)
  const persons = useGuestStore((s) => s.persons)
  const completeReminder = useGuestStore((s) => s.completeReminder)
  const snoozeReminder = useGuestStore((s) => s.snoozeReminder)
  const createReminder = useGuestStore((s) => s.createReminder)
  const searchParams = useSearchParams()

  const [range, setRange] = React.useState<RangeFilter>("week")
  const [adderOpen, setAdderOpen] = React.useState(false)
  const adderRef = React.useRef<HTMLDivElement>(null)
  const urlAdd = searchParams.get("add")

  React.useEffect(() => {
    if (urlAdd === "1") setAdderOpen(true)
  }, [urlAdd])
  React.useEffect(() => {
    if (adderOpen) {
      adderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [adderOpen, urlAdd])

  const personById = React.useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  )

  const allView: ViewReminder[] = React.useMemo(
    () =>
      [...reminders]
        .map((r) =>
          toView(r, personById.get(r.person_id)?.name ?? "인물"),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        ),
    [reminders, personById],
  )

  // 캘린더용 (전체 노출, 도트 색은 캘린더가 자체 판단)
  const calendarItems: CalendarReminder[] = React.useMemo(
    () =>
      reminders.map((r) => ({
        id: r.id,
        scheduledAt: r.scheduled_at,
        reminderType: r.reminder_type,
        message: r.message,
        status: r.status,
        personName: personById.get(r.person_id)?.name ?? "인물",
      })),
    [reminders, personById],
  )

  // 지난 일정 (active 상태인데 어제 이전)
  const overdue = React.useMemo(
    () =>
      allView.filter((r) => {
        const d = new Date(r.scheduled_at)
        return (
          r.status === "active" && isPast(d) && !isToday(d)
        )
      }),
    [allView],
  )

  // 선택된 범위 + 지난 것 제외 (overdue는 별도 표시)
  const filtered = React.useMemo(
    () =>
      allView.filter((r) => {
        const d = new Date(r.scheduled_at)
        if (r.status === "active" && isPast(d) && !isToday(d)) return false
        return inRange(d, range)
      }),
    [allView, range],
  )

  // 날짜별 그룹핑 (range가 today면 그룹핑 무의미)
  const grouped = React.useMemo(() => {
    if (range === "today") {
      return [{ key: "오늘", items: filtered }]
    }
    const map = new Map<string, ViewReminder[]>()
    for (const r of filtered) {
      const d = new Date(r.scheduled_at)
      const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }, [filtered, range])

  if (!hydrated) {
    return <GuestLoading title="리마인더" />
  }

  if (reminders.length === 0) {
    return (
      <AppShell
        header={
          <AppHeader
            title="리마인더"
            actions={
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setAdderOpen((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" />
                추가
              </Button>
            }
          />
        }
      >
        {adderOpen ? (
          <div ref={adderRef}>
            <ReminderAdder
              persons={persons}
              onClose={() => setAdderOpen(false)}
              onSubmit={(input) => {
                createReminder(input)
                toast.success("리마인더를 추가했어요")
                setAdderOpen(false)
              }}
            />
          </div>
        ) : (
          <EmptyState
            icon="🔔"
            title="예정된 리마인더가 없어요"
            description="우상단 ‘추가’ 버튼으로 리마인더를 만들어보세요."
            action={{ label: "+ 리마인더 추가", href: "/reminders?add=1" }}
          />
        )}
      </AppShell>
    )
  }

  return (
    <AppShell
      header={
        <AppHeader
          title="리마인더"
          actions={
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setAdderOpen((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          }
        />
      }
    >
      <div className="space-y-5">
        {adderOpen ? (
          <div ref={adderRef}>
            <ReminderAdder
              persons={persons}
              onClose={() => setAdderOpen(false)}
              onSubmit={(input) => {
                createReminder(input)
                toast.success("리마인더를 추가했어요")
                setAdderOpen(false)
              }}
            />
          </div>
        ) : null}

        <CollapsibleSection
          title="캘린더"
          defaultOpen
          card={false}
          className="space-y-2"
          bodyClassName="!pt-0"
        >
          <ReminderCalendar reminders={calendarItems} />
        </CollapsibleSection>

        {overdue.length > 0 ? (
          <CollapsibleSection
            icon="⚠️"
            title={
              <span className="text-destructive">지난 일정</span>
            }
            meta={
              <span className="text-destructive/80">
                {overdue.length}건 — 놓친 안부, 챙겨볼까요?
              </span>
            }
            defaultOpen={false}
            className="border-destructive/40 bg-destructive/5"
          >
            <div className="space-y-2">
              {overdue.slice(0, 3).map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={r}
                  onComplete={() => completeReminder(r.id)}
                  onSnooze={() =>
                    snoozeReminder(
                      r.id,
                      new Date(Date.now() + 86_400_000).toISOString(),
                    )
                  }
                />
              ))}
              {overdue.length > 3 ? (
                <p className="text-center text-[11px] text-destructive/80">
                  +{overdue.length - 3}건 더
                </p>
              ) : null}
            </div>
          </CollapsibleSection>
        ) : null}

        <section>
          <div
            role="tablist"
            aria-label="기간 필터"
            className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
          >
            {RANGE_TABS.map((t) => {
              const active = range === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRange(t.id)}
                  className={cn(
                    "shrink-0 h-8 rounded-full border px-3 text-xs tap transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent/30",
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {RANGE_TABS.find((t) => t.id === range)?.label}에 예정된 리마인더가 없어요.
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((g) => (
                <div key={g.key}>
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground tabular-nums">
                    {g.key}
                  </h3>
                  <div className="space-y-2">
                    {g.items.map((r) => (
                      <ReminderItem
                        key={r.id}
                        reminder={r}
                        onComplete={() => completeReminder(r.id)}
                        onSnooze={() =>
                          snoozeReminder(
                            r.id,
                            new Date(Date.now() + 86_400_000).toISOString(),
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

const REMINDER_TYPES: { id: ReminderType; label: string; icon: string }[] = [
  { id: "followup", label: "팔로우업", icon: "🔔" },
  { id: "birthday", label: "생일", icon: "🎂" },
  { id: "event", label: "기념일", icon: "🎉" },
  { id: "custom", label: "직접", icon: "✏️" },
]

function todayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function ReminderAdder({
  persons,
  onClose,
  onSubmit,
}: {
  persons: import("@/lib/guest/types").GuestPerson[]
  onClose: () => void
  onSubmit: (input: {
    person_id: string
    reminder_type: ReminderType
    scheduled_at: string
    repeat_rule: "none" | "yearly"
    channel: ReminderChannel
    title: string | null
    location: string | null
    co_person_ids: string[]
    message: string | null
  }) => void
}) {
  const [personId, setPersonId] = React.useState<string>("")
  const [type, setType] = React.useState<ReminderType>("followup")
  const [channel, setChannel] = React.useState<ReminderChannel>("inapp")
  const [date, setDate] = React.useState(todayLocalDate())
  const [time, setTime] = React.useState("09:00")
  const [title, setTitle] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [coPersonIds, setCoPersonIds] = React.useState<string[]>([])
  const [message, setMessage] = React.useState("")

  const submit = () => {
    if (!personId) {
      toast.error("인물을 먼저 선택해 주세요")
      return
    }
    onSubmit({
      person_id: personId,
      reminder_type: type,
      scheduled_at: new Date(`${date}T${time || "09:00"}:00`).toISOString(),
      repeat_rule: type === "birthday" ? "yearly" : "none",
      channel,
      title: title.trim() || null,
      location: location.trim() || null,
      co_person_ids: coPersonIds,
      message: message.trim() || null,
    })
  }

  if (persons.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
        먼저 인물을 등록해 주세요. 등록한 사람에게만 리마인더를 걸 수 있어요.
      </section>
    )
  }

  return (
    <section className="rounded-xl border-2 border-primary bg-primary/5 p-3 space-y-3 shadow-soft scroll-mt-20">
      <h3 className="text-sm font-semibold">리마인더 추가</h3>

      <div>
        <Label className="text-xs">
          대상 인물 <span className="text-destructive">*</span>
        </Label>
        <PersonSelect
          persons={persons}
          value={personId}
          onChange={setPersonId}
          placeholder="인물 선택 (필수)"
        />
        {!personId ? (
          <p className="mt-1 text-[11px] text-warning">
            인물을 먼저 선택해 주세요.
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">종류</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {REMINDER_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={cn(
                "flex items-center justify-center gap-1 rounded-md border px-1 h-9 text-xs tap",
                type === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span aria-hidden>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">알림 채널</Label>
        <Select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ReminderChannel)}
          options={[
            { value: "inapp", label: "앱 내" },
            { value: "webpush", label: "웹 푸시" },
            { value: "kakao", label: "카카오 알림" },
          ]}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">제목</Label>
        <Input
          placeholder="예: 민호 결혼식, 지수 생일 카톡"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
        <Label className="text-xs">장소</Label>
        <Input
          placeholder="예: 강남 메리어트 그랜드볼룸"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
        />
      </div>

      {persons.length > 1 ? (
        <div className="space-y-1">
          <Label className="text-xs">함께하는 사람</Label>
          <PersonMultiSelect
            persons={persons}
            values={coPersonIds}
            onChange={setCoPersonIds}
            excludeIds={personId ? [personId] : undefined}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label className="text-xs">메모</Label>
        <Textarea
          rows={3}
          placeholder="예: 축의금 10만원 / 같이 갈 사람 약속 잡기"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button size="sm" onClick={submit}>
          추가
        </Button>
      </div>

      {type === "birthday" ? (
        <p className="text-[11px] text-muted-foreground">
          생일은 매년 반복으로 등록돼요.
        </p>
      ) : null}
    </section>
  )
}
