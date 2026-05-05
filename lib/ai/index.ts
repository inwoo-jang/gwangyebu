/**
 * AI 프로바이더 팩토리 + 폴백 헬퍼.
 *
 * - `getProvider(name?)` — ENV 기본값(`AI_DEFAULT_PROVIDER`) 또는 파라미터로 프로바이더 선택.
 * - `completeWithFallback(req, order?)` — 우선순위 순서대로 프로바이더를 시도하고 첫 성공을 반환.
 */

import { ClaudeProvider } from "./providers/claude"
import { GeminiProvider } from "./providers/gemini"
import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ProviderName,
} from "./types"

export type { AIProvider, ChatMessage, CompletionRequest, CompletionResponse, CompletionUsage, ProviderName, Role } from "./types"
export { AIProviderError } from "./types"

const SUPPORTED: ProviderName[] = ["claude", "gemini"]

function resolveDefault(): ProviderName {
  const raw = (process.env.AI_DEFAULT_PROVIDER ?? "claude").toLowerCase()
  // 과거 표기 호환 ("anthropic" → "claude", "google" → "gemini")
  const normalized: string =
    raw === "anthropic" ? "claude" : raw === "google" ? "gemini" : raw
  if ((SUPPORTED as string[]).includes(normalized)) {
    return normalized as ProviderName
  }
  return "claude"
}

export function getProvider(name?: ProviderName): AIProvider {
  const target = name ?? resolveDefault()
  switch (target) {
    case "claude":
      return new ClaudeProvider()
    case "gemini":
      return new GeminiProvider()
    default: {
      const exhaustive: never = target
      throw new Error(`Unsupported AI provider: ${String(exhaustive)}`)
    }
  }
}

/**
 * 폴백 호출.
 * - `order`의 순서로 프로바이더를 시도, 첫 성공 응답 반환.
 * - 모든 프로바이더 실패 시 마지막 에러 throw.
 */
export async function completeWithFallback(
  req: CompletionRequest,
  order?: ProviderName[]
): Promise<CompletionResponse> {
  const sequence: ProviderName[] =
    order && order.length > 0 ? order : [resolveDefault(), ...SUPPORTED.filter((p) => p !== resolveDefault())]

  let lastError: unknown
  for (const name of dedupe(sequence)) {
    try {
      const provider = getProvider(name)
      return await provider.complete(req)
    } catch (err) {
      lastError = err
      // 콘솔 경고 — 폴백 진행
      // eslint-disable-next-line no-console
      console.warn(
        JSON.stringify({
          type: "ai_fallback",
          failedProvider: name,
          message: err instanceof Error ? err.message : String(err),
          at: new Date().toISOString(),
        })
      )
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("All AI providers failed")
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
