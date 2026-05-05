import { NextResponse } from "next/server"
import { z } from "zod"
import { completeWithFallback } from "@/lib/ai"

export const runtime = "nodejs"

const RequestSchema = z.object({
  /** 인물 이름 — 프롬프트에 컨텍스트로 들어감 */
  personName: z.string().max(50).optional(),
  /** 대화 일자 (YYYY-MM-DD) */
  date: z.string().optional(),
  /** 채널 (kakao 등) */
  channel: z.string().optional(),
  /** 평문 대화 내용. 너무 길면 클라이언트에서 trim. */
  text: z.string().min(1).max(40_000),
})

const SYSTEM = `당신은 사용자의 친구·동료 관계 메모를 정리해주는 한국어 어시스턴트입니다.
사용자가 카카오톡 대화 내용 일부를 보여주면, 핵심만 1~2문장으로 짧게 요약해 메모용 텍스트를 만듭니다.

원칙:
- 한국어, 친근한 평어 또는 부드러운 경어 일관 유지
- 1~2문장 (100자 이내)
- 사실만, 추측 금지
- 약속/마감/숫자/장소 등 구체 정보가 있으면 우선 포함
- 따옴표·특수서식 없이 평문으로
- "요약하면", "정리하면" 같은 메타 표현 금지`

interface FailureBody {
  ok: false
  error: string
  fallback?: string
}
interface SuccessBody {
  ok: true
  summary: string
  provider: string
  model: string
}

function ruleBasedFallback(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("---"))
  if (lines.length === 0) return ""
  const total = lines.length
  const head = lines[0].slice(0, 40)
  const tail = lines[lines.length - 1].slice(0, 40)
  return total <= 1
    ? head
    : `${total}개 메시지 — “${head}…” → “${tail}”`
}

export async function POST(request: Request) {
  let body: z.infer<typeof RequestSchema>
  try {
    const json = await request.json()
    const parsed = RequestSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json<FailureBody>(
        { ok: false, error: "INVALID_INPUT" },
        { status: 400 },
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json<FailureBody>(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 },
    )
  }

  const userPrompt = [
    body.personName ? `상대: ${body.personName}` : null,
    body.date ? `날짜: ${body.date}` : null,
    body.channel ? `채널: ${body.channel}` : null,
    "",
    "다음 대화의 핵심을 1~2문장으로 메모해주세요.",
    "",
    body.text,
  ]
    .filter((x) => x !== null)
    .join("\n")

  const hasAnyKey =
    Boolean(process.env.ANTHROPIC_API_KEY) ||
    Boolean(process.env.GEMINI_API_KEY)

  if (!hasAnyKey) {
    return NextResponse.json<FailureBody>(
      {
        ok: false,
        error: "NO_AI_KEY",
        fallback: ruleBasedFallback(body.text),
      },
      { status: 503 },
    )
  }

  try {
    const res = await completeWithFallback({
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 200,
      temperature: 0.3,
    })
    return NextResponse.json<SuccessBody>({
      ok: true,
      summary: res.text.trim(),
      provider: res.provider,
      model: res.model,
    })
  } catch (err) {
    return NextResponse.json<FailureBody>(
      {
        ok: false,
        error: err instanceof Error ? err.message : "AI_ERROR",
        fallback: ruleBasedFallback(body.text),
      },
      { status: 502 },
    )
  }
}
