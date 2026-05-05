"use server"

import { revalidatePath } from "next/cache"
import { contactLogCreateSchema } from "@/lib/validators/contact"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { ContactLog } from "@/lib/supabase/types"

export async function logContact(
  input: unknown,
): Promise<ActionResult<ContactLog>> {
  const parsed = contactLogCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const occurred_at = parsed.data.occurred_at ?? new Date().toISOString()

  const { data, error } = await guard.supabase
    .from("contacts_log")
    .insert({
      person_id: parsed.data.person_id,
      channel: parsed.data.channel,
      direction: parsed.data.direction,
      memo: parsed.data.memo ?? null,
      occurred_at,
      user_id: guard.userId,
    })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "저장 실패" })
  }

  // last_contact_at은 DB 트리거가 자동 갱신
  revalidatePath("/")
  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok(data as ContactLog)
}
