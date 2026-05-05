"use server"

import { revalidatePath } from "next/cache"
import {
  eventCreateSchema,
  eventUpdateSchema,
  eventIdSchema,
  giftCreateSchema,
  giftUpdateSchema,
  giftIdSchema,
  loanCreateSchema,
  loanUpdateSchema,
  loanIdSchema,
} from "@/lib/validators/exchange"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"
import type { EventRecord, Gift, Loan } from "@/lib/supabase/types"

// ===== events =====

export async function createEvent(
  input: unknown,
): Promise<ActionResult<EventRecord>> {
  const parsed = eventCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("events")
    .insert({ ...parsed.data, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "저장 실패" })
  }
  revalidatePath(`/persons/${parsed.data.person_id}`)
  revalidatePath("/records")
  return ok(data as EventRecord)
}

export async function updateEvent(
  input: unknown,
): Promise<ActionResult<EventRecord>> {
  const parsed = eventUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { id, ...patch } = parsed.data
  const { data, error } = await guard.supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: error?.message ?? "수정 실패" })
  }
  revalidatePath(`/persons/${(data as EventRecord).person_id}`)
  revalidatePath("/records")
  return ok(data as EventRecord)
}

export async function deleteEvent(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = eventIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("events")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("id, person_id")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "삭제 대상 없음" })
  }
  const row = data as { id: string; person_id: string }
  revalidatePath(`/persons/${row.person_id}`)
  revalidatePath("/records")
  return ok({ id: row.id })
}

export async function listEvents(
  input: { person_id?: string } = {},
): Promise<ActionResult<EventRecord[]>> {
  const guard = await requireUser()
  if (!guard.ok) return guard.error

  let q = guard.supabase
    .from("events")
    .select("*")
    .eq("user_id", guard.userId)
    .order("occurred_at", { ascending: false })

  if (input.person_id) q = q.eq("person_id", input.person_id)

  const { data, error } = await q
  if (error) return fail({ code: "internal", message: error.message })
  return ok((data ?? []) as EventRecord[])
}

// ===== gifts =====

export async function createGift(
  input: unknown,
): Promise<ActionResult<Gift>> {
  const parsed = giftCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("gifts")
    .insert({ ...parsed.data, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "저장 실패" })
  }
  revalidatePath(`/persons/${parsed.data.person_id}`)
  revalidatePath("/records")
  return ok(data as Gift)
}

export async function updateGift(
  input: unknown,
): Promise<ActionResult<Gift>> {
  const parsed = giftUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { id, ...patch } = parsed.data
  const { data, error } = await guard.supabase
    .from("gifts")
    .update(patch)
    .eq("id", id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: error?.message ?? "수정 실패" })
  }
  revalidatePath(`/persons/${(data as Gift).person_id}`)
  revalidatePath("/records")
  return ok(data as Gift)
}

export async function deleteGift(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = giftIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("gifts")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("id, person_id")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "삭제 대상 없음" })
  }
  const row = data as { id: string; person_id: string }
  revalidatePath(`/persons/${row.person_id}`)
  revalidatePath("/records")
  return ok({ id: row.id })
}

export async function listGifts(
  input: { person_id?: string } = {},
): Promise<ActionResult<Gift[]>> {
  const guard = await requireUser()
  if (!guard.ok) return guard.error

  let q = guard.supabase
    .from("gifts")
    .select("*")
    .eq("user_id", guard.userId)
    .order("occurred_at", { ascending: false })

  if (input.person_id) q = q.eq("person_id", input.person_id)

  const { data, error } = await q
  if (error) return fail({ code: "internal", message: error.message })
  return ok((data ?? []) as Gift[])
}

// ===== loans =====

export async function createLoan(
  input: unknown,
): Promise<ActionResult<Loan>> {
  const parsed = loanCreateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("loans")
    .insert({ ...parsed.data, user_id: guard.userId })
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "internal", message: error?.message ?? "저장 실패" })
  }
  revalidatePath(`/persons/${parsed.data.person_id}`)
  revalidatePath("/records")
  return ok(data as Loan)
}

export async function updateLoan(
  input: unknown,
): Promise<ActionResult<Loan>> {
  const parsed = loanUpdateSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { id, ...patch } = parsed.data
  const { data, error } = await guard.supabase
    .from("loans")
    .update(patch)
    .eq("id", id)
    .eq("user_id", guard.userId)
    .select("*")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: error?.message ?? "수정 실패" })
  }
  revalidatePath(`/persons/${(data as Loan).person_id}`)
  revalidatePath("/records")
  return ok(data as Loan)
}

export async function deleteLoan(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = loanIdSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data, error } = await guard.supabase
    .from("loans")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", guard.userId)
    .select("id, person_id")
    .single()

  if (error || !data) {
    return fail({ code: "not_found", message: "삭제 대상 없음" })
  }
  const row = data as { id: string; person_id: string }
  revalidatePath(`/persons/${row.person_id}`)
  revalidatePath("/records")
  return ok({ id: row.id })
}

export async function markLoanReturned(
  input: { id: string; returned_at: string },
): Promise<ActionResult<Loan>> {
  return updateLoan(input)
}

export async function listLoans(
  input: { person_id?: string; only_open?: boolean } = {},
): Promise<ActionResult<Loan[]>> {
  const guard = await requireUser()
  if (!guard.ok) return guard.error

  let q = guard.supabase
    .from("loans")
    .select("*")
    .eq("user_id", guard.userId)
    .order("occurred_at", { ascending: false })

  if (input.person_id) q = q.eq("person_id", input.person_id)
  if (input.only_open) q = q.is("returned_at", null)

  const { data, error } = await q
  if (error) return fail({ code: "internal", message: error.message })
  return ok((data ?? []) as Loan[])
}
