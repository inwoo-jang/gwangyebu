"use server"

import { ok, fail, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"

export async function exportUserData(): Promise<
  ActionResult<{
    exportedAt: string
    persons: unknown[]
    tags: unknown[]
    contactsLog: unknown[]
    notes: unknown[]
    reminders: unknown[]
  }>
> {
  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const [persons, tags, contactsLog, notes, reminders] = await Promise.all([
    guard.supabase.from("persons").select("*").eq("user_id", guard.userId),
    guard.supabase.from("tags").select("*").eq("user_id", guard.userId),
    guard.supabase.from("contacts_log").select("*").eq("user_id", guard.userId),
    guard.supabase.from("notes").select("*").eq("user_id", guard.userId),
    guard.supabase.from("reminders").select("*").eq("user_id", guard.userId),
  ])

  if (
    persons.error ||
    tags.error ||
    contactsLog.error ||
    notes.error ||
    reminders.error
  ) {
    return fail({ code: "internal", message: "데이터 가져오기에 실패했어요" })
  }

  return ok({
    exportedAt: new Date().toISOString(),
    persons: persons.data ?? [],
    tags: tags.data ?? [],
    contactsLog: contactsLog.data ?? [],
    notes: notes.data ?? [],
    reminders: reminders.data ?? [],
  })
}
