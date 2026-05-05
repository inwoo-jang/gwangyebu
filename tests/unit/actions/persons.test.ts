/**
 * 서버 액션 `lib/actions/persons.ts` 단위 테스트.
 * - zod 검증 분기
 * - requireUser mock으로 인증/미인증 분기
 * - supabase 빌더 mock
 *
 * 주의: persons.ts는 `"use server"` 지시어를 가지지만 vitest jsdom 환경에서
 * 일반 함수로 import 가능하다 (Next 빌드 메타만 추가됨).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type AnyMock = ReturnType<typeof vi.fn>

function createChain(result: { data: unknown; error: unknown }) {
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
  const terminals = ["maybeSingle", "single"]
  const chain: Record<string, AnyMock> = {}
  for (const m of linkMethods) {
    chain[m] = vi.fn(() => chain)
  }
  for (const m of terminals) {
    chain[m] = vi.fn(async () => result)
  }
  chain.then = vi.fn(
    (resolve: (v: { data: unknown; error: unknown }) => unknown) => {
      return Promise.resolve(result).then(resolve)
    },
  )
  return chain
}

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("createPerson", () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("이름 미입력 → validation 실패", async () => {
    vi.doMock("@/lib/actions/auth-guard", () => ({
      requireUser: vi.fn(async () => ({
        ok: false,
        error: { ok: false, error: { code: "unauthorized", message: "x" } },
      })),
    }))
    const { createPerson } = await import("@/lib/actions/persons")
    const res = await createPerson({})
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe("validation")
      expect(res.error.fields?.name).toBeTruthy()
    }
  })

  it("MBTI 형식이 잘못되면 validation 실패", async () => {
    const { createPerson } = await import("@/lib/actions/persons")
    const res = await createPerson({ name: "X", mbti: "ABCD" })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe("validation")
    }
  })

  it("미인증 → unauthorized", async () => {
    vi.doMock("@/lib/actions/auth-guard", () => ({
      requireUser: vi.fn(async () => ({
        ok: false,
        error: { ok: false, error: { code: "unauthorized", message: "로그인이 필요합니다" } },
      })),
    }))
    const { createPerson } = await import("@/lib/actions/persons")
    const res = await createPerson({ name: "홍길동" })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe("unauthorized")
    }
  })

  it("정상 입력 → ok + Person 반환", async () => {
    const personRow = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "홍길동",
      relationship_type: "etc",
    }
    const personsChain = createChain({ data: personRow, error: null })
    const supabase = {
      from: vi.fn(() => personsChain),
    }
    vi.doMock("@/lib/actions/auth-guard", () => ({
      requireUser: vi.fn(async () => ({
        ok: true,
        userId: "user-1",
        supabase,
      })),
    }))
    const { createPerson } = await import("@/lib/actions/persons")
    const res = await createPerson({ name: "홍길동" })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.name).toBe("홍길동")
    }
    expect(personsChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "홍길동", user_id: "user-1" }),
    )
  })

  it("이름이 50자 초과면 validation 실패", async () => {
    const { createPerson } = await import("@/lib/actions/persons")
    const res = await createPerson({ name: "가".repeat(51) })
    expect(res.ok).toBe(false)
  })

  it("tag_ids 11개 이상은 validation 실패", async () => {
    const { createPerson } = await import("@/lib/actions/persons")
    const tooManyTags = Array.from(
      { length: 11 },
      (_, i) =>
        `${"0".repeat(8)}-0000-4000-8000-${i.toString().padStart(12, "0")}`,
    )
    const res = await createPerson({ name: "X", tag_ids: tooManyTags })
    expect(res.ok).toBe(false)
  })
})

describe("deletePerson", () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("잘못된 UUID → validation 실패", async () => {
    const { deletePerson } = await import("@/lib/actions/persons")
    const res = await deletePerson({ id: "not-a-uuid" })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe("validation")
  })

  it("정상 호출 시 deleted_at 세팅 + status=inactive로 update 호출", async () => {
    const personRow = { id: "11111111-1111-4111-8111-111111111111" }
    const chain = createChain({ data: personRow, error: null })
    const supabase = { from: vi.fn(() => chain) }
    vi.doMock("@/lib/actions/auth-guard", () => ({
      requireUser: vi.fn(async () => ({
        ok: true,
        userId: "u1",
        supabase,
      })),
    }))
    const { deletePerson } = await import("@/lib/actions/persons")
    const res = await deletePerson({
      id: "11111111-1111-4111-8111-111111111111",
    })
    expect(res.ok).toBe(true)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "inactive",
        deleted_at: expect.any(String),
      }),
    )
  })
})

describe("listPersons — zod 기본값", () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("limit/offset 기본값이 적용된다 (50/0)", async () => {
    const chain = createChain({ data: [], error: null })
    const supabase = { from: vi.fn(() => chain) }
    vi.doMock("@/lib/actions/auth-guard", () => ({
      requireUser: vi.fn(async () => ({
        ok: true,
        userId: "u1",
        supabase,
      })),
    }))
    const { listPersons } = await import("@/lib/actions/persons")
    const res = await listPersons({})
    expect(res.ok).toBe(true)
    expect(chain.range).toHaveBeenCalledWith(0, 49)
  })

  it("limit > 100은 validation 실패", async () => {
    const { listPersons } = await import("@/lib/actions/persons")
    const res = await listPersons({ limit: 200 })
    expect(res.ok).toBe(false)
  })
})
