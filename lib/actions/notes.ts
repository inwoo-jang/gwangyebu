"use server"

import { revalidatePath } from "next/cache"
import {
  noteCreateSchema,
  noteUpdateSchema,
  noteIdSchema,
} from "@/lib/validators/note"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { Note } from "@/lib/supabase/types"

export async function addNote(input: unknown): Promise<ActionResult<Note>> {
  const parsed = noteCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("notes")
    .insert({ ...parsed.data, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "저장 실패" })
  }
  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok(data as Note)
}

export async function updateNote(
  input: unknown,
): Promise<ActionResult<Note>> {
  const parsed = noteUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { id, ...patch } = parsed.data
  const { data, error } = await guard.supabase
    .from("notes")
    .update(patch)
    .eq("id", id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "노트를 찾을 수 없습니다" })
  }
  revalidatePath(`/persons/${(data as Note).person_id}`)
  return ok(data as Note)
}

export async function deleteNote(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = noteIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("notes")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("id, person_id")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "노트를 찾을 수 없습니다" })
  }
  if ((data as { person_id: string }).person_id) {
    revalidatePath(`/persons/${(data as { person_id: string }).person_id}`)
  }
  return ok({ id: (data as { id: string }).id })
}
