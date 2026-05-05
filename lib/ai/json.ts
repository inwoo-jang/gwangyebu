/**
 * LLM 응답에서 JSON을 추출/검증하는 유틸.
 *
 * - 1차: 응답 텍스트에서 ```json``` 코드 블록을 추출, 없으면 첫 `{...}` 또는 `[...]` 범위.
 * - 2차: zod 스키마로 검증.
 * - 실패 시 더 엄격한 시스템 프롬프트로 1회 재시도.
 */

import type { z } from "zod"

import { completeWithFallback, getProvider } from "./index"
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ProviderName,
} from "./types"

export interface CompleteJsonOptions<T> {
  schema: z.ZodType<T>
  /** 단일 프로바이더 강제. 미지정 시 폴백 체인 사용. */
  provider?: AIProvider | ProviderName
  /** 폴백 순서. provider 지정 시 무시. */
  fallbackOrder?: ProviderName[]
}

export interface CompleteJsonResult<T> {
  data: T
  raw: CompletionResponse
}

const STRICT_REMINDER =
  "이전 응답이 지정된 JSON 스키마를 충족하지 못했습니다. " +
  "이번에는 반드시 단일 JSON 객체만, 추가 설명 없이, 코드 블록 없이 반환하세요. " +
  "필드명/타입을 정확히 지켜야 합니다."

/**
 * 표준 보완 요청을 실행하고 응답을 zod 스키마로 검증된 JSON으로 반환.
 * 첫 시도 실패 시 stricter 프롬프트로 1회 재시도.
 */
export async function completeJSON<T>(
  req: CompletionRequest,
  options: CompleteJsonOptions<T>
): Promise<CompleteJsonResult<T>> {
  const runOnce = async (request: CompletionRequest) => {
    if (options.provider) {
      const provider =
        typeof options.provider === "string"
          ? getProvider(options.provider)
          : options.provider
      return provider.complete(request)
    }
    return completeWithFallback(request, options.fallbackOrder)
  }

  // 1차 시도
  const first = await runOnce(req)
  const firstParsed = tryParse(first.text, options.schema)
  if (firstParsed.ok) {
    return { data: firstParsed.value, raw: first }
  }

  // 2차 — stricter prompt
  const strictReq: CompletionRequest = {
    ...req,
    system: [req.system, STRICT_REMINDER].filter(Boolean).join("\n\n"),
    messages: [
      ...req.messages,
      { role: "assistant", content: first.text },
      {
        role: "user",
        content:
          "위 응답을 JSON 스키마에 맞게 다시 출력하세요. 반드시 JSON만, 다른 텍스트 없이.",
      },
    ],
  }

  const second = await runOnce(strictReq)
  const secondParsed = tryParse(second.text, options.schema)
  if (secondParsed.ok) {
    return { data: secondParsed.value, raw: second }
  }

  throw new Error(
    `LLM JSON validation failed after retry: ${secondParsed.error}`
  )
}

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

function tryParse<T>(text: string, schema: z.ZodType<T>): ParseResult<T> {
  const candidate = extractJsonText(text)
  if (candidate == null) {
    return { ok: false, error: "no JSON payload found in response" }
  }
  let raw: unknown
  try {
    raw = JSON.parse(candidate)
  } catch (err) {
    return {
      ok: false,
      error: `JSON.parse failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    }
  }
  return { ok: true, value: result.data }
}

/**
 * 응답 텍스트에서 JSON 후보 문자열 추출.
 * 우선순위:
 * 1. ```json ... ``` 코드 블록
 * 2. ``` ... ``` 일반 코드 블록 (JSON 추정)
 * 3. 첫 `{` ~ 짝 맞는 `}` 또는 첫 `[` ~ 짝 맞는 `]`
 * 4. 전체 텍스트
 */
export function extractJsonText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // 1. ```json ...```
  const fenced = trimmed.match(/```json\s*\n?([\s\S]*?)\n?```/i)
  if (fenced && fenced[1]) {
    return fenced[1].trim()
  }
  // 2. ``` ...```
  const generic = trimmed.match(/```\s*\n?([\s\S]*?)\n?```/i)
  if (generic && generic[1] && /^[\s]*[{[]/.test(generic[1])) {
    return generic[1].trim()
  }
  // 3. 균형 잡힌 첫 객체/배열
  const balanced = sliceBalanced(trimmed)
  if (balanced) return balanced

  // 4. fallback
  return trimmed
}

function sliceBalanced(text: string): string | null {
  const startIdx = firstOf(text, ["{", "["])
  if (startIdx < 0) return null
  const open = text[startIdx]
  const close = open === "{" ? "}" : "]"
  let depth = 0
  let inString = false
  let escape = false
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === "\\") {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) {
        return text.slice(startIdx, i + 1)
      }
    }
  }
  return null
}

function firstOf(text: string, chars: string[]): number {
  let min = -1
  for (const c of chars) {
    const idx = text.indexOf(c)
    if (idx >= 0 && (min < 0 || idx < min)) min = idx
  }
  return min
}
