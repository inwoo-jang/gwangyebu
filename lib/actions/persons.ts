"use server"

import { revalidatePath } from "next/cache"
import {
  personCreateSchema,
  personUpdateSchema,
  personIdSchema,
  personListSchema,
} from "@/lib/validators/person"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { Person } from "@/lib/supabase/types"

export async function createPerson(
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = personCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { tag_ids, ...personData } = parsed.data

  const { data, error } = await guard.supabase
    .from("persons")
    .insert({ ...personData, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "생성 실패" })
  }

  if (tag_ids && tag_ids.length > 0) {
    const rows = tag_ids.map((tag_id) => ({
      person_id: data.id,
      tag_id,
      user_id: guard.userId,
    }))
    const { error: linkErr } = await guard.supabase
      .from("person_tags")
      .insert(rows)
    if (linkErr) {
      return fail({ code: "internal", message: linkErr.message })
    }
  }

  revalidatePath("/")
  revalidatePath("/persons")
  return ok(data as Person)
}

export async function updatePerson(
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = personUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { id, tag_ids, ...patch } = parsed.data

  const { data, error } = await guard.supabase
    .from("persons")
    .update(patch)
    .eq("id", id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: error?.message ?? "수정 대상 없음" })
  }

  if (tag_ids !== undefined) {
    // 전체 교체
    await guard.supabase.from("person_tags").delete().eq("person_id", id)
    if (tag_ids.length > 0) {
      const rows = tag_ids.map((tag_id) => ({
        person_id: id,
        tag_id,
        user_id: guard.userId,
      }))
      const { error: linkErr } = await guard.supabase
        .from("person_tags")
        .insert(rows)
      if (linkErr) {
        return fail({ code: "internal", message: linkErr.message })
      }
    }
  }

  revalidatePath("/")
  revalidatePath(`/persons/${id}`)
  return ok(data as Person)
}

export async function deletePerson(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = personIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  // soft-delete
  const { data, error } = await guard.supabase
    .from("persons")
    .update({ deleted_at: new Date().toISOString(), status: "inactive" })
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("id")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: error?.message ?? "삭제 대상 없음" })
  }

  revalidatePath("/")
  revalidatePath("/persons")
  return ok({ id: data.id as string })
}

export async function listPersons(
  input: unknown = {},
): Promise<ActionResult<Person[]>> {
  const parsed = personListSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const f = parsed.data
  let q = guard.supabase
    .from("persons")
    .select("*")
    .eq("user_id", guard.userId)
    .order("last_contact_at", { ascending: false, nullsFirst: false })
    .range(f.offset, f.offset + f.limit - 1)

  if (!f.include_deleted) q = q.is("deleted_at", null)
  if (f.status) q = q.eq("status", f.status)
  if (f.relationship_types && f.relationship_types.length > 0) {
    q = q.in("relationship_type", f.relationship_types)
  }
  if (f.query && f.query.trim().length > 0) {
    const safe = f.query.replace(/[%_]/g, "\\$&")
    q = q.or(
      `name.ilike.%${safe}%,memo.ilike.%${safe}%,how_we_met.ilike.%${safe}%`,
    )
  }

  const { data, error } = await q
  if (error) return fail({ code: "internal", message: error.message })

  let rows = (data ?? []) as Person[]

  if (f.tag_ids && f.tag_ids.length > 0) {
    const ids = rows.map((r) => r.id)
    if (ids.length === 0) return ok([])
    const { data: links, error: linkErr } = await guard.supabase
      .from("person_tags")
      .select("person_id, tag_id")
      .in("person_id", ids)
      .in("tag_id", f.tag_ids)
    if (linkErr) return fail({ code: "internal", message: linkErr.message })
    const allowed = new Set((links ?? []).map((r) => r.person_id as string))
    rows = rows.filter((r) => allowed.has(r.id))
  }

  return ok(rows)
}

export async function getPerson(
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = personIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("persons")
    .select("*")
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "인물을 찾을 수 없습니다" })
  }
  return ok(data as Person)
}

export interface BulkImportItem {
  name: string
  phone: string | null
  email: string | null
}

export interface BulkImportResult {
  added: number
  skipped: number
}

/**
 * 전화번호부에서 가져온 연락처를 일괄 등록.
 * - 이름 기준으로 기존 인물과 중복 제거
 * - 전화번호/이메일은 일단 memo에 저장 (persons 스키마에 별도 컬럼 없음)
 */
export async function bulkCreatePersons(
  items: BulkImportItem[],
): Promise<ActionResult<BulkImportResult>> {
  if (!Array.isArray(items) || items.length === 0) {
    return ok({ added: 0, skipped: 0 })
  }

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  // 기존 이름 가져와서 중복 제거
  const { data: existing, error: existErr } = await guard.supabase
    .from("persons")
    .select("name")
    .eq("user_id", guard.userId)
    .is("deleted_at", null)

  if (existErr) return fail({ code: "internal", message: existErr.message })

  const existingNames = new Set(
    (existing ?? []).map((r) => String(r.name).trim()),
  )

  const toInsert: Array<{
    user_id: string
    name: string
    relationship_type: "etc"
    memo: string | null
    reminder_interval_days: number
    status: "active"
  }> = []
  const seenInBatch = new Set<string>()
  let skipped = 0

  for (const item of items) {
    const name = (item.name ?? "").trim()
    if (!name || name.length > 50) {
      skipped += 1
      continue
    }
    if (existingNames.has(name) || seenInBatch.has(name)) {
      skipped += 1
      continue
    }
    seenInBatch.add(name)

    const memoParts: string[] = []
    if (item.phone) memoParts.push(`전화: ${item.phone}`)
    if (item.email) memoParts.push(`이메일: ${item.email}`)
    const memo = memoParts.length > 0 ? memoParts.join("\n") : null

    toInsert.push({
      user_id: guard.userId,
      name,
      relationship_type: "etc",
      memo,
      reminder_interval_days: 60,
      status: "active",
    })
  }

  if (toInsert.length === 0) {
    return ok({ added: 0, skipped })
  }

  const { error } = await guard.supabase.from("persons").insert(toInsert)
  if (error) return fail({ code: "internal", message: error.message })

  revalidatePath("/")
  revalidatePath("/persons")
  return ok({ added: toInsert.length, skipped })
}
