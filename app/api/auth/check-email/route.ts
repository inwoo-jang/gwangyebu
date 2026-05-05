import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

export const runtime = "nodejs"

const Schema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

/**
 * 이메일 중복 확인.
 * - Service role 키로 public.users 조회 (RLS 우회).
 * - 응답: { available: boolean } — true=가입 가능, false=이미 사용 중
 *
 * 보안 주의: enumeration 가능. 실서비스 규모 키우면 rate limit 또는
 * "이미 가입됨" 응답을 가입/로그인 시점에만 노출하도록 변경 검토.
 */
export async function POST(request: Request) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { available: null, error: "supabase_unavailable" },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { available: null, error: "invalid_json" },
      { status: 400 },
    )
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { available: null, error: "invalid_email" },
      { status: 400 },
    )
  }

  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("email", parsed.data.email)
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { available: null, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ available: data == null })
}
