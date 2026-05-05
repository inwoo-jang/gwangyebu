"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  GuestContactLog,
  GuestEvent,
  GuestGift,
  GuestLoan,
  GuestNote,
  GuestPerson,
  GuestRelationshipScore,
  GuestReminder,
  GuestSettings,
  GuestState,
  GuestTag,
} from "./types"
import { GUEST_STORAGE_KEY } from "./types"
import { buildSeed } from "./seed"

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function nowIso(): string {
  return new Date().toISOString()
}

const DEFAULT_SETTINGS: GuestSettings = {
  display_name: "게스트",
  ai_provider: "auto",
  notification_prefs: {
    reminders: true,
    ai: true,
    events: true,
    quiet_hours: { start: "22:00", end: "08:00" },
  },
  locale: "ko",
  timezone: "Asia/Seoul",
}

interface Actions {
  // bootstrap
  ensureSeeded: () => void
  resetAll: () => void

  // persons
  createPerson: (
    input: Omit<
      GuestPerson,
      | "id"
      | "created_at"
      | "updated_at"
      | "deleted_at"
      | "last_contact_at"
      | "status"
      | "business_card_url"
      | "instagram_handle"
      | "nickname"
    > & {
      nickname?: string | null
      instagram_handle?: string | null
      tagIds?: string[]
    },
  ) => string
  updatePerson: (
    id: string,
    patch: Partial<Omit<GuestPerson, "id" | "created_at">> & {
      tagIds?: string[]
    },
  ) => void
  deletePerson: (id: string) => void
  getPerson: (id: string) => GuestPerson | undefined
  listPersons: () => GuestPerson[]

  // tags
  createTag: (name: string) => string
  listTags: () => GuestTag[]
  getTagsForPerson: (personId: string) => GuestTag[]
  attachTag: (personId: string, tagId: string) => void
  detachTag: (personId: string, tagId: string) => void

  // contact log
  logContact: (
    input: Omit<GuestContactLog, "id" | "created_at">,
  ) => string
  listContactsForPerson: (personId: string) => GuestContactLog[]

  // reminders
  createReminder: (
    input: Omit<
      GuestReminder,
      "id" | "created_at" | "updated_at" | "completed_at" | "status"
    > & { status?: GuestReminder["status"] },
  ) => string
  completeReminder: (id: string) => void
  snoozeReminder: (id: string, scheduled_at: string) => void
  listReminders: () => GuestReminder[]
  upcomingReminderForPerson: (personId: string) => GuestReminder | undefined

  // notes
  addNote: (personId: string, body: string) => string
  updateNote: (id: string, body: string) => void
  deleteNote: (id: string) => void
  listNotesForPerson: (personId: string) => GuestNote[]

  // scores
  setScore: (score: GuestRelationshipScore) => void
  getScore: (personId: string) => GuestRelationshipScore | undefined

  // settings
  getSettings: () => GuestSettings
  updateSettings: (patch: Partial<GuestSettings>) => void

  // 명함
  setBusinessCard: (personId: string, dataUrl: string) => void
  clearBusinessCard: (personId: string) => void

  // events / gifts / loans (주고받은 기록)
  addEvent: (input: Omit<GuestEvent, "id" | "created_at">) => string
  updateEvent: (id: string, patch: Partial<GuestEvent>) => void
  deleteEvent: (id: string) => void
  addGift: (input: Omit<GuestGift, "id" | "created_at">) => string
  updateGift: (id: string, patch: Partial<GuestGift>) => void
  deleteGift: (id: string) => void
  addLoan: (
    input: Omit<GuestLoan, "id" | "created_at" | "returned_at"> & {
      returned_at?: string | null
    },
  ) => string
  updateLoan: (id: string, patch: Partial<GuestLoan>) => void
  markLoanReturned: (id: string, returnedAt?: string) => void
  deleteLoan: (id: string) => void

  // export
  exportJson: () => string
}

