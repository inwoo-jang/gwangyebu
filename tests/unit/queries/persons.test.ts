/**
 * `lib/queries/persons.ts` 단위 테스트.
 *
 * Supabase 클라이언트는 chainable mock으로 대체 — 쿼리 빌더가 호출하는
 * select/eq/in/or/range/order/is/maybeSingle 가 모두 호출 가능해야 한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// 참고: `import "server-only"`는 vitest.config.ts의 alias로 stub 처리됨.

type AnyMock = ReturnType<typeof vi.fn>

interface ChainSpec {
  result?: { data: unknown; error: unknown }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows?: any
}

function createChain(spec: ChainSpec = {}) {
  const result = spec.result ?? {
    data: spec.rows ?? null,
    error: null,
  }
  // 모든 빌더 메서드는 자기 자신 반환, terminal(then/maybeSingle/single)에서 result 반환.
  const chain: Record<string, AnyMock> = {}
  const terminals = ["maybeSingle", "single"]
  const linkMethods = [
    "select",
    "eq",
    "in",
    "or",
    "is",
    "order",
    "range",
    "limit",
    "update",
    "delete",
    "insert",
    "gte",
    "lte",
  ]
  for (const m of linkMethods) {
    chain[m] = vi.fn(() => proxy)
  }
  for (const m of terminals) {
    chain[m] = vi.fn(async () => result)
  }
  // thenable — `await query` 형태로 final fetch 가능
  chain.then = vi.fn(
    (resolve: (v: { data: unknown; error: unknown }) => unknown) => {
      return Promise.resolve(result).then(resolve)
    },
  )
  const proxy: typeof chain = chain
  return chain
}

describe("fetchPersonsForList — 쿼리 빌더 호출 스모크", () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("미인증이면 빈 배열", async () => {
    const supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
      from: vi.fn(() => createChain()),
    }
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase,
    }))
    const { fetchPersonsForList } = await import("@/lib/queries/persons")
    const out = await fetchPersonsForList({})
    expect(out).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("query 옵션 → ilike or 절을 사용", async () => {
    const personsChain = createChain({
      rows: [
        {
          id: "p1",
          user_id: "u1",
          name: "김지수",
          relationship_type: "friend",
          last_contact_at: null,
          status: "active",
        },
      ],
    })
    const tagsChain = createChain({ rows: [] })
    const scoresChain = createChain({ rows: [] })
    const logsChain = createChain({ rows: [] })

    let call = 0
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
      },
      from: vi.fn((table: string) => {
        if (table === "persons") return personsChain
        if (table === "person_tags") return tagsChain
        if (table === "relationship_scores") return scoresChain
        if (table === "contacts_log") return logsChain
        return createChain()
      }),
      _call: () => call++,
    }
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase,
    }))
    const { fetchPersonsForList } = await import("@/lib/queries/persons")
    const out = await fetchPersonsForList({ query: "김" })

    expect(supabase.from).toHaveBeenCalledWith("persons")
    expect(personsChain.or).toHaveBeenCalled()
    const orArg = personsChain.or.mock.calls[0]?.[0] as string
    expect(orArg).toContain("name.ilike")
    expect(orArg).toContain("김")

    expect(out).toHaveLength(1)
    expect(out[0]?.name).toBe("김지수")
    expect(out[0]?.tags).toEqual([])
    expect(out[0]?.score).toBeNull()
  })

  it("relationship_types 필터 → in 절 사용", async () => {
    const personsChain = createChain({ rows: [] })
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
      },
      from: vi.fn(() => personsChain),
    }
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase,
    }))
    const { fetchPersonsForList } = await import("@/lib/queries/persons")
    await fetchPersonsForList({ relationship_types: ["friend", "family"] })
    expect(personsChain.in).toHaveBeenCalledWith(
      "relationship_type",
      ["friend", "family"],
    )
  })

  it("limit/offset → range 호출", async () => {
    const personsChain = createChain({ rows: [] })
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
      },
      from: vi.fn(() => personsChain),
    }
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => supabase,
    }))
    const { fetchPersonsForList } = await import("@/lib/queries/persons")
    await fetchPersonsForList({ limit: 20, offset: 40 })
    expect(personsChain.range).toHaveBeenCalledWith(40, 59)
  })
})
