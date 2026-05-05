"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"
import { requireUser } from "@/lib/actions/auth-guard"

const BUCKET = "business-cards"

const uploadSchema = z.object({
  person_id: z.string().uuid(),
  /** data URL (data:image/jpeg;base64,...) */
  data_url: z
    .string()
    .startsWith("data:image/", "이미지 데이터 URL이어야 해요"),
})

const clearSchema = z.object({ person_id: z.string().uuid() })

function dataUrlToBytes(dataUrl: string): {
  bytes: Uint8Array
  contentType: string
} {
  const [meta, b64] = dataUrl.split(",", 2)
  if (!meta || !b64) throw new Error("data URL 형식이 잘못됐어요")
  const m = meta.match(/^data:([^;]+);base64$/)
  if (!m) throw new Error("base64 인코딩이 아니에요")
  const contentType = m[1]
  const buf = Buffer.from(b64, "base64")
  return { bytes: new Uint8Array(buf), contentType }
}

/**
 * 명함 이미지를 Storage에 업로드하고 persons.business_card_url 갱신.
 * 이미 클라이언트에서 9:5 크롭/리사이즈된 dataURL을 받음.
 */
export async function uploadBusinessCard(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const parsed = uploadSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  // 소유 확인
  const { data: person } = await guard.supabase
    .from("persons")
    .select("id, user_id")
    .eq("id", parsed.data.person_id)
    .eq("user_id", guard.userId)
    .maybeSingle()
  if (!person) {
    return fail({ code: "not_found", message: "인물을 찾을 수 없습니다" })
  }

  let bytes: Uint8Array
  let contentType: string
  try {
    const out = dataUrlToBytes(parsed.data.data_url)
    bytes = out.bytes
    contentType = out.contentType
  } catch (e) {
    return fail({
      code: "validation",
      message: e instanceof Error ? e.message : "이미지 처리 실패",
    })
  }

  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg"
  // 캐시 무효화를 위해 timestamp 포함
  const path = `${guard.userId}/${parsed.data.person_id}-${Date.now()}.${ext}`

  const { error: upErr } = await guard.supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false })
  if (upErr) {
    return fail({ code: "internal", message: upErr.message })
  }

  const { data: pub } = guard.supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = pub.publicUrl

  const { error: updErr } = await guard.supabase
    .from("persons")
    .update({ business_card_url: publicUrl })
    .eq("id", parsed.data.person_id)
    .eq("user_id", guard.userId)
  if (updErr) {
    return fail({ code: "internal", message: updErr.message })
  }

  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok({ url: publicUrl })
}

export async function clearBusinessCard(
  input: unknown,
): Promise<ActionResult<{ cleared: true }>> {
  const parsed = clearSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const guard = await requireUser()
  if (!guard.ok) return guard.error

  const { data: person } = await guard.supabase
    .from("persons")
    .select("id, business_card_url")
    .eq("id", parsed.data.person_id)
    .eq("user_id", guard.userId)
    .maybeSingle<{ id: string; business_card_url: string | null }>()
  if (!person) {
    return fail({ code: "not_found", message: "인물을 찾을 수 없습니다" })
  }

  // Storage 객체 삭제 (URL → path 추출)
  if (person.business_card_url) {
    const url = person.business_card_url
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx >= 0) {
      const path = url.slice(idx + marker.length)
      await guard.supabase.storage.from(BUCKET).remove([path])
    }
  }

  await guard.supabase
    .from("persons")
    .update({ business_card_url: null })
    .eq("id", parsed.data.person_id)
    .eq("user_id", guard.userId)

  revalidatePath(`/persons/${parsed.data.person_id}`)
  return ok({ cleared: true })
}
