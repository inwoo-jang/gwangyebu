/**
 * Supabase 기반 PersonContextLoader 구현.
 *
 * 주의: 백엔드 마이그레이션이 진행 중이므로 일부 테이블/컬럼은 환경에 따라 미존재할 수 있다.
 * 그런 경우 안전하게 빈 배열/null로 폴백한다 (관련 PostgrestError를 swallow).
 */

import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  ContactLogRecord,
  EventRecord,
  GiftRecord,
  NoteRecord,
  PersonContextLoader,
  PersonRecord,
  RelationshipScoreRecord,
} from "./relationship-analysis"

const RECENT_CONTACT_DAYS = 90
const RECENT_EVENT_DAYS = 365

export interface SupabaseLoaderOptions {
  /** RLS 보장된 클라이언트 (current user). */
  client: SupabaseClient
  /** RLS를 우회하지 않으면 person_id 한 건도 user_id 검사 필요. */
  userId: string
  /** 현재 시각(테스트용). */
  now?: () => Date
}

export function createSupabaseLoader(
  options: SupabaseLoaderOptions
): PersonContextLoader {
  const { client, userId } = options
  const now = options.now ?? (() => new Date())

  return {
    async loadPersonBundle(personId) {
      const { data: person, error: pErr } = await client
        .from("persons")
        .select(
          [
            "id",
            "user_id",
            "name",
            "relationship_type",
            "mbti",
            "birth_year",
            "birth_month",
            "birth_day",
            "memo",
            "how_we_met",
            "food_preference",
            "last_contact_at",
            "created_at",
          ].join(",")
        )
        .eq("id", personId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle<PersonRow>()

      if (pErr || !person) return null

      const contactsCutoff = isoDaysAgo(now(), RECENT_CONTACT_DAYS)
      const eventsCutoff = isoDaysAgo(now(), RECENT_EVENT_DAYS)

      const [contacts, events, gifts, notes] = await Promise.all([
        safeSelect<ContactRow>(
          client
            .from("contacts_log")
            .select("occurred_at, channel, direction, memo")
            .eq("person_id", personId)
            .gte("occurred_at", contactsCutoff)
            .order("occurred_at", { ascending: false })
            .limit(100)
        ),
        safeSelect<EventRow>(
          client
            .from("events")
            .select("event_type, occurred_at, attended, amount_paid, memo")
            .eq("person_id", personId)
            .gte("occurred_at", eventsCutoff.slice(0, 10))
            .order("occurred_at", { ascending: false })
            .limit(50)
        ),
        safeSelect<GiftRow>(
          client
            .from("gifts")
            .select(
              "direction, kind, amount, item_name, occurred_at, reason"
            )
            .eq("person_id", personId)
            .order("occurred_at", { ascending: false })
            .limit(50)
        ),
        safeSelect<NoteRow>(
          client
            .from("notes")
            .select("body, created_at")
            .eq("person_id", personId)
            .order("created_at", { ascending: false })
            .limit(20)
        ),
      ])

      return {
        person: mapPerson(person),
        contacts: contacts.map(mapContact),
        events: events.map(mapEvent),
        gifts: gifts.map(mapGift),
        notes: notes.map(mapNote),
      }
    },

    async loadCachedScore(personId) {
      const { data, error } = await client
        .from("relationship_scores")
        .select("person_id, score, factors, last_reason, provider, computed_at")
        .eq("person_id", personId)
        .maybeSingle<ScoreRow>()
      if (error || !data) return null
      return rowToRecord(data)
    },

    async saveScore(record) {
      // factors jsonb에 분석 전체 페이로드 보관 (band, factors, suggestions, contextHash, model)
      await client
        .from("relationship_scores")
        .upsert(
          {
            person_id: record.personId,
            user_id: userId,
            score: record.score,
            factors: {
              band: record.band,
              factors: record.factors,
              suggestions: record.suggestions,
              contextHash: record.contextHash,
              model: record.model,
            },
            last_reason: record.suggestions[0]?.message ?? null,
            provider: record.provider,
            computed_at: record.generatedAt,
          },
          { onConflict: "person_id" }
        )
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Row 타입 (Supabase 응답)
// ─────────────────────────────────────────────────────────────────────────────

interface PersonRow {
  id: string
  user_id: string
  name: string
  relationship_type: string
  mbti: string | null
  birth_year: number | null
  birth_month: number | null
  birth_day: number | null
  memo: string | null
  how_we_met: string | null
  food_preference: string | null
  last_contact_at: string | null
  created_at: string
}

interface ContactRow {
  occurred_at: string
  channel: string
  direction: "outbound" | "inbound" | "unknown"
  memo: string | null
}

interface EventRow {
  event_type: string
  occurred_at: string
  attended: boolean | null
  amount_paid: number | null
  memo: string | null
}

interface GiftRow {
  direction: "sent" | "received"
  kind: "cash" | "item"
  amount: number | null
  item_name: string | null
  occurred_at: string
  reason: string | null
}

interface NoteRow {
  body: string
  created_at: string
}

interface ScoreRow {
  person_id: string
  score: number
  factors: {
    band?: "강" | "보통" | "주의" | "위험"
    factors?: Array<{ label: string; weight: number; evidence: string }>
    suggestions?: Array<{
      type: "contact" | "event" | "gift" | "note"
      message: string
      urgency: "low" | "med" | "high"
    }>
    contextHash?: string
    model?: string
  } | null
  last_reason: string | null
  provider: "claude" | "gemini" | "auto" | "rule_based"
  computed_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// 매퍼
// ─────────────────────────────────────────────────────────────────────────────

function mapPerson(row: PersonRow): PersonRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    relationshipType: row.relationship_type,
    mbti: row.mbti,
    birthMonth: row.birth_month,
    birthDay: row.birth_day,
    birthYear: row.birth_year,
    memo: row.memo,
    howWeMet: row.how_we_met,
    foodPreference: row.food_preference,
    lastContactAt: row.last_contact_at,
    createdAt: row.created_at,
  }
}

function mapContact(row: ContactRow): ContactLogRecord {
  return {
    occurredAt: row.occurred_at,
    channel: row.channel,
    direction: row.direction,
    memo: row.memo,
  }
}

function mapEvent(row: EventRow): EventRecord {
  return {
    type: row.event_type,
    date: row.occurred_at,
    attended: row.attended,
    amountPaid: row.amount_paid,
    memo: row.memo,
  }
}

function mapGift(row: GiftRow): GiftRecord {
  return {
    direction: row.direction,
    kind: row.kind,
    amount: row.amount,
    itemName: row.item_name,
    occurredAt: row.occurred_at,
    reason: row.reason,
  }
}

function mapNote(row: NoteRow): NoteRecord {
  return { body: row.body, createdAt: row.created_at }
}

function rowToRecord(row: ScoreRow): RelationshipScoreRecord | null {
  if (!row.factors || !row.factors.factors || !row.factors.suggestions) {
    return null
  }
  const provider = row.provider === "gemini" ? "gemini" : "claude"
  return {
    personId: row.person_id,
    score: row.score,
    band: row.factors.band ?? bandFromScore(row.score),
    factors: row.factors.factors,
    suggestions: row.factors.suggestions,
    provider,
    model: row.factors.model ?? "",
    generatedAt: row.computed_at,
    contextHash: row.factors.contextHash ?? "",
  }
}

function bandFromScore(score: number): "강" | "보통" | "주의" | "위험" {
  if (score >= 80) return "강"
  if (score >= 60) return "보통"
  if (score >= 40) return "주의"
  return "위험"
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────

function isoDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * 관련 테이블이 아직 생성되지 않았거나 접근 권한이 없을 때 빈 배열 반환.
 */
async function safeSelect<R>(
  query: PromiseLike<{ data: R[] | null; error: unknown }>
): Promise<R[]> {
  try {
    const { data, error } = await query
    if (error) return []
    return data ?? []
  } catch {
    return []
  }
}
