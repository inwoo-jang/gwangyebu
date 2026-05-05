/**
 * 관계 건강도 분석 도메인.
 *
 * 책임
 *  1. Supabase에서 인물 + 연관 데이터 로드 (`PersonContextLoader`로 주입 가능 — DI/테스트 용이성)
 *  2. LLM 입력 컨텍스트(`PersonContext`) 빌드 + 자동 트리밍
 *  3. `prompts/relationship-analysis.md` 시스템 프롬프트 로드
 *  4. `completeJSON`으로 LLM 호출 + zod 검증
 *  5. 결과를 `relationship_scores` 테이블에 저장 (`PersonContextLoader.saveScore`)
 *  6. 24h 캐시 — 동일 person + 데이터 hash 변경 없을 때 LLM 재호출 X
 *
 * 외부 코드는 `analyzeRelationship(personId, deps)`를 호출한다.
 */

import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

import { z } from "zod"

import { completeJSON } from "./json"
import type { ProviderName } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// 입력 컨텍스트 / 출력 스키마
// ─────────────────────────────────────────────────────────────────────────────

export type RelationshipBand = "강" | "보통" | "주의" | "위험"
export type SuggestionType = "contact" | "event" | "gift" | "note"
export type Urgency = "low" | "med" | "high"

export interface PersonRecord {
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
  lastContactAt: string | null // ISO
  createdAt: string // ISO (knownSince 대용)
}

export interface ContactLogRecord {
  occurredAt: string // ISO
  channel: string
  direction: "outbound" | "inbound" | "unknown"
  memo: string | null
}

export interface EventRecord {
  type: string
  date: string // ISO date
  attended: boolean | null
  amountPaid: number | null
  memo: string | null
}

export interface GiftRecord {
  direction: "sent" | "received"
  kind: "cash" | "item"
  amount: number | null
  itemName: string | null
  occurredAt: string // ISO date
  reason: string | null
}

export interface NoteRecord {
  body: string
  createdAt: string // ISO
}

/** LLM에 전달되는 컨텍스트 객체 (트리밍 후) */
export interface PersonContext {
  person: {
    name: string
    nickname: string | null
    relationshipType: string
    mbti: string | null
    birthday: string | null
    knownSince: string | null
    memo: string | null
    howWeMet: string | null
    foodPreference: string | null
  }
  daysSinceLastContact: number | null
  recentContacts: Array<{
    occurredAt: string
    channel: string
    direction: string
    memo: string | null
  }>
  events: Array<{
    type: string
    date: string
    attended: boolean | null
    amountPaid: number | null
  }>
  gifts: Array<{
    direction: string
    kind: string
    amount: number | null
    itemName: string | null
    occurredAt: string
    reason: string | null
  }>
  notes: Array<{ body: string; createdAt: string }>
}

const factorSchema = z.object({
  label: z.string().min(1).max(50),
  weight: z.number().int().min(-30).max(30),
  evidence: z.string().min(1).max(200),
})

const suggestionSchema = z.object({
  type: z.enum(["contact", "event", "gift", "note"]),
  message: z.string().min(1).max(300),
  urgency: z.enum(["low", "med", "high"]),
})

export const relationshipScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: z.enum(["강", "보통", "주의", "위험"]),
  factors: z.array(factorSchema).min(1).max(5),
  suggestions: z.array(suggestionSchema).min(1).max(5),
})

export type RelationshipAnalysisOutput = z.infer<typeof relationshipScoreSchema>

export interface RelationshipScoreRecord extends RelationshipAnalysisOutput {
  personId: string
  provider: ProviderName
  model: string
  generatedAt: string // ISO
  contextHash: string
}

// ─────────────────────────────────────────────────────────────────────────────
// DI 인터페이스 — 데이터 접근 계층 (Supabase 또는 in-memory mock)
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonContextLoader {
  /** 인물 1건 + 연관 데이터를 묶어서 반환. RLS는 호출자가 보장. */
  loadPersonBundle(personId: string): Promise<{
    person: PersonRecord
    contacts: ContactLogRecord[] // 최근 90일
    events: EventRecord[] // 최근 1년
    gifts: GiftRecord[]
    notes: NoteRecord[]
  } | null>

  /** 24h 캐시 조회 — 동일 contextHash이면 그대로 사용. */
  loadCachedScore(personId: string): Promise<RelationshipScoreRecord | null>

  /** 결과 저장 (upsert). */
  saveScore(record: RelationshipScoreRecord): Promise<void>
}

