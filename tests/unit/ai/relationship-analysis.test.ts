import { describe, expect, it, vi } from "vitest"

import {
  analyzeRelationship,
  buildContext,
  hashContext,
  relationshipScoreSchema,
  type PersonContextLoader,
  type RelationshipScoreRecord,
} from "@/lib/ai/relationship-analysis"
import { extractJsonText } from "@/lib/ai/json"

// ─── buildContext ────────────────────────────────────────────────────────────

describe("buildContext", () => {
  const now = new Date("2026-05-04T12:00:00Z")

  it("최근 90일 연락만 포함하고 최신순으로 정렬한다", () => {
    const ctx = buildContext(
      {
        person: makePerson({ lastContactAt: "2026-04-04T00:00:00Z" }),
        contacts: [
          { occurredAt: "2026-04-30T00:00:00Z", channel: "kakao", direction: "outbound", memo: "최근" },
          { occurredAt: "2025-01-01T00:00:00Z", channel: "phone", direction: "inbound", memo: "오래됨" },
          { occurredAt: "2026-03-01T00:00:00Z", channel: "phone", direction: "outbound", memo: "중간" },
        ],
        events: [],
        gifts: [],
        notes: [],
      },
      now
    )
    expect(ctx.recentContacts).toHaveLength(2)
    expect(ctx.recentContacts[0]!.memo).toBe("최근")
    expect(ctx.recentContacts[1]!.memo).toBe("중간")
    expect(ctx.daysSinceLastContact).toBe(30)
  })

  it("긴 메모를 max 길이로 자른다", () => {
    const longMemo = "가".repeat(2000)
    const ctx = buildContext(
      {
        person: makePerson({ memo: longMemo }),
        contacts: [],
        events: [],
        gifts: [],
        notes: [{ body: "나".repeat(1000), createdAt: "2026-05-01T00:00:00Z" }],
      },
      now
    )
    expect(ctx.person.memo!.length).toBeLessThanOrEqual(601)
    expect(ctx.notes[0]!.body.length).toBeLessThanOrEqual(401)
  })

  it("lastContactAt이 null이면 daysSinceLastContact는 null", () => {
    const ctx = buildContext(
      {
        person: makePerson({ lastContactAt: null }),
        contacts: [],
        events: [],
        gifts: [],
        notes: [],
      },
      now
    )
    expect(ctx.daysSinceLastContact).toBeNull()
  })

  it("birthMonth/birthDay로 birthday 문자열을 만든다", () => {
    const ctx = buildContext(
      {
        person: makePerson({ birthMonth: 3, birthDay: 7, birthYear: 1990 }),
        contacts: [],
        events: [],
        gifts: [],
        notes: [],
      },
      now
    )
    expect(ctx.person.birthday).toBe("1990-03-07")
  })

  it("이벤트/선물/노트는 개수 상한이 적용된다", () => {
    const ctx = buildContext(
      {
        person: makePerson(),
        contacts: [],
        events: Array.from({ length: 30 }, (_, i) => ({
          type: "birthday",
          date: `2025-${String((i % 12) + 1).padStart(2, "0")}-01`,
          attended: true,
          amountPaid: 1000,
          memo: null,
        })),
        gifts: Array.from({ length: 30 }, (_, i) => ({
          direction: "sent" as const,
          kind: "cash" as const,
          amount: 10000,
          itemName: null,
          occurredAt: `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
          reason: "축하",
        })),
        notes: Array.from({ length: 30 }, (_, i) => ({
          body: `노트 ${i}`,
          createdAt: `2025-12-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
        })),
      },
      now
    )
    expect(ctx.events.length).toBeLessThanOrEqual(10)
    expect(ctx.gifts.length).toBeLessThanOrEqual(10)
    expect(ctx.notes.length).toBeLessThanOrEqual(5)
  })
})

// ─── hashContext ─────────────────────────────────────────────────────────────

