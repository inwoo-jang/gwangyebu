"use server"

import { revalidatePath } from "next/cache"
import {
  tagCreateSchema,
  tagAttachSchema,
  tagDetachSchema,
  tagUpdateSchema,
  tagIdSchema,
} from "@/lib/validators/tag"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { Tag } from "@/lib/supabase/types"

export async function createTag(input: unknown): Promise<ActionResult<Tag>> {
  const parsed = tagCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("tags")
    .insert({ ...parsed.data, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    if (error?.code === "23505") {
      return fail({ code: "conflict", message: "이미 존재하는 태그명입니다" })
    }
    return fail({ code: "internal", message: error?.message ?? "생성 실패" })
  }
  revalidatePath("/")
  return ok(data as Tag)
}

export async function listTags(): Promise<ActionResult<Tag[]>> {
  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("tags")
    .select("*")
    .eq("user_id", guard.userId)
    .order("name", { ascending: true })

  if (error) return fail({ code: "internal", message: error.message })
  return ok((data ?? []) as Tag[])
}

export async function addTag(
  input: unknown,
): Promise<ActionResult<{ person_id: string; tag_id: string }>> {
  const parsed = tagAttachSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { error } = await guard.supabase.from("person_tags").insert({
    ...parsed.data,
    user_id: guard.userId,
  })

  if (error) {
    if (error.code === "23505") return ok(parsed.data)
    return fail({ code: "internal", message: error.message })
  }
  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok(parsed.data)
}

export async function removeTag(
  input: unknown,
): Promise<ActionResult<{ person_id: string; tag_id: string }>> {
  const parsed = tagDetachSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { error } = await guard.supabase
    .from("person_tags")
    .delete()
    .eq("person_id", parsed.data.person_id)
    .eq("tag_id", parsed.data.tag_id)
    .eq("user_id", guard.userId)

  if (error) return fail({ code: "internal", message: error.message })
  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok(parsed.data)
}

/** 태그 이름 수정. */
export async function updateTag(
  input: unknown,
): Promise<ActionResult<Tag>> {
  const parsed = tagUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("tags")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    if (error?.code === "23505") {
      return fail({ code: "conflict", message: "이미 존재하는 태그명입니다" })
    }
    return fail({ code: "internal", message: error?.message ?? "수정 실패" })
  }
  revalidatePath("/")
  return ok(data as Tag)
}

/** 태그 삭제. ON DELETE CASCADE로 person_tags도 정리. */
export async function deleteTag(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = tagIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { error } = await guard.supabase
    .from("tags")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)

  if (error) return fail({ code: "internal", message: error.message })
  revalidatePath("/")
  return ok({ id: parsed.data.id })
}
