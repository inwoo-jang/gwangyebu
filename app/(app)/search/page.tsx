import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { SearchBar } from "@/components/search/search-bar"
import { FilterChips } from "@/components/search/filter-chips"
import { PersonCard } from "@/components/relationship/person-card"
import { EmptyState } from "@/components/common/empty-state"
import { fetchPersonsForList } from "@/lib/queries/persons"
import { listTags } from "@/lib/actions/tags"
import { colorIndexForTag } from "@/lib/format/tag"
import type { RelationshipType } from "@/lib/supabase/types"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestSearch } from "@/components/guest/guest-search"

export const dynamic = "force-dynamic"
export const metadata = { title: "검색" }

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    types?: string
    tags?: string
  }>
}

const VALID_TYPES: RelationshipType[] = [
  "family",
  "friend",
  "colleague",
  "client",
  "acquaintance",
  "etc",
]

export default async function SearchPage({ searchParams }: SearchPageProps) {
  if (await isGuestMode()) {
    return <GuestSearch />
  }
  const sp = await searchParams
  const q = sp.q?.trim()
  const typeList = (sp.types ?? "")
    .split(",")
    .filter(Boolean)
    .filter((t): t is RelationshipType =>
      (VALID_TYPES as string[]).includes(t),
    )
  const tagIds = (sp.tags ?? "").split(",").filter(Boolean)

  const [persons, tagsRes] = await Promise.all([
    fetchPersonsForList({
      query: q,
      relationship_types: typeList.length > 0 ? typeList : undefined,
      tag_ids: tagIds.length > 0 ? tagIds : undefined,
      limit: 100,
    }),
    listTags(),
  ])

  const tags = tagsRes.ok ? tagsRes.data : []
  const hasFilters =
    Boolean(q) || typeList.length > 0 || tagIds.length > 0

  return (
    <AppShell header={<AppHeader title="검색" />}>
      <div className="space-y-4">
        <SearchBar initial={q} />
        <FilterChips tags={tags} />

        {persons.length === 0 ? (
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
              결과 {persons.length}건
            </p>
            {persons.map((p) => (
              <PersonCard
                key={p.id}
                href={`/persons/${p.id}`}
                person={{
                  id: p.id,
                  name: p.name,
                  photoUrl: p.photo_url,
                  relationshipType: p.relationship_type,
                  mbti: p.mbti,
                  lastContactAt: p.last_contact_at,
                  lastContactChannel: p.last_contact_channel,
                  score: p.score,
                  tags: p.tags.map((t) => ({
                    id: t.id,
                    name: t.name,
                    colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                  })),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
