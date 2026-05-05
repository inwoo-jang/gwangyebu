/**
 * 카카오톡 대화 내보내기 (.txt) 파서.
 *
 * 안드로이드/iOS 카톡의 "대화 내용 내보내기"가 만들어주는 텍스트 포맷:
 *
 *   카카오톡 대화: <방이름>님과 카카오톡 대화
 *   저장한 날짜 : 2026년 5월 1일 오전 10:23
 *
 *   --------------- 2026년 4월 20일 화요일 ---------------
 *   [김지수] [오전 10:30] 안녕!
 *   [장인우] [오전 10:31] 오랜만이야~
 *   [김지수] [오전 10:32] 다음주에 시간 어때?
 *
 *   --------------- 2026년 4월 25일 일요일 ---------------
 *   ...
 *
 * 일부 변형이 있을 수 있어 유연하게 파싱한다.
 */

export interface KakaoMessage {
  /** ISO 날짜 + 시각. 시각이 없으면 09:00로 폴백. */
  occurredAt: string
  sender: string
  body: string
}

export interface KakaoDayBucket {
  /** ISO 날짜 (YYYY-MM-DD) */
  date: string
  messages: KakaoMessage[]
  participants: string[]
  outboundCount: number
  inboundCount: number
}

const DATE_HEADER_RE =
  /-+\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?-+/u

const MSG_RE = /^\[([^\]]+)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*(.*)$/u

function pad(n: number): string {
  return n.toString().padStart(2, "0")
}

function buildIso(
  year: number,
  month: number,
  day: number,
  ampm: "오전" | "오후" | null,
  hour: number,
  minute: number,
): string {
  let h = hour
  if (ampm === "오후" && hour < 12) h += 12
  if (ampm === "오전" && hour === 12) h = 0
  // KST는 따로 처리하지 않고 로컬 ISO로 저장 (브라우저/서버 모두 KST 가정).
  const d = new Date(year, month - 1, day, h, minute, 0)
  return d.toISOString()
}

export interface ParseResult {
  /** 대화방 이름 (방이름 라인이 있으면) */
  roomName: string | null
  /** 모든 메시지 평면 리스트 */
  messages: KakaoMessage[]
  /** 날짜별로 묶은 그룹 (오름차순) */
  days: KakaoDayBucket[]
  /** 참여자 집합 */
  participants: string[]
}

/**
 * KakaoTalk 텍스트 내보내기를 파싱한다.
 *
 * @param text  파일 내용
 * @param selfName 사용자 본인의 이름. inbound/outbound 판정에 사용.
 *                미지정 시 outboundCount는 0으로 두고 inbound만 카운트.
 */
export function parseKakaoExport(
  text: string,
  selfName?: string | null,
): ParseResult {
  const lines = text.split(/\r?\n/)
  let roomName: string | null = null
  let curYear = 0,
    curMonth = 0,
    curDay = 0
  let curMsg: KakaoMessage | null = null
  const messages: KakaoMessage[] = []
  const participants = new Set<string>()

  for (const rawLine of lines) {
    const line = rawLine.replace(/﻿/g, "") // remove BOM

    if (!roomName) {
      const roomMatch = line.match(/^카카오톡 대화\s*[:：]?\s*(.+?)(?:님과)?\s*카카오톡 대화$/u)
      if (roomMatch) {
        roomName = roomMatch[1].trim()
        continue
      }
    }

    const dateMatch = line.match(DATE_HEADER_RE)
    if (dateMatch) {
      curYear = Number(dateMatch[1])
      curMonth = Number(dateMatch[2])
      curDay = Number(dateMatch[3])
      curMsg = null
      continue
    }

    const msgMatch = line.match(MSG_RE)
    if (msgMatch && curYear) {
      const [, sender, ampm, hourStr, minStr, body] = msgMatch
      const message: KakaoMessage = {
        occurredAt: buildIso(
          curYear,
          curMonth,
          curDay,
          ampm as "오전" | "오후",
          Number(hourStr),
          Number(minStr),
        ),
        sender: sender.trim(),
        body: body.trim(),
      }
      participants.add(message.sender)
      messages.push(message)
      curMsg = message
      continue
    }

    // 메시지가 여러 줄에 걸친 경우 — 직전 메시지에 이어붙임.
    if (curMsg && line.trim().length > 0) {
      curMsg.body += "\n" + line
    }
  }

  // 날짜별 버킷 만들기
  const dayMap = new Map<string, KakaoDayBucket>()
  for (const m of messages) {
    const d = new Date(m.occurredAt)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    let bucket = dayMap.get(key)
    if (!bucket) {
      bucket = {
        date: key,
        messages: [],
        participants: [],
        outboundCount: 0,
        inboundCount: 0,
      }
      dayMap.set(key, bucket)
    }
    bucket.messages.push(m)
    if (selfName && m.sender === selfName) bucket.outboundCount += 1
    else bucket.inboundCount += 1
  }

  for (const bucket of dayMap.values()) {
    bucket.participants = Array.from(new Set(bucket.messages.map((x) => x.sender)))
  }

  const days = Array.from(dayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  return {
    roomName,
    messages,
    days,
    participants: Array.from(participants),
  }
}

/**
 * AI 호출 없이 사용할 수 있는 룰베이스 요약.
 * - 메시지 개수
 * - 첫 메시지 / 마지막 메시지 미리보기
 */
export function ruleBasedSummary(bucket: KakaoDayBucket): string {
  const total = bucket.messages.length
  if (total === 0) return ""
  const first = bucket.messages[0]
  const last = bucket.messages[total - 1]
  const previewLen = 40
  const firstPreview = first.body.slice(0, previewLen).replace(/\n/g, " ")
  const lastPreview = last.body.slice(0, previewLen).replace(/\n/g, " ")
  if (total === 1) {
    return `${first.sender}: ${firstPreview}`
  }
  return `${total}개 메시지 — "${firstPreview}…" → "${lastPreview}"`
}
