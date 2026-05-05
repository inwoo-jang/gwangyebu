---
name: ai-provider-abstraction
description: Claude(Anthropic), Gemini(Google) 등 멀티 LLM을 동일 인터페이스로 호출하는 어댑터 레이어를 구현한다. 폴백, 타임아웃, 재시도, 비용 로깅 포함. "AI 프로바이더", "LLM 추상화", "Claude Gemini" 요청에 사용.
---

# AI 프로바이더 추상화 스킬

## 디렉토리

```
lib/ai/
├── types.ts             # 공통 타입
├── index.ts             # getProvider() 팩토리
└── providers/
    ├── claude.ts        # Anthropic 어댑터
    └── gemini.ts        # Google 어댑터
```

## 공통 인터페이스

```ts
// lib/ai/types.ts
export type Role = "system" | "user" | "assistant"
export interface ChatMessage { role: Role; content: string }

export interface CompletionRequest {
  messages: ChatMessage[]
  system?: string
  maxTokens?: number
  temperature?: number
  jsonSchema?: object       // 구조화 출력 요청 시
}

export interface CompletionResponse {
  text: string
  usage: { inputTokens: number; outputTokens: number }
  provider: string
  model: string
}

export interface AIProvider {
  name: string
  complete(req: CompletionRequest): Promise<CompletionResponse>
}
```

## 팩토리

```ts
// lib/ai/index.ts
import { ClaudeProvider } from "./providers/claude"
import { GeminiProvider } from "./providers/gemini"

export function getProvider(name?: string): AIProvider {
  const provider = name ?? process.env.AI_DEFAULT_PROVIDER ?? "claude"
  switch (provider) {
    case "claude": return new ClaudeProvider()
    case "gemini": return new GeminiProvider()
    default: throw new Error(`Unknown AI provider: ${provider}`)
  }
}

export async function completeWithFallback(
  req: CompletionRequest,
  order: string[] = ["claude", "gemini"]
): Promise<CompletionResponse> {
  let lastErr: unknown
  for (const name of order) {
    try {
      return await getProvider(name).complete(req)
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}
```

## 어댑터 규칙

- SDK는 어댑터 내부에서만 import (외부 코드는 `AIProvider` 타입만 사용)
- 모든 호출에 `AbortController` 타임아웃 (기본 30s)
- 429/5xx는 지수 백오프로 재시도 (최대 3회)
- 사용량 로깅 (프로바이더, 모델, 입출력 토큰)
- API 키는 서버에서만 (`process.env`), 클라이언트 번들 노출 금지
- Anthropic은 `system` 별도 파라미터, Gemini는 `systemInstruction`
- 모델명은 ENV에서 (`ANTHROPIC_MODEL`, `GEMINI_MODEL`)

## 모델 (2026 기준 권장)

- Claude: `claude-sonnet-4-6` 또는 `claude-opus-4-7`
- Gemini: `gemini-2.5-pro` 또는 `gemini-2.5-flash`