export interface AnalyzeRelationshipOptions {
  loader: PersonContextLoader
  provider?: ProviderName
  /** 시스템 프롬프트를 직접 주입(테스트용). 미지정 시 prompts/relationship-analysis.md 로드. */
  systemPrompt?: string
  /** 캐시 TTL ms. 기본 24h. */
  cacheTtlMs?: number
  /** 현재 시각(테스트용). */
  now?: () => Date
  /** completeJSON 주입(테스트용). */
  completeJSON?: typeof completeJSON
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 진입점
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export async function analyzeRelationship(
  personId: string,
  options: AnalyzeRelationshipOptions
): Promise<RelationshipScoreRecord> {
  const {
    loader,
    provider,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    now = () => new Date(),
  } = options
  const completeJSONFn = options.completeJSON ?? completeJSON

  const bundle = await loader.loadPersonBundle(personId)
  if (!bundle) {
    throw new Error(`Person not found: ${personId}`)
  }

  const context = buildContext(bundle, now())
  const contextHash = hashContext(context)

  // 캐시 확인
  const cached = await loader.loadCachedScore(personId)
  if (cached && cached.contextHash === contextHash) {
    const generatedAt = new Date(cached.generatedAt).getTime()
    if (now().getTime() - generatedAt < cacheTtlMs) {
      return cached
    }
  }

  const systemPrompt =
    options.systemPrompt ?? (await loadSystemPrompt())

  const { data, raw } = await completeJSONFn(
    {
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify(context, null, 2),
        },
      ],
      maxTokens: 1024,
      temperature: 0.3,
    },
    {
      schema: relationshipScoreSchema,
      provider,
    }
  )

  const record: RelationshipScoreRecord = {
    ...data,
    personId,
    provider: raw.provider,
    model: raw.model,
    generatedAt: now().toISOString(),
    contextHash,
  }

  await loader.saveScore(record)
  return record
}

// ─────────────────────────────────────────────────────────────────────────────
// 컨텍스트 빌더 + 트리밍
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CONTACTS = 30
const MAX_EVENTS = 10
const MAX_GIFTS = 10
const MAX_NOTES = 5
const MAX_NOTE_LEN = 400
const MAX_MEMO_LEN = 600
const RECENT_CONTACT_WINDOW_DAYS = 90

export function buildContext(
  bundle: {
    person: PersonRecord
    contacts: ContactLogRecord[]
    events: EventRecord[]
    gifts: GiftRecord[]
    notes: NoteRecord[]
  },
  now: Date
): PersonContext {
  const { person } = bundle
  const daysSinceLastContact = person.lastContactAt
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(person.lastContactAt).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      )
    : null

  const cutoff = now.getTime() - RECENT_CONTACT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const contacts = [...bundle.contacts]
    .filter((c) => new Date(c.occurredAt).getTime() >= cutoff)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, MAX_CONTACTS)
    .map((c) => ({
      occurredAt: toIsoDate(c.occurredAt),
      channel: c.channel,
      direction: c.direction,
      memo: trimText(c.memo, 120),
    }))

  const events = [...bundle.events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_EVENTS)
    .map((e) => ({
      type: e.type,
      date: toIsoDate(e.date),
      attended: e.attended,
      amountPaid: e.amountPaid,
    }))

  const gifts = [...bundle.gifts]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, MAX_GIFTS)
    .map((g) => ({
      direction: g.direction,
      kind: g.kind,
      amount: g.amount,
      itemName: g.itemName,
      occurredAt: toIsoDate(g.occurredAt),
      reason: trimText(g.reason, 80),
    }))

  const notes = [...bundle.notes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, MAX_NOTES)
    .map((n) => ({
      body: trimText(n.body, MAX_NOTE_LEN) ?? "",
      createdAt: toIsoDate(n.createdAt),
    }))

  const birthday =
    person.birthMonth && person.birthDay
      ? `${person.birthYear ?? "----"}-${pad2(person.birthMonth)}-${pad2(person.birthDay)}`
      : null

  return {
    person: {
      name: person.name,
      nickname: null,
      relationshipType: person.relationshipType,
      mbti: person.mbti,
      birthday,
      knownSince: person.createdAt ? toIsoDate(person.createdAt) : null,
      memo: trimText(person.memo, MAX_MEMO_LEN),
      howWeMet: trimText(person.howWeMet, 100),
      foodPreference: trimText(person.foodPreference, 200),
    },
    daysSinceLastContact,
    recentContacts: contacts,
    events,
    gifts,
    notes,
  }
}

function trimText(text: string | null, max: number): string | null {
  if (text == null) return null
  const t = text.trim()
  if (!t) return null
  if (t.length <= max) return t
  return t.slice(0, max - 1) + "…"
}

function toIsoDate(value: string): string {
  // 입력이 "2026-04-12T12:34:56Z" 또는 "2026-04-12"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString()
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0")
}

// ─────────────────────────────────────────────────────────────────────────────
// 캐시 hash
// ─────────────────────────────────────────────────────────────────────────────

export function hashContext(ctx: PersonContext): string {
  // 결정적 직렬화: JSON.stringify는 키 순서 비결정 가능 — Node에서는 객체 리터럴 키 순서가 안정.
  // 안전하게 키를 정렬해서 직렬화.
  const json = stableStringify(ctx)
  return createHash("sha256").update(json).digest("hex")
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return "[" + value.map((v) => stableStringify(v)).join(",") + "]"
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
      .join(",") +
    "}"
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 시스템 프롬프트 로딩
// ─────────────────────────────────────────────────────────────────────────────

let cachedPrompt: string | null = null

async function loadSystemPrompt(): Promise<string> {
  if (cachedPrompt != null) return cachedPrompt
  const promptPath = path.join(
    process.cwd(),
    "prompts",
    "relationship-analysis.md"
  )
  cachedPrompt = await fs.readFile(promptPath, "utf-8")
  return cachedPrompt
}

/** 테스트에서 캐시된 프롬프트를 초기화. */
export function _resetPromptCache(): void {
  cachedPrompt = null
}
