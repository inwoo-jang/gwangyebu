import { isGuestMode } from "@/lib/guest/mode"
import { GuestRecords } from "@/components/guest/guest-records"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { RecordsTabs } from "@/components/relationship/records-tabs"
import { createClient } from "@/lib/supabase/server"
import type {
  EventRecord,
  Gift,
  Loan,
  Person,
} from "@/lib/supabase/types"

export const metadata = { title: "기록" }
export const dynamic = "force-dynamic"

export default async function RecordsPage() {
  if (await isGuestMode()) {
    return <GuestRecords />
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return (
      <AppShell header={<AppHeader title="주고받은 기록" />}>
        <p className="text-sm text-muted-foreground">로그인이 필요합니다.</p>
      </AppShell>
    )
  }

  const [
    { data: persons },
    { data: events },
    { data: gifts },
    { data: loans },
  ] = await Promise.all([
    supabase
      .from("persons")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("gifts")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("loans")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false }),
  ])

  return (
    <AppShell header={<AppHeader title="주고받은 기록" />}>
      <RecordsTabs
        persons={(persons ?? []) as Person[]}
        events={(events ?? []) as EventRecord[]}
        gifts={(gifts ?? []) as Gift[]}
        loans={(loans ?? []) as Loan[]}
      />
    </AppShell>
  )
}
