"use server"

import { revalidatePath } from "next/cache"
import {
  reminderCreateSchema,
  reminderCompleteSchema,
  reminderListSchema,
} from "@/lib/validators/reminder"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { Reminder } from "@/lib/supabase/types"

export async function createReminder(
  input: unknown,
): Promise<ActionResult<Reminder>> {
  const parsed = reminderCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  // followup인 경우 기존 활성 followup을 dismissed 처리 (인물당 1개 제약)
  if (parsed.data.reminder_type === "followup") {
    await guard.supabase
      .from("reminders")
      .update({ status: "dismissed" })
      .eq("person_id", parsed.data.person_id)
      .eq("user_id", guard.userId)
      .eq("reminder_type", "followup")
      .eq("status", "active")
  }

  const { data, error } = await guard.supabase
    .from("reminders")
    .insert({ ...parsed.data, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "생성 실패" })
  }
  revalidatePath("/")
  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok(data as Reminder)
}

export async function completeReminder(
  input: unknown,
): Promise<ActionResult<Reminder>> {
  const parsed = reminderCompleteSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("reminders")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: error?.message ?? "리마인더 없음" })
  }
  revalidatePath("/")
  return ok(data as Reminder)
}

export async function listReminders(
  input: unknown = {},
): Promise<ActionResult<Reminder[]>> {
  const parsed = reminderListSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const f = parsed.data
  let q = guard.supabase
    .from("reminders")
    .select("*")
    .eq("user_id", guard.userId)
    .order("scheduled_at", { ascending: true })
    .limit(f.limit)

  if (f.status) q = q.eq("status", f.status)
  if (f.person_id) q = q.eq("person_id", f.person_id)
  if (f.from) q = q.gte("scheduled_at", f.from)
  if (f.to) q = q.lte("scheduled_at", f.to)

  const { data, error } = await q
  if (error) return fail({ code: "internal", message: error.message })
  return ok((data ?? []) as Reminder[])
}
