import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Reminder } from "@/lib/supabase/types"

export type ReminderWithPerson = Reminder & { person_name: string }

export async function fetchAllReminders(): Promise<ReminderWithPerson[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("reminders")
    .select("*, persons!inner(name)")
    .eq("user_id", user.id)
    .in("status", ["active", "snoozed"])
    .order("scheduled_at", { ascending: true })

  return ((data ?? []) as Array<
    Reminder & { persons: { name: string } | { name: string }[] | null }
  >).map((r) => {
    const persons = r.persons
    const name = Array.isArray(persons)
      ? persons[0]?.name
      : persons?.name
    return { ...r, person_name: name ?? "" }
  })
}