export const useGuestStore = create<GuestState & Actions>()(
  persist(
    (set, get) => ({
      persons: [],
      tags: [],
      personTags: [],
      contacts: [],
      reminders: [],
      notes: [],
      events: [],
      gifts: [],
      loans: [],
      scores: [],
      settings: DEFAULT_SETTINGS,
      seeded: false,

      ensureSeeded: () => {
        if (get().seeded) return
        const seed = buildSeed()
        set({
          persons: seed.persons,
          tags: seed.tags,
          personTags: seed.personTags,
          contacts: seed.contacts,
          reminders: seed.reminders,
          notes: seed.notes,
          events: seed.events,
          gifts: seed.gifts,
          loans: seed.loans,
          scores: seed.scores,
          seeded: true,
        })
      },

      resetAll: () => {
        set({
          persons: [],
          tags: [],
          personTags: [],
          contacts: [],
          reminders: [],
          notes: [],
          events: [],
          gifts: [],
          loans: [],
          scores: [],
          settings: DEFAULT_SETTINGS,
          seeded: false,
        })
      },

      createPerson: (input) => {
        const now = nowIso()
        const id = uid()
        const { tagIds, instagram_handle, nickname, ...rest } = input
        const person: GuestPerson = {
          id,
          status: "active",
          deleted_at: null,
          last_contact_at: null,
          business_card_url: null,
          instagram_handle: instagram_handle ?? null,
          nickname: nickname ?? null,
          ...rest,
          created_at: now,
          updated_at: now,
        }
        set((s) => ({
          persons: [person, ...s.persons],
          personTags: tagIds
            ? [
                ...s.personTags,
                ...tagIds.map((tag_id) => ({
                  person_id: id,
                  tag_id,
                  created_at: now,
                })),
              ]
            : s.personTags,
        }))
        return id
      },

      updatePerson: (id, patch) => {
        const now = nowIso()
        const { tagIds, ...rest } = patch
        set((s) => ({
          persons: s.persons.map((p) =>
            p.id === id ? { ...p, ...rest, updated_at: now } : p,
          ),
          personTags:
            tagIds !== undefined
              ? [
                  ...s.personTags.filter((pt) => pt.person_id !== id),
                  ...tagIds.map((tag_id) => ({
                    person_id: id,
                    tag_id,
                    created_at: now,
                  })),
                ]
              : s.personTags,
        }))
      },

      deletePerson: (id) => {
        set((s) => ({
          persons: s.persons.filter((p) => p.id !== id),
          personTags: s.personTags.filter((pt) => pt.person_id !== id),
          contacts: s.contacts.filter((c) => c.person_id !== id),
          reminders: s.reminders.filter((r) => r.person_id !== id),
          notes: s.notes.filter((n) => n.person_id !== id),
          events: s.events.filter((e) => e.person_id !== id),
          gifts: s.gifts.filter((g) => g.person_id !== id),
          loans: s.loans.filter((l) => l.person_id !== id),
          scores: s.scores.filter((sc) => sc.person_id !== id),
        }))
      },

      getPerson: (id) => get().persons.find((p) => p.id === id),

      listPersons: () => {
        const persons = [...get().persons]
        return persons.sort((a, b) => {
          const at = a.last_contact_at ? new Date(a.last_contact_at).getTime() : 0
          const bt = b.last_contact_at ? new Date(b.last_contact_at).getTime() : 0
          return at - bt
        })
      },

      createTag: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return ""
        const existing = get().tags.find((t) => t.name === trimmed)
        if (existing) return existing.id
        const tag: GuestTag = {
          id: uid(),
          name: trimmed,
          color: null,
          created_at: nowIso(),
        }
        set((s) => ({ tags: [...s.tags, tag] }))
        return tag.id
      },

      listTags: () => get().tags,

      getTagsForPerson: (personId) => {
        const ids = new Set(
          get()
            .personTags.filter((pt) => pt.person_id === personId)
            .map((pt) => pt.tag_id),
        )
        return get().tags.filter((t) => ids.has(t.id))
      },

      attachTag: (personId, tagId) => {
        if (
          get().personTags.some(
            (pt) => pt.person_id === personId && pt.tag_id === tagId,
          )
        )
          return
        set((s) => ({
          personTags: [
            ...s.personTags,
            { person_id: personId, tag_id: tagId, created_at: nowIso() },
          ],
        }))
      },

      detachTag: (personId, tagId) => {
        set((s) => ({
          personTags: s.personTags.filter(
            (pt) => !(pt.person_id === personId && pt.tag_id === tagId),
          ),
        }))
      },

      logContact: (input) => {
        const id = uid()
        const created_at = nowIso()
        const log: GuestContactLog = { id, created_at, ...input }
        set((s) => {
          const persons = s.persons.map((p) =>
            p.id === input.person_id &&
            (!p.last_contact_at ||
              new Date(p.last_contact_at).getTime() <
                new Date(input.occurred_at).getTime())
              ? { ...p, last_contact_at: input.occurred_at, updated_at: created_at }
              : p,
          )
          return { contacts: [log, ...s.contacts], persons }
        })
        return id
      },

      listContactsForPerson: (personId) =>
        get()
          .contacts.filter((c) => c.person_id === personId)
          .sort(
            (a, b) =>
              new Date(b.occurred_at).getTime() -
              new Date(a.occurred_at).getTime(),
          ),

      createReminder: (input) => {
        const now = nowIso()
        const id = uid()
        const reminder: GuestReminder = {
          id,
          status: input.status ?? "active",
          completed_at: null,
          created_at: now,
          updated_at: now,
          ...input,
        }
        set((s) => ({ reminders: [reminder, ...s.reminders] }))
        return id
      },

      completeReminder: (id) => {
        const now = nowIso()
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? { ...r, status: "done", completed_at: now, updated_at: now }
              : r,
          ),
        }))
      },

      snoozeReminder: (id, scheduled_at) => {
        const now = nowIso()
        set((s) => ({
          reminders: s.reminders.map((r) =>
            r.id === id
              ? { ...r, scheduled_at, status: "snoozed", updated_at: now }
              : r,
          ),
        }))
      },

      listReminders: () =>
        [...get().reminders].sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime(),
        ),

      upcomingReminderForPerson: (personId) => {
        const now = Date.now()
        return get()
          .reminders.filter(
            (r) => r.person_id === personId && r.status !== "done",
          )
          .sort(
            (a, b) =>
              new Date(a.scheduled_at).getTime() -
              new Date(b.scheduled_at).getTime(),
          )
          .find((r) => new Date(r.scheduled_at).getTime() >= now - 86_400_000)
      },

      addNote: (personId, body) => {
        const now = nowIso()
        const id = uid()
        const note: GuestNote = {
          id,
          person_id: personId,
          body,
          pinned: false,
          created_at: now,
          updated_at: now,
        }
        set((s) => ({ notes: [note, ...s.notes] }))
        return id
      },

      updateNote: (id, body) => {
        const now = nowIso()
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, body, updated_at: now } : n,
          ),
        }))
      },

      deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
      },

      listNotesForPerson: (personId) =>
        get()
          .notes.filter((n) => n.person_id === personId)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          ),

      setScore: (score) => {
        set((s) => ({
          scores: [
            ...s.scores.filter((sc) => sc.person_id !== score.person_id),
            score,
          ],
        }))
      },

      getScore: (personId) =>
        get().scores.find((sc) => sc.person_id === personId),

      getSettings: () => get().settings,

      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }))
      },

      // ===== 명함 =====
      setBusinessCard: (personId, dataUrl) => {
        const now = nowIso()
        set((s) => ({
          persons: s.persons.map((p) =>
            p.id === personId
              ? { ...p, business_card_url: dataUrl, updated_at: now }
              : p,
          ),
        }))
      },
      clearBusinessCard: (personId) => {
        const now = nowIso()
        set((s) => ({
          persons: s.persons.map((p) =>
            p.id === personId
              ? { ...p, business_card_url: null, updated_at: now }
              : p,
          ),
        }))
      },

      // ===== events / gifts / loans =====
      addEvent: (input) => {
        const id = uid()
        const event: GuestEvent = { id, created_at: nowIso(), ...input }
        set((s) => ({ events: [event, ...s.events] }))
        return id
      },
      updateEvent: (id, patch) => {
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }))
      },
      deleteEvent: (id) => {
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          // 연결된 선물의 linked_event_id 비우기
          gifts: s.gifts.map((g) =>
            g.linked_event_id === id ? { ...g, linked_event_id: null } : g,
          ),
        }))
      },

      addGift: (input) => {
        const id = uid()
        const gift: GuestGift = { id, created_at: nowIso(), ...input }
        set((s) => ({ gifts: [gift, ...s.gifts] }))
        return id
      },
      updateGift: (id, patch) => {
        set((s) => ({
          gifts: s.gifts.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }))
      },
      deleteGift: (id) => {
        set((s) => ({ gifts: s.gifts.filter((g) => g.id !== id) }))
      },

      addLoan: (input) => {
        const id = uid()
        const loan: GuestLoan = {
          id,
          created_at: nowIso(),
          returned_at: input.returned_at ?? null,
          ...input,
        }
        set((s) => ({ loans: [loan, ...s.loans] }))
        return id
      },
      updateLoan: (id, patch) => {
        set((s) => ({
          loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }))
      },
      markLoanReturned: (id, returnedAt) => {
        const ts = returnedAt ?? nowIso()
        set((s) => ({
          loans: s.loans.map((l) =>
            l.id === id ? { ...l, returned_at: ts } : l,
          ),
        }))
      },
      deleteLoan: (id) => {
        set((s) => ({ loans: s.loans.filter((l) => l.id !== id) }))
      },

      exportJson: () => {
        const s = get()
        return JSON.stringify(
          {
            persons: s.persons,
            tags: s.tags,
            personTags: s.personTags,
            contacts: s.contacts,
            reminders: s.reminders,
            notes: s.notes,
            events: s.events,
            gifts: s.gifts,
            loans: s.loans,
            scores: s.scores,
            settings: s.settings,
            exportedAt: nowIso(),
            version: 3,
          },
          null,
          2,
        )
      },
    }),
    {
      name: GUEST_STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          }
        }
        return localStorage
      }),
      version: 7,
      // v1 → v2: kakao_id → kakao_nickname.
      // v2 → v3: events/gifts/loans 빈 배열 보장.
      // v3 → v4: gifts에 notified_at 필드 추가.
      // v4 → v5: persons에 business_card_url 필드 추가.
      // v5 → v6: persons에 instagram_handle, contacts에 custom_channel 추가.
      // v6 → v7: persons에 nickname 필드 추가.
      migrate: (persisted: unknown, fromVersion: number) => {
        if (!persisted || typeof persisted !== "object") return persisted
        const state = persisted as {
          persons?: unknown[]
          events?: unknown[]
          gifts?: unknown[]
          loans?: unknown[]
          contacts?: unknown[]
        }
        if (fromVersion < 2 && Array.isArray(state.persons)) {
          state.persons = state.persons.map((p) => {
            if (!p || typeof p !== "object") return p
            const person = p as Record<string, unknown>
            if ("kakao_id" in person && !("kakao_nickname" in person)) {
              person.kakao_nickname = person.kakao_id ?? null
              delete person.kakao_id
            }
            return person
          })
        }
        if (fromVersion < 3) {
          if (!Array.isArray(state.events)) state.events = []
          if (!Array.isArray(state.gifts)) state.gifts = []
          if (!Array.isArray(state.loans)) state.loans = []
        }
        if (fromVersion < 4 && Array.isArray(state.gifts)) {
          state.gifts = state.gifts.map((g) => {
            if (!g || typeof g !== "object") return g
            const gift = g as Record<string, unknown>
            if (!("notified_at" in gift)) gift.notified_at = null
            return gift
          })
        }
        if (fromVersion < 5 && Array.isArray(state.persons)) {
          state.persons = state.persons.map((p) => {
            if (!p || typeof p !== "object") return p
            const person = p as Record<string, unknown>
            if (!("business_card_url" in person)) person.business_card_url = null
            return person
          })
        }
        if (fromVersion < 6) {
          if (Array.isArray(state.persons)) {
            state.persons = state.persons.map((p) => {
              if (!p || typeof p !== "object") return p
              const person = p as Record<string, unknown>
              if (!("instagram_handle" in person)) person.instagram_handle = null
              return person
            })
          }
          if (Array.isArray(state.contacts)) {
            state.contacts = state.contacts.map((c) => {
              if (!c || typeof c !== "object") return c
              const contact = c as Record<string, unknown>
              if (!("custom_channel" in contact)) contact.custom_channel = null
              return contact
            })
          }
        }
        if (fromVersion < 7 && Array.isArray(state.persons)) {
          state.persons = state.persons.map((p) => {
            if (!p || typeof p !== "object") return p
            const person = p as Record<string, unknown>
            if (!("nickname" in person)) person.nickname = null
            return person
          })
        }
        return persisted
      },
    },
  ),
)
