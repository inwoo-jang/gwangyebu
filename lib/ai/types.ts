/**
 * AI 프로바이더 추상화 — 공통 타입.
 *
 * 외부 코드(API 라우트, 도메인 로직)는 이 파일의 타입만 사용한다.
 * 어떤 SDK(@anthropic-ai/sdk, @google/generative-ai 등)에도 직접 의존하지 않는다.
 */

import type { z } from "zod"

export type Role = "system" | "user" | "assistant"

export interface ChatMessage {
  role: Role
  content: string
}

/**
 * 표준 보완(completion) 요청.
 * - `system`은 별도 파라미터로 전달한다 (Anthropic system, Gemini systemInstruction 매핑).
 * - `responseSchema`가 주어지면 출력 파서가 zod 검증에 사용한다 (어댑터에서는 단순히 텍스트 반환).
 * - `signal`을 통해 외부에서 취소 가능, 미지정 시 어댑터가 30초 타임아웃 적용.
 */
export interface CompletionRequest {
  messages: ChatMessage[]
  system?: string
  maxTokens?: number
  temperature?: number
  responseSchema?: z.ZodTypeAny
  signal?: AbortSignal
}

export interface CompletionUsage {
  inputTokens: number
  outputTokens: number
}

export interface CompletionResponse {
  text: string
  usage: CompletionUsage
  provider: ProviderName
  model: string
}

export type ProviderName = "claude" | "gemini"

export interface AIProvider {
  name: ProviderName
  complete(req: CompletionRequest): Promise<CompletionResponse>
}

/**
 * 프로바이더에 무관한 호출 에러. 어댑터가 SDK 에러를 이 타입으로 정규화한다.
 */
export class AIProviderError extends Error {
  readonly provider: ProviderName
  readonly status?: number
  readonly retriable: boolean
  readonly cause?: unknown

  constructor(
    provider: ProviderName,
    message: string,
    options: { status?: number; retriable?: boolean; cause?: unknown } = {}
  ) {
    super(`[${provider}] ${message}`)
    this.name = "AIProviderError"
    this.provider = provider
    this.status = options.status
    this.retriable = options.retriable ?? false
    this.cause = options.cause
  }
}
