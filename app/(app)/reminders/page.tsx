import { isToday, isThisWeek, isPast } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { ReminderListItem } from "@/components/relationship/reminder-list-item"
import { EmptyState } from "@/components/common/empty-state"
import {
  fetchAllReminders,
  type ReminderWithPerson,
} from "@/lib/queries/reminders"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestReminders } from "@/components/guest/guest-reminders"

export const dynamic = "force-dynamic"
export const metadata = { title: "리마인더" }

interface Buckets {
  overdue: ReminderWithPerson[]
  today: ReminderWithPerson[]
  week: ReminderWithPerson[]
  later: ReminderWithPerson[]
}

function bucketize(items: ReminderWithPerson[]): Buckets {
  const overdue: ReminderWithPerson[] = []
  const today: ReminderWithPerson[] = []
  const week: ReminderWithPerson[] = []
  const later: ReminderWithPerson[] = []

  const now = new Date()
  for (const r of items) {
    const date = new Date(r.scheduled_at)
    if (isPast(date) && !isToday(date)) overdue.push(r)
    else if (isToday(date)) today.push(r)
    else if (isThisWeek(date, { weekStartsOn: 1 })) week.push(r)
    else later.push(r)
    // unused now
    void now
  }
  return { overdue, today, week, later }
}

export default async function RemindersPage() {
  if (await isGuestMode()) {
    return <GuestReminders />
  }
  const reminders = await fetchAllReminders()
  const buckets = bucketize(reminders)

  if (reminders.length === 0) {
    return (
      <AppShell header={<AppHeader title="리마인더" />}>
        <EmptyState
          icon="🔔"
          title="예정된 리마인더가 없어요"
          description="인물 상세에서 리마인더를 추가해보세요."
          action={{ label: "+ 인물 보기", href: "/" }}
        />
      </AppShell>
    )
  }

  return (
    <AppShell header={<AppHeader title="리마인더" />}>
      <div className="space-y-6">
        {buckets.overdue.length > 0 ? (
          <Section title="지난 일정" tone="destructive">
            {buckets.overdue.map((r) => (
              <ReminderListItem key={r.id} reminder={r} />
            ))}
          </Section>
        ) : null}
        {buckets.today.length > 0 ? (
          <Section title="오늘">
            {buckets.today.map((r) => (
              <ReminderListItem key={r.id} reminder={r} />
            ))}
          </Section>
        ) : null}
        {buckets.week.length > 0 ? (
          <Section title="이번 주">
            {buckets.week.map((r) => (
              <ReminderListItem key={r.id} reminder={r} />
            ))}
          </Section>
        ) : null}
        {buckets.later.length > 0 ? (
          <Section title="이후">
            {buckets.later.map((r) => (
              <ReminderListItem key={r.id} reminder={r} />
            ))}
          </Section>
        ) : null}
      </div>
    </AppShell>
  )
}

function Section({
  title,
  tone,
  children,
}: {
  title: string
  tone?: "destructive"
  children: React.ReactNode
}) {
  return (
    <section>
      <h2
        className={`mb-2 text-sm font-semibold ${
          tone === "destructive" ? "text-destructive" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
