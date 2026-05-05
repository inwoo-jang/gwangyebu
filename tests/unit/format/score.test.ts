import { describe, expect, it } from "vitest"
import { bandFor, urgencyToneClass, urgencyLabel } from "@/lib/format/score"

describe("bandFor — 점수 → 밴드/라벨/색", () => {
  it("null/undefined는 '미산출'", () => {
    expect(bandFor(null).label).toBe("미산출")
    expect(bandFor(undefined).band).toBe("보통")
  })

  it("90 이상은 '매우 좋음' (강 밴드)", () => {
    const info = bandFor(95)
    expect(info.band).toBe("강")
    expect(info.label).toBe("매우 좋음")
    expect(info.toneClass).toContain("success")
    expect(info.ringClass).toContain("success")
  })

  it("70~89는 '양호' (강 밴드)", () => {
    const info = bandFor(70)
    expect(info.band).toBe("강")
    expect(info.label).toBe("양호")
  })

  it("40~69는 '보통' (warning)", () => {
    const info = bandFor(50)
    expect(info.band).toBe("보통")
    expect(info.toneClass).toContain("warning")
  })

  it("20~39는 '주의' (destructive)", () => {
    const info = bandFor(30)
    expect(info.band).toBe("주의")
    expect(info.toneClass).toContain("destructive")
  })

  it("20 미만은 '위험' (destructive 강조)", () => {
    const info = bandFor(5)
    expect(info.band).toBe("위험")
    expect(info.toneClass).toContain("destructive")
    expect(info.bgClass).toBe("bg-destructive/15")
  })

  it("경계값 70은 '강' (gte 70)", () => {
    expect(bandFor(70).band).toBe("강")
  })

  it("경계값 40은 '보통'", () => {
    expect(bandFor(40).band).toBe("보통")
  })

  it("경계값 20은 '주의'", () => {
    expect(bandFor(20).band).toBe("주의")
  })

  it("경계값 0은 '위험'", () => {
    expect(bandFor(0).band).toBe("위험")
  })
})

describe("urgencyToneClass / urgencyLabel", () => {
  it("high → 긴급", () => {
    expect(urgencyLabel("high")).toBe("긴급")
    expect(urgencyToneClass("high")).toContain("destructive")
  })
  it("med → 보통", () => {
    expect(urgencyLabel("med")).toBe("보통")
    expect(urgencyToneClass("med")).toContain("warning")
  })
  it("low → 여유", () => {
    expect(urgencyLabel("low")).toBe("여유")
    expect(urgencyToneClass("low")).toContain("muted")
  })
})
