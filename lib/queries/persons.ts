/**
 * 서버 컴포넌트에서 직접 사용하는 read-only 쿼리.
 * 서버 액션으로 충분히 노출 가능한 데이터지만,
 * 페이지가 필요로 하는 join/derived 형태를 별도로 정리한다.
 */
import "server-only"
import { createClient } from "@/lib/supabase/server"
import type {
  Person,
  Tag,
  ContactLog,
  Reminder,
  Note,
  RelationshipScore,
  EventRecord,
  Gift,
  Loan,
} from "@/lib/supabase/types"

export interface PersonListItem extends Person {
  score?: number | null
  tags: Pick<Tag, "id" | "name" | "color">[]
  last_contact_channel: ContactLog["channel"] | null
}

interface ListOptions {
  query?: string
  relationship_types?: Person["relationship_type"][]
  tag_ids?: string[]
  status?: Person["status"]
  limit?: number
  offset?: number
}

export async function fetchPersonsForList(
  opts: ListOptions = {},
): Promise<PersonListItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  let q = supabase
    .from("persons")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("last_contact_at", { ascending: true, nullsFirst: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1)

  if (opts.status) q = q.eq("status", opts.status)
  if (opts.relationship_types && opts.relationship_types.length > 0) {
    q = q.in("relationship_type", opts.relationship_types)
  }
  if (opts.query && opts.query.trim().length > 0) {
    const safe = opts.query.replace(/[%_]/g, "\\$&")
    q = q.or(
      [
        `name.ilike.%${safe}%`,
        `nickname.ilike.%${safe}%`,
        `kakao_nickname.ilike.%${safe}%`,
        `instagram_handle.ilike.%${safe}%`,
        `memo.ilike.%${safe}%`,
        `how_we_met.ilike.%${safe}%`,
      ].join(","),
    )
  }

  const { data, error } = await q
  if (error || !data) return []

  let rows = data as Person[]

  if (opts.tag_ids && opts.tag_ids.length > 0) {
    const ids = rows.map((r) => r.id)
    if (ids.length === 0) return []
    const { data: links } = await supabase
      .from("person_tags")
      .select("person_id, tag_id")
      .in("person_id", ids)
      .in("tag_id", opts.tag_ids)
    const allowed = new Set((links ?? []).map((r) => r.person_id as string))
    rows = rows.filter((r) => allowed.has(r.id))
  }

  if (rows.length === 0) return []

  const personIds = rows.map((r) => r.id)

  // tags
  const { data: tagLinks } = await supabase
    .from("person_tags")
    .select("person_id, tags:tag_id(id, name, color)")
    .in("person_id", personIds)

  const tagsByPerson = new Map<
    string,
    Pick<Tag, "id" | "name" | "color">[]
  >()
  for (const row of (tagLinks ?? []) as Array<{
    person_id: string
    tags:
      | Pick<Tag, "id" | "name" | "color">
      | Pick<Tag, "id" | "name" | "color">[]
      | null
  }>) {
    if (!row.tags) continue
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags
    if (!tag) continue
    const list = tagsByPerson.get(row.person_id) ?? []
    list.push(tag)
    tagsByPerson.set(row.person_id, list)
  }

  // scores
  const { data: scores } = await supabase
    .from("relationship_scores")
    .select("person_id, score")
    .in("person_id", personIds)

  const scoreByPerson = new Map<string, number>()
  for (const s of (scores ?? []) as Pick<RelationshipScore, "person_id" | "score">[]) {
    scoreByPerson.set(s.person_id, s.score)
  }

  // last contact channel — fetch most recent log per person
  const { data: lastLogs } = await supabase
    .from("contacts_log")
    .select("person_id, channel, occurred_at")
    .in("person_id", personIds)
    .order("occurred_at", { ascending: false })

  const channelByPerson = new Map<string, ContactLog["channel"]>()
  for (const row of (lastLogs ?? []) as Pick<
    ContactLog,
    "person_id" | "channel" | "occurred_at"
  >[]) {
    if (!channelByPerson.has(row.person_id)) {
      channelByPerson.set(row.person_id, row.channel)
    }
  }

  return rows.map<PersonListItem>((p) => ({
    ...p,
    tags: tagsByPerson.get(p.id) ?? [],
    score: scoreByPerson.get(p.id) ?? null,
    last_contact_channel: channelByPerson.get(p.id) ?? null,
  }))
}

export async function fetchPersonDetail(personId: string): Promise<{
  person: Person
  tags: Pick<Tag, "id" | "name" | "color">[]
  contacts: ContactLog[]
  notes: Note[]
  score: RelationshipScore | null
  upcomingReminder: Reminder | null
  events: EventRecord[]
  gifts: Gift[]
  loans: Loan[]
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: person } = await supabase
    .from("persons")
    .select("*")
    .eq("id", personId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle<Person>()

  if (!person) return null

  const [
    { data: tagLinks },
    { data: contacts },
    { data: notes },
    { data: score },
    { data: reminder },
    { data: events },
    { data: gifts },
    { data: loans },
  ] = await Promise.all([
    supabase
      .from("person_tags")
      .select("tags:tag_id(id, name, color)")
      .eq("person_id", personId),
    supabase
      .from("contacts_log")
      .select("*")
      .eq("person_id", personId)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("notes")
      .select("*")
      .eq("person_id", personId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("relationship_scores")
      .select("*")
      .eq("person_id", personId)
      .maybeSingle<RelationshipScore>(),
    supabase
      .from("reminders")
      .select("*")
      .eq("person_id", personId)
      .eq("status", "active")
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle<Reminder>(),
    supabase
      .from("events")
      .select("*")
      .eq("person_id", personId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("gifts")
      .select("*")
      .eq("person_id", personId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("loans")
      .select("*")
      .eq("person_id", personId)
      .order("occurred_at", { ascending: false }),
  ])

  const tags: Pick<Tag, "id" | "name" | "color">[] = []
  for (const row of (tagLinks ?? []) as Array<{
    tags:
      | Pick<Tag, "id" | "name" | "color">
      | Pick<Tag, "id" | "name" | "color">[]
      | null
  }>) {
    if (!row.tags) continue
    const tag = Array.isArray(row.tags) ? row.tags[0] : row.tags
    if (tag) tags.push(tag)
  }

  return {
    person,
    tags,
    contacts: (contacts ?? []) as ContactLog[],
    notes: (notes ?? []) as Note[],
    score: (score as RelationshipScore | null) ?? null,
    upcomingReminder: (reminder as Reminder | null) ?? null,
    events: (events ?? []) as EventRecord[],
    gifts: (gifts ?? []) as Gift[],
    loans: (loans ?? []) as Loan[],
  }
}

export async function fetchUpcomingReminders(
  limit = 3,
): Promise<(Reminder & { person_name: string })[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("reminders")
    .select("*, persons!inner(name)")
    .eq("user_id", user.id)
    .in("status", ["active", "snoozed"])
    .order("scheduled_at", { ascending: true })
    .limit(limit)

  return ((data ?? []) as Array<
    Reminder & { persons: { name: string } | { name: string }[] | null }
  >).map((r) => {
    const persons = r.persons
    const name = Array.isArray(persons)
      ? persons[0]?.name
      : (persons?.name ?? "")
    return { ...r, person_name: name ?? "" }
  })
}
