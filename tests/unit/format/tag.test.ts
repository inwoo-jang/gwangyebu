import { describe, expect, it } from "vitest"
import { colorIndexForTag } from "@/lib/format/tag"

describe("colorIndexForTag", () => {
  it("동일한 입력은 동일한 colorIndex (deterministic)", () => {
    const a = colorIndexForTag({ id: "tag-1", name: "친구" })
    const b = colorIndexForTag({ id: "tag-1", name: "친구" })
    expect(a).toBe(b)
  })

  it("colorIndex는 1~8 범위", () => {
    for (const name of ["친구", "회사", "가족", "지인", "스타트업", "동아리", "👨", "abcde"]) {
      const idx = colorIndexForTag({ name })
      expect(idx).toBeGreaterThanOrEqual(1)
      expect(idx).toBeLessThanOrEqual(8)
    }
  })

  it("id가 없으면 name 기반 해시", () => {
    const a = colorIndexForTag({ name: "친구" })
    const b = colorIndexForTag({ name: "친구" })
    expect(a).toBe(b)
  })

  it("id가 있으면 name과 무관하게 id 기반", () => {
    const a = colorIndexForTag({ id: "abc", name: "X" })
    const b = colorIndexForTag({ id: "abc", name: "Y" })
    expect(a).toBe(b)
  })

  it("이름이 다르면 일반적으로 다른 인덱스 (전수 충돌 X)", () => {
    const idxs = new Set(
      ["친구", "회사", "가족", "지인", "스타트업", "동아리", "스승"].map((n) =>
        colorIndexForTag({ name: n }),
      ),
    )
    // 8개 버킷 중 최소 3종 이상 분포
    expect(idxs.size).toBeGreaterThanOrEqual(3)
  })
})
