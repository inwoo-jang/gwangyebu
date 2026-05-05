/**
 * POST /api/ai/analyze
 * Body: { personId: string, provider?: "claude" | "gemini" }
 * Response: 200 RelationshipScoreRecord | 400/401/403/404/429/500
 *
 * 책임:
 *  1. 인증 확인 + 해당 personId가 현재 user의 인물인지 확인 (RLS로 자동, 추가 방어)
 *  2. 사용자당 일 분석 quota 확인 (provider_usage 합계 또는 user_settings.daily_ai_quota)
 *  3. analyzeRelationship 호출 + 결과 반환
 */

import { NextResponse } from "next/server"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { analyzeRelationship } from "@/lib/ai/relationship-analysis"
import { createSupabaseLoader } from "@/lib/ai/supabase-loader"
import type { ProviderName } from "@/lib/ai/types"

export const runtime = "nodejs" // fs/path 사용을 위해 edge 금지
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  personId: z.string().uuid(),
  provider: z.enum(["claude", "gemini"]).optional(),
})

const DEFAULT_DAILY_QUOTA = parseInt(
  process.env.AI_DAILY_QUOTA_PER_USER ?? "50",
  10
)

export async function POST(req: Request) {
  // 1. 본문 파싱
  let payload: { personId: string; provider?: ProviderName }
  try {
    const json = await req.json()
    const parsed = requestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    payload = parsed.data
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400 }
    )
  }

  // 2. 인증
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // 3. 본인 person 확인 (RLS도 막지만 명시적으로)
  const { data: ownership } = await supabase
    .from("persons")
    .select("id")
    .eq("id", payload.personId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (!ownership) {
    return NextResponse.json({ error: "person_not_found" }, { status: 404 })
  }

  // 4. 일일 quota 체크
  const quota = await getUserDailyQuota(supabase, user.id)
  const used = await countTodayUsage(supabase, user.id)
  if (used >= quota) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        message: "오늘의 AI 분석 한도에 도달했어요.",
        quota,
        used,
      },
      { status: 429 }
    )
  }

  // 5. 분석 실행
  try {
    const loader = createSupabaseLoader({ client: supabase, userId: user.id })
    const record = await analyzeRelationship(payload.personId, {
      loader,
      provider: payload.provider,
    })

    // 사용량 로그 (best-effort — 실패해도 응답은 정상)
    void recordUsage(supabase, {
      userId: user.id,
      provider: record.provider,
      model: record.model,
    })

    return NextResponse.json(record, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error"
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        type: "ai_analyze_error",
        userId: user.id,
        personId: payload.personId,
        message,
      })
    )
    return NextResponse.json(
      { error: "analysis_failed", message },
      { status: 500 }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// quota 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

async function getUserDailyQuota(
  supabase: ServerSupabase,
  userId: string
): Promise<number> {
  // user_settings 테이블이 있다면 거기 daily_ai_quota 사용. 없으면 ENV 기본값.
  try {
    const { data } = await supabase
      .from("user_settings")
      .select("daily_ai_quota")
      .eq("user_id", userId)
      .maybeSingle<{ daily_ai_quota: number | null }>()
    if (data && typeof data.daily_ai_quota === "number" && data.daily_ai_quota > 0) {
      return data.daily_ai_quota
    }
  } catch {
    // 테이블 미존재 — 기본값 사용
  }
  return DEFAULT_DAILY_QUOTA
}

async function countTodayUsage(
  supabase: ServerSupabase,
  userId: string
): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  try {
    const { count, error } = await supabase
      .from("provider_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString())
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

async function recordUsage(
  supabase: ServerSupabase,
  args: { userId: string; provider: ProviderName; model: string }
): Promise<void> {
  try {
    await supabase.from("provider_usage").insert({
      user_id: args.userId,
      provider: args.provider,
      model: args.model,
      input_tokens: 0,
      output_tokens: 0,
      cost_micro_krw: 0,
      purpose: "manual_trigger",
    })
  } catch {
    // best-effort
  }
}
