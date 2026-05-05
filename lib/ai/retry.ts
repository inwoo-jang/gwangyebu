/**
 * 공통 재시도/타임아웃 유틸. 어댑터가 사용한다.
 */

import { AIProviderError, type ProviderName } from "./types"

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  /** 외부 AbortSignal — 사용자 측 취소 신호 */
  signal?: AbortSignal
}

/**
 * 지수 백오프(2^n * initialDelayMs) + 풀-jitter 재시도.
 * `fn`이 throw한 에러가 `AIProviderError`이고 `retriable=false`면 즉시 throw.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const initialDelayMs = options.initialDelayMs ?? 500
  const maxDelayMs = options.maxDelayMs ?? 8_000

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (options.signal?.aborted) {
      throw new Error("AI request aborted by caller")
    }
    try {
      return await fn(attempt)
    } catch (err) {
      lastError = err
      const retriable = err instanceof AIProviderError ? err.retriable : true
      if (!retriable || attempt >= maxAttempts) {
        throw err
      }
      const exp = Math.min(maxDelayMs, initialDelayMs * 2 ** (attempt - 1))
      const delay = Math.floor(Math.random() * exp)
      await sleep(delay, options.signal)
    }
  }
  // 도달 불가 — TS 컴파일러 만족용
  throw lastError instanceof Error ? lastError : new Error("retry exhausted")
}

/**
 * 외부 신호 + 자체 타임아웃을 결합한 AbortController.
 * 호출자는 반환된 controller를 SDK에 넘기고, 끝나면 `cleanup()` 호출.
 */
export function withTimeout(
  timeoutMs: number,
  external?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new Error("timeout")), timeoutMs)
  const onExternal = () => ctrl.abort(external?.reason ?? new Error("aborted"))
  if (external) {
    if (external.aborted) {
      ctrl.abort(external.reason)
    } else {
      external.addEventListener("abort", onExternal, { once: true })
    }
  }
  return {
    signal: ctrl.signal,
    cleanup: () => {
      clearTimeout(timer)
      external?.removeEventListener("abort", onExternal)
    },
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error("aborted"))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * HTTP 상태 코드로 재시도 여부 판정.
 * - 408, 409, 429, 5xx → 재시도
 * - 그 외 → 비재시도
 */
export function isRetriableStatus(status: number | undefined): boolean {
  if (status == null) return true
  if (status === 408 || status === 409 || status === 429) return true
  if (status >= 500 && status < 600) return true
  return false
}

/**
 * 사용량 로그 (콘솔 + 구조화). 추후 ProviderUsage 테이블 적재로 대체 가능.
 */
export function logUsage(entry: {
  provider: ProviderName
  model: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  purpose?: string
}): void {
  // 구조화 JSON 1라인. 운영에서 로그 수집기가 파싱.
  const payload = {
    type: "ai_usage",
    ...entry,
    at: new Date().toISOString(),
  }
  // eslint-disable-next-line no-console
  console.info(JSON.stringify(payload))
}
