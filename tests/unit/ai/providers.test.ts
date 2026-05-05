import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ClaudeProvider } from "@/lib/ai/providers/claude"
import { GeminiProvider } from "@/lib/ai/providers/gemini"

describe("ClaudeProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("표준 인터페이스로 텍스트와 사용량을 반환한다", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "msg_1",
      type: "message",
      role: "assistant",
      model: "claude-sonnet-4-6",
      content: [
        { type: "text", text: "안녕하세요" },
        { type: "text", text: "두 번째 블록" },
      ],
      stop_reason: "end_turn",
      usage: { input_tokens: 12, output_tokens: 7 },
    })
    const provider = new ClaudeProvider({
      apiKey: "test",
      model: "claude-sonnet-4-6",
      client: { messages: { create } as never },
    })

    const res = await provider.complete({
      system: "you are helpful",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 256,
      temperature: 0.5,
    })

    expect(res.text).toBe("안녕하세요\n두 번째 블록")
    expect(res.usage).toEqual({ inputTokens: 12, outputTokens: 7 })
    expect(res.provider).toBe("claude")
    expect(res.model).toBe("claude-sonnet-4-6")

    expect(create).toHaveBeenCalledTimes(1)
    const [body, opts] = create.mock.calls[0]!
    expect(body.model).toBe("claude-sonnet-4-6")
    expect(body.max_tokens).toBe(256)
    expect(body.temperature).toBe(0.5)
    expect(body.messages).toEqual([{ role: "user", content: "hi" }])
    // system은 별도 파라미터 + cache_control
    expect(body.system).toEqual([
      {
        type: "text",
        text: "you are helpful",
        cache_control: { type: "ephemeral" },
      },
    ])
    // signal은 옵션으로 전달
    expect(opts).toBeDefined()
    expect(opts.signal).toBeDefined()
  })

  it("429 에러는 재시도 후 성공한다", async () => {
    const tooMany = Object.assign(new Error("rate limit"), {
      status: 429,
      name: "APIError",
    })
    const create = vi
      .fn()
      .mockRejectedValueOnce(tooMany)
      .mockRejectedValueOnce(tooMany)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "ok" }],
        usage: { input_tokens: 1, output_tokens: 1 },
      })
    const provider = new ClaudeProvider({
      apiKey: "x",
      client: { messages: { create } as never },
    })
    const res = await provider.complete({
      messages: [{ role: "user", content: "hi" }],
    })
    expect(res.text).toBe("ok")
    expect(create).toHaveBeenCalledTimes(3)
  })

  it("4xx(비재시도)는 즉시 실패한다", async () => {
    const badReq = Object.assign(new Error("bad input"), {
      status: 400,
      name: "APIError",
    })
    const create = vi.fn().mockRejectedValue(badReq)
    const provider = new ClaudeProvider({
      apiKey: "x",
      client: { messages: { create } as never },
    })
    await expect(
      provider.complete({ messages: [{ role: "user", content: "hi" }] })
    ).rejects.toThrow(/bad input/)
    expect(create).toHaveBeenCalledTimes(1)
  })
})

describe("GeminiProvider", () => {
  it("표준 인터페이스로 텍스트와 사용량을 반환한다", async () => {
    const generateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => "Gemini 응답",
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 3,
          totalTokenCount: 8,
        },
      },
    })
    const getGenerativeModel = vi
      .fn()
      .mockReturnValue({ generateContent })

    const provider = new GeminiProvider({
      apiKey: "test",
      model: "gemini-2.5-pro",
      client: { getGenerativeModel } as never,
    })

    const res = await provider.complete({
      system: "system instruction",
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
        { role: "user", content: "again" },
      ],
      maxTokens: 128,
      temperature: 0.2,
    })

    expect(res.text).toBe("Gemini 응답")
    expect(res.usage).toEqual({ inputTokens: 5, outputTokens: 3 })
    expect(res.provider).toBe("gemini")
    expect(res.model).toBe("gemini-2.5-pro")

    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-2.5-pro",
      systemInstruction: "system instruction",
    })

    const [body] = generateContent.mock.calls[0]!
    expect(body.contents).toEqual([
      { role: "user", parts: [{ text: "hi" }] },
      { role: "model", parts: [{ text: "hello" }] },
      { role: "user", parts: [{ text: "again" }] },
    ])
    expect(body.generationConfig).toEqual({
      maxOutputTokens: 128,
      temperature: 0.2,
    })
  })

  it("503은 재시도 후 성공한다", async () => {
    const fail = Object.assign(new Error("service unavailable"), { status: 503 })
    const generateContent = vi
      .fn()
      .mockRejectedValueOnce(fail)
      .mockResolvedValueOnce({
        response: {
          text: () => "ok",
          usageMetadata: {
            promptTokenCount: 1,
            candidatesTokenCount: 1,
            totalTokenCount: 2,
          },
        },
      })
    const provider = new GeminiProvider({
      apiKey: "x",
      client: {
        getGenerativeModel: vi.fn().mockReturnValue({ generateContent }),
      } as never,
    })
    const res = await provider.complete({
      messages: [{ role: "user", content: "hi" }],
    })
    expect(res.text).toBe("ok")
    expect(generateContent).toHaveBeenCalledTimes(2)
  })
})
