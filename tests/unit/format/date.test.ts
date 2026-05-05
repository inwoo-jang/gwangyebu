import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  toDate,
  relativeKo,
  daysAgoKo,
  fullDateKo,
  shortDateKo,
  toLocalInput,
  startOfTodayISO,
  timeKo,
} from "@/lib/format/date"

describe("format/date", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 2026-05-04 (월) 12:00 KST
    vi.setSystemTime(new Date("2026-05-04T03:00:00.000Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("toDate", () => {
    it("null/undefined/빈 문자열은 null", () => {
      expect(toDate(null)).toBeNull()
      expect(toDate(undefined)).toBeNull()
      expect(toDate("")).toBeNull()
    })
    it("Date 인스턴스는 그대로", () => {
      const d = new Date("2026-01-01")
      expect(toDate(d)?.toISOString()).toBe(d.toISOString())
    })
    it("ISO 문자열은 Date로 변환", () => {
      expect(toDate("2026-01-01T00:00:00.000Z")?.getUTCFullYear()).toBe(2026)
    })
    it("잘못된 문자열은 null", () => {
      expect(toDate("not-a-date")).toBeNull()
    })
  })

  describe("relativeKo", () => {
    it("null이면 '기록 없음'", () => {
      expect(relativeKo(null)).toBe("기록 없음")
    })
    it("오늘", () => {
      expect(relativeKo(new Date())).toBe("오늘")
    })
    it("어제", () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      expect(relativeKo(d)).toBe("어제")
    })
    it("내일", () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      expect(relativeKo(d)).toBe("내일")
    })
    it("3일 전은 한국어 상대 표현", () => {
      const d = new Date()
      d.setDate(d.getDate() - 3)
      const out = relativeKo(d)
      expect(out).toMatch(/3일 전|3일전/)
    })
  })

  describe("daysAgoKo", () => {
    it("null이면 '기록 없음'", () => {
      expect(daysAgoKo(null)).toBe("기록 없음")
    })
    it("오늘 기록은 '오늘'", () => {
      expect(daysAgoKo(new Date())).toBe("오늘")
    })
    it("1일 전", () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      expect(daysAgoKo(d)).toBe("1일 전")
    })
    it("12일 전", () => {
      const d = new Date()
      d.setDate(d.getDate() - 12)
      expect(daysAgoKo(d)).toBe("12일 전")
    })
  })

  describe("fullDateKo / shortDateKo / timeKo", () => {
    it("fullDateKo는 yyyy년 M월 d일 (요일)", () => {
      expect(fullDateKo("2026-05-04T03:00:00.000Z")).toMatch(
        /2026년 5월 4일/,
      )
    })
    it("shortDateKo는 M월 d일", () => {
      expect(shortDateKo("2026-05-04T03:00:00.000Z")).toBe("5월 4일")
    })
    it("timeKo는 한국어 12시간 표기", () => {
      const out = timeKo("2026-05-04T03:00:00.000Z")
      expect(out).toMatch(/오후|오전/)
    })
    it("null 입력은 빈 문자열", () => {
      expect(fullDateKo(null)).toBe("")
      expect(shortDateKo(null)).toBe("")
      expect(timeKo(null)).toBe("")
    })
  })

  describe("toLocalInput", () => {
    it("YYYY-MM-DDTHH:MM 형식", () => {
      const out = toLocalInput("2026-05-04T03:00:00.000Z")
      expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })
  })

  describe("startOfTodayISO", () => {
    it("현재 날짜의 00:00:00 ISO를 반환", () => {
      const iso = startOfTodayISO()
      const parsed = new Date(iso)
      expect(parsed.getHours()).toBe(0)
      expect(parsed.getMinutes()).toBe(0)
      expect(parsed.getSeconds()).toBe(0)
    })
  })
})
