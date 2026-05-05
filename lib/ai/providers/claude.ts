/**
 * Anthropic Claude 어댑터.
 * - SDK는 이 파일에서만 import한다.
 * - system은 별도 파라미터로 전달하고 prompt caching(`cache_control: ephemeral`)을 부여.
 * - 30초 타임아웃 + 429/5xx 지수 백오프 재시도(최대 3회).
 */

import Anthropic from "@anthropic-ai/sdk"

import {
  AIProviderError,
  type AIProvider,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResponse,
} from "../types"
import {
  isRetriableStatus,
  logUsage,
  withRetry,
  withTimeout,
} from "../retry"

const DEFAULT_MODEL = "claude-sonnet-4-6"
const DEFAULT_MAX_TOKENS = 1024
const DEFAULT_TIMEOUT_MS = 30_000

export interface ClaudeProviderOptions {
  apiKey?: string
  model?: string
  /** 테스트용 SDK 주입. */
  client?: Pick<Anthropic, "messages">
}

export class ClaudeProvider implements AIProvider {
  readonly name = "claude" as const
  private readonly model: string
  private readonly client: Pick<Anthropic, "messages">

  constructor(options: ClaudeProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? ""
    this.model = options.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL
    this.client =
      options.client ??
      new Anthropic({
        apiKey,
        // SDK 자체 재시도는 비활성화(우리가 retry 유틸로 제어)
        maxRetries: 0,
      })
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map(toAnthropicMessage)

    // system 별도 파라미터, 캐시 제어 부여
    const system = req.system
      ? [
          {
            type: "text" as const,
            text: req.system,
            cache_control: { type: "ephemeral" as const },
          },
        ]
      : undefined

    const start = Date.now()
    const result = await withRetry(
      async () => {
        const { signal, cleanup } = withTimeout(
          DEFAULT_TIMEOUT_MS,
          req.signal
        )
        try {
          const response = await this.client.messages.create(
            {
              model: this.model,
              max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
              temperature: req.temperature,
              system,
              messages,
            },
            { signal }
          )
          return response
        } catch (err) {
          throw normalizeAnthropicError(err)
        } finally {
          cleanup()
        }
      },
      { signal: req.signal }
    )

    const text = extractText(result)
    const usage = {
      inputTokens: result.usage?.input_tokens ?? 0,
      outputTokens: result.usage?.output_tokens ?? 0,
    }

    logUsage({
      provider: this.name,
      model: this.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      durationMs: Date.now() - start,
    })

    return {
      text,
      usage,
      provider: this.name,
      model: this.model,
    }
  }
}

function toAnthropicMessage(m: ChatMessage): {
  role: "user" | "assistant"
  content: string
} {
  if (m.role === "user" || m.role === "assistant") {
    return { role: m.role, content: m.content }
  }
  // system은 호출자가 제거함. 여기 도달 시 안전하게 user로 강등.
  return { role: "user", content: m.content }
}

function extractText(message: Anthropic.Messages.Message): string {
  const parts = message.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
  return parts.join("\n").trim()
}

function normalizeAnthropicError(err: unknown): AIProviderError {
  // SDK의 APIError는 status를 가짐
  type ErrLike = { status?: number; message?: string; name?: string }
  const e = err as ErrLike
  const status = typeof e?.status === "number" ? e.status : undefined
  const msg = e?.message ?? "Anthropic request failed"
  const name = e?.name ?? ""
  // AbortError는 외부 취소 — 재시도하지 않음
  if (name === "AbortError" || /abort/i.test(msg)) {
    return new AIProviderError("claude", msg, { status, retriable: false, cause: err })
  }
  return new AIProviderError("claude", msg, {
    status,
    retriable: isRetriableStatus(status),
    cause: err,
  })
}