describe("hashContext", () => {
  it("동일 컨텍스트는 동일 해시를 반환한다 (키 순서 무관)", () => {
    const a = {
      person: { name: "A", relationshipType: "friend" },
      list: [1, 2, 3],
    }
    const b = {
      list: [1, 2, 3],
      person: { relationshipType: "friend", name: "A" },
    }
    expect(hashContext(a as never)).toBe(hashContext(b as never))
  })

  it("값이 달라지면 해시가 변경된다", () => {
    const a = hashContext({ x: 1 } as never)
    const b = hashContext({ x: 2 } as never)
    expect(a).not.toBe(b)
  })
})

// ─── extractJsonText / zod 검증 ───────────────────────────────────────────────

describe("JSON 파싱", () => {
  it("```json 코드 블록을 추출한다", () => {
    const text = "여기 결과:\n```json\n{\"score\":80}\n```\n끝"
    expect(extractJsonText(text)).toBe('{"score":80}')
  })

  it("코드 블록 없는 인라인 객체도 추출한다", () => {
    const text = '결과는 {"score": 50, "msg":"hi {1}"} 입니다.'
    expect(extractJsonText(text)).toBe('{"score": 50, "msg":"hi {1}"}')
  })

  it("relationshipScoreSchema는 정상 출력에 통과", () => {
    const ok = relationshipScoreSchema.safeParse({
      score: 73,
      band: "보통",
      factors: [{ label: "x", weight: 5, evidence: "y" }],
      suggestions: [{ type: "contact", message: "안부", urgency: "med" }],
    })
    expect(ok.success).toBe(true)
  })

  it("score 범위 위반 시 zod 실패", () => {
    const bad = relationshipScoreSchema.safeParse({
      score: 150,
      band: "강",
      factors: [{ label: "x", weight: 0, evidence: "y" }],
      suggestions: [{ type: "contact", message: "x", urgency: "low" }],
    })
    expect(bad.success).toBe(false)
  })

  it("band가 enum 외 값이면 실패", () => {
    const bad = relationshipScoreSchema.safeParse({
      score: 50,
      band: "good",
      factors: [{ label: "x", weight: 0, evidence: "y" }],
      suggestions: [{ type: "contact", message: "x", urgency: "low" }],
    })
    expect(bad.success).toBe(false)
  })
})

// ─── analyzeRelationship (LLM mock) ──────────────────────────────────────────

