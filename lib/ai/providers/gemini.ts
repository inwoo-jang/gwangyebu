/**
 * Google Gemini 어댑터.
 * - SDK는 이 파일에서만 import한다.
 * - system은 `systemInstruction`으로 매핑.
 * - 30초 타임아웃 + 429/5xx 지수 백오프 재시도(최대 3회).
 */

import {
  GoogleGenerativeAI,
  type GenerateContentResult,
  type GenerativeModel,
} from "@google/generative-ai"

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

const DEFAULT_MODEL = "gemini-2.5-pro"
const DEFAULT_MAX_TOKENS = 1024
const DEFAULT_TIMEOUT_MS = 30_000

/**
 * 우리가 어댑터에서 직접 호출하는 SDK 표면만 추상화한 인터페이스.
 * - 테스트에서 mock을 주입할 수 있도록 하기 위함.
 */
export interface GeminiClient {
  getGenerativeModel(params: {
    model: string
    systemInstruction?: string
  }): Pick<GenerativeModel, "generateContent">
}

export interface GeminiProviderOptions {
  apiKey?: string
  model?: string
  client?: GeminiClient
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini" as const
  private readonly model: string
  private readonly client: GeminiClient

  constructor(options: GeminiProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? ""
    this.model = options.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL
    this.client = options.client ?? new GoogleGenerativeAI(apiKey)
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: req.system,
    })

    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map(toGeminiContent)

    const start = Date.now()
    const result = await withRetry<GenerateContentResult>(
      async () => {
        const { signal, cleanup } = withTimeout(
          DEFAULT_TIMEOUT_MS,
          req.signal
        )
        try {
          return await model.generateContent(
            {
              contents,
              generationConfig: {
                maxOutputTokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
                temperature: req.temperature,
              },
            },
            { signal }
          )
        } catch (err) {
          throw normalizeGeminiError(err)
        } finally {
          cleanup()
        }
      },
      { signal: req.signal }
    )

    const text = result.response.text().trim()
    const meta = result.response.usageMetadata
    const usage = {
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
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

function toGeminiContent(m: ChatMessage): {
  role: "user" | "model"
  parts: Array<{ text: string }>
} {
  const role: "user" | "model" = m.role === "assistant" ? "model" : "user"
  return { role, parts: [{ text: m.content }] }
}

function normalizeGeminiError(err: unknown): AIProviderError {
  // GoogleGenerativeAIFetchError에는 status, statusText 포함
  type ErrLike = {
    status?: number
    statusText?: string
    message?: string
    name?: string
  }
  const e = err as ErrLike
  const status = typeof e?.status === "number" ? e.status : undefined
  const msg = e?.message ?? "Gemini request failed"
  const name = e?.name ?? ""
  if (
    name === "AbortError" ||
    name === "GoogleGenerativeAIAbortError" ||
    /abort/i.test(msg)
  ) {
    return new AIProviderError("gemini", msg, {
      status,
      retriable: false,
      cause: err,
    })
  }
  return new AIProviderError("gemini", msg, {
    status,
    retriable: isRetriableStatus(status),
    cause: err,
  })
}
