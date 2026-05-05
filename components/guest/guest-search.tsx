"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Input } from "@/components/ui/input"
import { PersonCard } from "@/components/relationship/person-card"
import { TagChip } from "@/components/relationship/tag-chip"
import { EmptyState } from "@/components/common/empty-state"
import { useGuestStore } from "@/lib/guest/store"
import { useGuestHydrated } from "@/lib/guest/use-hydrated"
import { GuestLoading } from "@/components/guest/guest-loading"
import { colorIndexForTag } from "@/lib/format/tag"
import type { RelationshipType } from "@/lib/supabase/types"

const TYPE_FILTERS: { value: RelationshipType; label: string }[] = [
  { value: "family", label: "가족" },
  { value: "friend", label: "친구" },
  { value: "colleague", label: "직장" },
  { value: "client", label: "거래처" },
  { value: "acquaintance", label: "지인" },
  { value: "etc", label: "기타" },
]

export function GuestSearch() {
  const hydrated = useGuestHydrated()
  const searchParams = useSearchParams()
  const router = useRouter()
  const persons = useGuestStore((s) => s.persons)
  const tags = useGuestStore((s) => s.tags)
  const personTags = useGuestStore((s) => s.personTags)
  const scores = useGuestStore((s) => s.scores)

  const initialQ = searchParams.get("q") ?? ""
  const [q, setQ] = React.useState(initialQ)
  const [activeTypes, setActiveTypes] = React.useState<RelationshipType[]>([])
  const [activeTagIds, setActiveTagIds] = React.useState<string[]>([])

  const tagsForPerson = React.useCallback(
    (personId: string) =>
      personTags
        .filter((pt) => pt.person_id === personId)
        .map((pt) => pt.tag_id),
    [personTags],
  )
  const tagIndex = React.useMemo(
    () => new Map(tags.map((t) => [t.id, t])),
    [tags],
  )
  const scoreByPerson = React.useMemo(
    () => new Map(scores.map((s) => [s.person_id, s])),
    [scores],
  )

  const results = React.useMemo(() => {
    const normalized = q.trim().toLowerCase()
    return persons.filter((p) => {
      if (normalized && !p.name.toLowerCase().includes(normalized)) return false
      if (activeTypes.length > 0 && !activeTypes.includes(p.relationship_type))
        return false
      if (activeTagIds.length > 0) {
        const myTags = new Set(tagsForPerson(p.id))
        if (!activeTagIds.some((id) => myTags.has(id))) return false
      }
      return true
    })
  }, [persons, q, activeTypes, activeTagIds, tagsForPerson])

  const hasFilters =
    q.trim().length > 0 || activeTypes.length > 0 || activeTagIds.length > 0

  const toggleType = (t: RelationshipType) => {
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }
  const toggleTag = (id: string) => {
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  if (!hydrated) {
    return <GuestLoading title="검색" />
  }

  return (
    <AppShell header={<AppHeader title="검색" />}>
      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const url = new URL(window.location.href)
            if (q) url.searchParams.set("q", q)
            else url.searchParams.delete("q")
            router.replace(url.pathname + url.search)
          }}
          role="search"
        >
          <Input
            type="search"
            placeholder="이름으로 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleType(t.value)}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                activeTypes.includes(t.value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <TagChip
                key={t.id}
                tag={{
                  id: t.id,
                  name: t.name,
                  colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                }}
                size="sm"
                variant={activeTagIds.includes(t.id) ? "selected" : "default"}
                onClick={() => toggleTag(t.id)}
              />
            ))}
          </div>
        ) : null}

        {results.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon="🔍"
              title="검색 결과가 없어요"
              description="다른 키워드나 필터로 시도해보세요."
            />
          ) : (
            <EmptyState
              icon="👋"
              title="아직 등록된 인물이 없어요"
              description="새 인맥을 추가해보세요."
              action={{ label: "+ 인맥 추가", href: "/persons/new" }}
            />
          )
        ) : (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              결과 {results.length}건
            </p>
            {results.map((p) => {
              const tagIds = tagsForPerson(p.id)
              const personTagList = tagIds
                .map((id) => tagIndex.get(id))
                .filter((t): t is NonNullable<typeof t> => Boolean(t))
              const score = scoreByPerson.get(p.id)
              return (
                <PersonCard
                  key={p.id}
                  href={`/persons/${p.id}`}
                  person={{
                    id: p.id,
                    name: p.name,
                    photoUrl: p.photo_url,
                    gender: p.gender,
                    profileIndex: p.profile_index,
                    avatarBg: p.avatar_bg,
                    relationshipType: p.relationship_type,
                    mbti: p.mbti,
                    lastContactAt: p.last_contact_at,
                    lastContactChannel: null,
                    score: score?.score ?? null,
                    tags: personTagList.map((t) => ({
                      id: t.id,
                      name: t.name,
                      colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                    })),
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
