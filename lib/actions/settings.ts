"use server"

import { revalidatePath } from "next/cache"
import { userSettingsUpdateSchema } from "@/lib/validators/settings"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { UserProfile } from "@/lib/supabase/types"

export async function getUserSettings(): Promise<ActionResult<UserProfile>> {
  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("users")
    .select("*")
    .eq("id", guard.userId)
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "프로필 없음" })
  }
  return ok(data as UserProfile)
}

export async function updateUserSettings(
  input: unknown,
): Promise<ActionResult<UserProfile>> {
  const parsed = userSettingsUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("users")
    .update(parsed.data)
    .eq("id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "갱신 실패" })
  }
  revalidatePath("/settings")
  return ok(data as UserProfile)
}
