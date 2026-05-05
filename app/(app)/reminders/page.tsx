import { isToday, isThisWeek, isPast } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { ReminderListItem } from "@/components/relationship/reminder-list-item"
import { EmptyState } from "@/components/common/empty-state"
import { ReminderCreateForm } from "@/components/relationship/reminder-create-form"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import {
  fetchAllReminders,
  type ReminderWithPerson,
} from "@/lib/queries/reminders"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestReminders } from "@/components/guest/guest-reminders"
import { createClient } from "@/lib/supabase/server"
import type { Person } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "리마인더" }

interface RemindersPageProps {
  searchParams?: Promise<{ add?: string }>
}

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

export default async function RemindersPage({
  searchParams,
}: RemindersPageProps) {
  if (await isGuestMode()) {
    return <GuestReminders />
  }
  const sp = (await searchParams) ?? {}
  const autoOpen = sp.add === "1"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: personRows } = user
    ? await supabase
        .from("persons")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("name", { ascending: true })
    : { data: [] }
  const persons = (personRows ?? []) as Person[]

  const reminders = await fetchAllReminders()
  const buckets = bucketize(reminders)

  const headerActions = (
    <ReminderCreateForm
      availablePersons={persons}
      defaultOpen={autoOpen}
      trigger={
        <Button size="sm" variant="ghost" className="gap-1">
          <Bell className="h-4 w-4" />
          추가
        </Button>
      }
    />
  )

  if (reminders.length === 0) {
    return (
      <AppShell
        header={<AppHeader title="리마인더" actions={headerActions} />}
      >
        <EmptyState
          icon="🔔"
          title="예정된 리마인더가 없어요"
          description={
            persons.length === 0
              ? "먼저 인맥을 추가한 뒤 리마인더를 만들어보세요."
              : "오른쪽 위 ‘추가’ 버튼이나 + 플로팅 메뉴로 만들어보세요."
          }
          action={
            persons.length === 0
              ? { label: "+ 인맥 추가", href: "/persons/new" }
              : undefined
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell header={<AppHeader title="리마인더" actions={headerActions} />}>
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
