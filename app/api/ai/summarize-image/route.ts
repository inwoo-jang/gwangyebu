import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 30

const SYSTEM = `당신은 사용자의 친구·동료 관계 메모를 정리해주는 한국어 어시스턴트입니다.
사용자가 카카오톡 대화 스크린샷을 보여주면, 화면 속 대화의 핵심만 1~2문장으로 짧게 요약해 메모용 텍스트를 만듭니다.

원칙:
- 한국어, 친근한 평어 또는 부드러운 경어 일관 유지
- 1~2문장 (100자 이내)
- 사실만, 추측 금지
- 약속/마감/숫자/장소 등 구체 정보가 있으면 우선 포함
- 따옴표·특수서식 없이 평문으로
- 이미지가 카톡 대화가 아니면 "대화 화면이 아닙니다"라고 답하기`

interface FailureBody {
  ok: false
  error: string
}
interface SuccessBody {
  ok: true
  summary: string
  model: string
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])

const MAX_BYTES = 6 * 1024 * 1024 // 6MB

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json<FailureBody>(
      { ok: false, error: "NO_ANTHROPIC_KEY" },
      { status: 503 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json<FailureBody>(
      { ok: false, error: "INVALID_FORM" },
      { status: 400 },
    )
  }
  const file = formData.get("image")
  const personName = (formData.get("personName") as string | null) ?? ""
  const date = (formData.get("date") as string | null) ?? ""

  if (!(file instanceof File)) {
    return NextResponse.json<FailureBody>(
      { ok: false, error: "MISSING_IMAGE" },
      { status: 400 },
    )
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json<FailureBody>(
      { ok: false, error: "UNSUPPORTED_MIME" },
      { status: 415 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json<FailureBody>(
      { ok: false, error: "FILE_TOO_LARGE" },
      { status: 413 },
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const mediaType = (
    file.type === "image/jpg" ? "image/jpeg" : file.type
  ) as "image/jpeg" | "image/png" | "image/webp" | "image/gif"

  const userPromptHeader = [
    personName ? `상대: ${personName}` : null,
    date ? `대화 날짜: ${date}` : null,
    "이 카카오톡 스크린샷의 대화 핵심을 1~2문장으로 메모해주세요.",
  ]
    .filter(Boolean)
    .join("\n")

  const client = new Anthropic({ apiKey })
  const model =
    process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"

  try {
    const result = await client.messages.create({
      model,
      max_tokens: 200,
      temperature: 0.3,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            { type: "text", text: userPromptHeader },
          ],
        },
      ],
    })
    const textBlock = result.content.find((b) => b.type === "text")
    const summary =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : ""
    if (!summary) {
      return NextResponse.json<FailureBody>(
        { ok: false, error: "EMPTY_RESPONSE" },
        { status: 502 },
      )
    }
    return NextResponse.json<SuccessBody>({
      ok: true,
      summary,
      model: result.model,
    })
  } catch (err) {
    return NextResponse.json<FailureBody>(
      {
        ok: false,
        error: err instanceof Error ? err.message : "AI_ERROR",
      },
      { status: 502 },
    )
  }
}