describe("analyzeRelationship", () => {
  const personId = "00000000-0000-0000-0000-000000000001"

  function makeBundle() {
    return {
      person: makePerson({ id: personId, lastContactAt: "2026-04-04T00:00:00Z" }),
      contacts: [
        {
          occurredAt: "2026-04-30T00:00:00Z",
          channel: "kakao",
          direction: "outbound" as const,
          memo: null,
        },
      ],
      events: [],
      gifts: [],
      notes: [],
    }
  }

  it("캐시 미스 시 LLM 호출 후 saveScore", async () => {
    const saveScore = vi.fn().mockResolvedValue(undefined)
    const loader: PersonContextLoader = {
      loadPersonBundle: vi.fn().mockResolvedValue(makeBundle()),
      loadCachedScore: vi.fn().mockResolvedValue(null),
      saveScore,
    }

    const completeJSONMock = vi.fn().mockResolvedValue({
      data: {
        score: 75,
        band: "보통",
        factors: [{ label: "연락 빈도", weight: 10, evidence: "최근 1회" }],
        suggestions: [
          { type: "contact", message: "안부 한마디", urgency: "med" },
        ],
      },
      raw: {
        text: "...",
        usage: { inputTokens: 100, outputTokens: 50 },
        provider: "claude" as const,
        model: "claude-sonnet-4-6",
      },
    })

    const result = await analyzeRelationship(personId, {
      loader,
      systemPrompt: "test prompt",
      now: () => new Date("2026-05-04T00:00:00Z"),
      completeJSON: completeJSONMock as never,
    })

    expect(result.score).toBe(75)
    expect(result.band).toBe("보통")
    expect(result.provider).toBe("claude")
    expect(result.model).toBe("claude-sonnet-4-6")
    expect(result.contextHash).toMatch(/^[a-f0-9]{64}$/)
    expect(saveScore).toHaveBeenCalledTimes(1)
    expect(completeJSONMock).toHaveBeenCalledTimes(1)
  })

  it("캐시 히트 시 LLM 호출하지 않는다", async () => {
    const cached: RelationshipScoreRecord = {
      personId,
      score: 60,
      band: "보통",
      factors: [{ label: "x", weight: 0, evidence: "y" }],
      suggestions: [{ type: "contact", message: "x", urgency: "low" }],
      provider: "claude",
      model: "claude-sonnet-4-6",
      generatedAt: new Date("2026-05-04T00:00:00Z").toISOString(),
      contextHash: "WILL_BE_REPLACED",
    }
    const bundle = makeBundle()

    // 먼저 정상 hash를 계산
    const completeJSONMock = vi.fn()
    const loaderForHash: PersonContextLoader = {
      loadPersonBundle: vi.fn().mockResolvedValue(bundle),
      loadCachedScore: vi.fn().mockResolvedValue(null),
      saveScore: vi.fn().mockImplementation(async (rec) => {
        cached.contextHash = rec.contextHash
      }),
    }
    completeJSONMock.mockResolvedValue({
      data: {
        score: 60,
        band: "보통",
        factors: [{ label: "x", weight: 0, evidence: "y" }],
        suggestions: [{ type: "contact", message: "x", urgency: "low" }],
      },
      raw: {
        text: "",
        usage: { inputTokens: 0, outputTokens: 0 },
        provider: "claude",
        model: "claude-sonnet-4-6",
      },
    })
    await analyzeRelationship(personId, {
      loader: loaderForHash,
      systemPrompt: "p",
      now: () => new Date("2026-05-04T00:00:00Z"),
      completeJSON: completeJSONMock as never,
    })
    expect(cached.contextHash).toMatch(/^[a-f0-9]{64}$/)

    // 이제 동일 hash가 캐시되어 있을 때 — 두 번째 분석은 LLM을 호출하면 안 됨
    const llm2 = vi.fn()
    const loader2: PersonContextLoader = {
      loadPersonBundle: vi.fn().mockResolvedValue(bundle),
      loadCachedScore: vi.fn().mockResolvedValue(cached),
      saveScore: vi.fn(),
    }
    const r = await analyzeRelationship(personId, {
      loader: loader2,
      systemPrompt: "p",
      now: () => new Date("2026-05-04T01:00:00Z"), // 1시간 후
      completeJSON: llm2 as never,
    })
    expect(r.score).toBe(60)
    expect(llm2).not.toHaveBeenCalled()
  })

  it("person not found → 에러", async () => {
    const loader: PersonContextLoader = {
      loadPersonBundle: vi.fn().mockResolvedValue(null),
      loadCachedScore: vi.fn(),
      saveScore: vi.fn(),
    }
    await expect(
      analyzeRelationship(personId, {
        loader,
        systemPrompt: "p",
        completeJSON: vi.fn() as never,
      })
    ).rejects.toThrow(/Person not found/)
  })
})

// ─── helpers ─────────────────────────────────────────────────────────────────

function makePerson(overrides: Partial<{
  id: string
  userId: string
  name: string
  relationshipType: string
  mbti: string | null
  birthMonth: number | null
  birthDay: number | null
  birthYear: number | null
  memo: string | null
  howWeMet: string | null
  foodPreference: string | null
  lastContactAt: string | null
  createdAt: string
}> = {}) {
  return {
    id: overrides.id ?? "p1",
    userId: overrides.userId ?? "u1",
    name: overrides.name ?? "홍길동",
    relationshipType: overrides.relationshipType ?? "friend",
    mbti: overrides.mbti ?? null,
    birthMonth: overrides.birthMonth ?? null,
    birthDay: overrides.birthDay ?? null,
    birthYear: overrides.birthYear ?? null,
    memo: overrides.memo ?? null,
    howWeMet: overrides.howWeMet ?? null,
    foodPreference: overrides.foodPreference ?? null,
    lastContactAt: overrides.lastContactAt ?? null,
    createdAt: overrides.createdAt ?? "2024-01-01T00:00:00Z",
  }
}
