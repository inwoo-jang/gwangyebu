import { describe, expect, it } from "vitest"
import {
  RELATIONSHIP_TYPE_LABEL,
  RELATIONSHIP_TYPE_OPTIONS,
  CONTACT_CHANNEL_LABEL,
  CONTACT_CHANNEL_OPTIONS,
  CONTACT_DIRECTION_LABEL,
  REMINDER_TYPE_LABEL,
  MBTI_OPTIONS,
} from "@/lib/format/relationship"

describe("RELATIONSHIP_TYPE_LABEL", () => {
  it("6개 enum 모두 한국어 라벨 + colorIndex 보유", () => {
    const types = ["family", "friend", "colleague", "client", "acquaintance", "etc"] as const
    for (const t of types) {
      const v = RELATIONSHIP_TYPE_LABEL[t]
      expect(v.label).toBeTruthy()
      expect(v.colorIndex).toBeGreaterThanOrEqual(1)
      expect(v.colorIndex).toBeLessThanOrEqual(8)
    }
  })

  it("family는 '가족'", () => {
    expect(RELATIONSHIP_TYPE_LABEL.family.label).toBe("가족")
  })

  it("friend는 '친구'", () => {
    expect(RELATIONSHIP_TYPE_LABEL.friend.label).toBe("친구")
  })

  it("RELATIONSHIP_TYPE_OPTIONS는 6개", () => {
    expect(RELATIONSHIP_TYPE_OPTIONS).toHaveLength(6)
  })
})

describe("CONTACT_CHANNEL_LABEL", () => {
  it("6개 채널 모두 한국어 라벨 + 아이콘", () => {
    const channels = ["phone", "kakao", "sms", "email", "inperson", "other"] as const
    for (const c of channels) {
      const v = CONTACT_CHANNEL_LABEL[c]
      expect(v.label).toBeTruthy()
      expect(v.icon).toBeTruthy()
    }
  })

  it("kakao는 '카톡'", () => {
    expect(CONTACT_CHANNEL_LABEL.kakao.label).toBe("카톡")
  })

  it("CONTACT_CHANNEL_OPTIONS는 6개", () => {
    expect(CONTACT_CHANNEL_OPTIONS).toHaveLength(6)
  })
})

describe("CONTACT_DIRECTION_LABEL", () => {
  it("outbound는 '보냄', inbound는 '받음', unknown은 빈 문자열", () => {
    expect(CONTACT_DIRECTION_LABEL.outbound).toBe("보냄")
    expect(CONTACT_DIRECTION_LABEL.inbound).toBe("받음")
    expect(CONTACT_DIRECTION_LABEL.unknown).toBe("")
  })
})

describe("REMINDER_TYPE_LABEL", () => {
  it("4개 타입 모두 한국어 라벨", () => {
    const types = ["followup", "birthday", "event", "custom"] as const
    for (const t of types) {
      expect(REMINDER_TYPE_LABEL[t].label).toBeTruthy()
    }
  })
  it("birthday는 🎂 아이콘", () => {
    expect(REMINDER_TYPE_LABEL.birthday.icon).toBe("🎂")
  })
})

describe("MBTI_OPTIONS", () => {
  it("16개", () => {
    expect(MBTI_OPTIONS).toHaveLength(16)
  })
  it("ENFP 포함", () => {
    expect(MBTI_OPTIONS).toContain("ENFP")
  })
})
