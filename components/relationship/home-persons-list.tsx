"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  X,
  Sparkles,
  Tag as TagIcon,
  Loader2,
  HelpCircle,
} from "lucide-react"
import { differenceInDays } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/common/empty-state"
import { PersonCard } from "@/components/relationship/person-card"
import { TagChip } from "@/components/relationship/tag-chip"
import { AnalysisGuideDialog } from "@/components/relationship/analysis-guide-dialog"
import { AuthTagManageButton } from "@/components/relationship/auth-tag-manage-button"
import { Settings as SettingsIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { addTag, createTag } from "@/lib/actions/tags"
import { colorIndexForTag } from "@/lib/format/tag"
import { cn } from "@/lib/utils"
import type { PersonListItem } from "@/lib/queries/persons"
import type { Tag } from "@/lib/supabase/types"

type SortKey = "alpha" | "scoreDesc" | "scoreAsc"

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "alpha", label: "가나다순" },
  { id: "scoreDesc", label: "친밀도 높은순" },
  { id: "scoreAsc", label: "친밀도 낮은순" },
]

const HOME_LIMIT = 30

function variantFor(person: {
  last_contact_at: string | null
  score?: number | null
}): "default" | "urgent" | "warning" {
  if (!person.last_contact_at) return "default"
  const days = differenceInDays(new Date(), new Date(person.last_contact_at))
  const score = person.score ?? null
  if (days > 30 && score != null && score < 40) return "urgent"
  if (days > 60) return "warning"
  return "default"
}

interface HomePersonsListProps {
  persons: PersonListItem[]
  allTags: Tag[]
}

export function HomePersonsList({ persons, allTags }: HomePersonsListProps) {
  const router = useRouter()
  const [tags, setTags] = React.useState<Tag[]>(allTags)
  const [query, setQuery] = React.useState("")
  const [sortKey, setSortKey] = React.useState<SortKey>("alpha")
  const [activeTagIds, setActiveTagIds] = React.useState<string[]>([])
  const [showAll, setShowAll] = React.useState(false)
  const [selectMode, setSelectMode] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [bulkBusy, setBulkBusy] = React.useState(false)
  const [analysisGuideOpen, setAnalysisGuideOpen] = React.useState(false)
  const [tagDialogOpen, setTagDialogOpen] = React.useState(false)
  const [tagDialogSelected, setTagDialogSelected] = React.useState<string[]>([])
  const [newDialogTag, setNewDialogTag] = React.useState("")

  const sortedPersons = React.useMemo(() => {
    const arr = [...persons]
    switch (sortKey) {
      case "scoreDesc":
      case "scoreAsc": {
        const dir = sortKey === "scoreDesc" ? -1 : 1
        return arr.sort((a, b) => {
          const sa = a.score ?? null
          const sb = b.score ?? null
          if (sa == null && sb == null) return 0
          if (sa == null) return 1
          if (sb == null) return -1
          return (sa - sb) * dir
        })
      }
      case "alpha":
      default:
        return arr.sort((a, b) => a.name.localeCompare(b.name, "ko"))
    }
  }, [persons, sortKey])

  // 사용된 태그만 (인물에 매핑된 것만)
  const usedTagIds = React.useMemo(() => {
    const s = new Set<string>()
    for (const p of persons) for (const t of p.tags) s.add(t.id)
    return s
  }, [persons])
  const usedTags = React.useMemo(
    () => tags.filter((t) => usedTagIds.has(t.id)),
    [tags, usedTagIds],
  )

  const usageCountByTag = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const p of persons) {
      for (const t of p.tags) {
        map.set(t.id, (map.get(t.id) ?? 0) + 1)
      }
    }
    return map
  }, [persons])

  const tagIdsByPerson = React.useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const p of persons) {
      map.set(p.id, new Set(p.tags.map((t) => t.id)))
    }
    return map
  }, [persons])

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTag = (id: string) =>
    setActiveTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const filteredPersons = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortedPersons.filter((p) => {
      if (q) {
        const matched =
          p.name.toLowerCase().includes(q) ||
          (p.nickname?.toLowerCase().includes(q) ?? false) ||
          (p.kakao_nickname?.toLowerCase().includes(q) ?? false) ||
          (p.instagram_handle?.toLowerCase().includes(q) ?? false)
        if (!matched) return false
      }
      if (activeTagIds.length > 0) {
        const set = tagIdsByPerson.get(p.id)
        if (!set) return false
        if (!activeTagIds.some((tid) => set.has(tid))) return false
      }
      return true
    })
  }, [sortedPersons, query, activeTagIds, tagIdsByPerson])

  const isSearching = query.trim().length > 0
  const hasFilter = isSearching || activeTagIds.length > 0
  const visiblePersons =
    isSearching || activeTagIds.length > 0 || showAll
      ? filteredPersons
      : filteredPersons.slice(0, HOME_LIMIT)
  const hiddenCount = filteredPersons.length - visiblePersons.length

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const bulkAnalyze = async () => {
    if (selectedIds.size === 0) return
    setBulkBusy(true)
    const ids = Array.from(selectedIds)
    let ok = 0
    for (const id of ids) {
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId: id }),
        })
        if (res.ok) ok += 1
      } catch {
        // skip
      }
    }
    setBulkBusy(false)
    if (ok > 0) toast.success(`${ok}명 관계 분석 완료`)
    else toast.error("분석 요청에 실패했어요")
    exitSelectMode()
    router.refresh()
  }

  const openTagDialog = () => {
    if (selectedIds.size === 0) return
    setTagDialogSelected([])
    setNewDialogTag("")
    setTagDialogOpen(true)
  }

  const applyBulkTags = async () => {
    const tagIdsToApply = [...tagDialogSelected]
    const newName = newDialogTag.trim()
    if (newName) {
      const res = await createTag({ name: newName })
      if (res.ok) {
        setTags((prev) => [...prev, res.data])
        tagIdsToApply.push(res.data.id)
      } else {
        toast.error(res.error.message)
      }
    }
    if (tagIdsToApply.length === 0 || selectedIds.size === 0) {
      setTagDialogOpen(false)
      return
    }
    setBulkBusy(true)
    let ok = 0
    for (const personId of selectedIds) {
      for (const tagId of tagIdsToApply) {
        const res = await addTag({ person_id: personId, tag_id: tagId })
        if (res.ok) ok += 1
      }
    }
    setBulkBusy(false)
    if (ok > 0) toast.success(`${selectedIds.size}명에 태그 적용 완료`)
    setTagDialogOpen(false)
    exitSelectMode()
    router.refresh()
  }

  return (
    <>
      {/* 검색바 */}
      <section className="mb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="이름·닉네임·카톡·인스타로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
            aria-label="인맥 검색"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색 지우기"
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md hover:bg-accent"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {selectMode
              ? `${selectedIds.size}명 선택됨`
              : hasFilter
                ? `검색 결과 (${filteredPersons.length}명)`
                : `인맥 (${sortedPersons.length}명)`}
          </h2>
          <div className="flex items-center gap-2">
            {!selectMode && activeTagIds.length > 0 ? (
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:underline"
                onClick={() => setActiveTagIds([])}
              >
                태그 필터 초기화
              </button>
            ) : null}
            {!selectMode ? (
              <AuthTagManageButton
                tags={tags}
                usageCount={usageCountByTag}
                trigger={
                  <button
                    type="button"
                    aria-label="태그 관리"
                    className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <SettingsIcon className="h-3 w-3" />
                    태그 관리
                  </button>
                }
              />
            ) : null}
            <button
              type="button"
              className={cn(
                "text-[11px] hover:underline",
                selectMode ? "text-destructive" : "text-primary",
              )}
              onClick={() => {
                if (selectMode) exitSelectMode()
                else setSelectMode(true)
              }}
            >
              {selectMode ? "선택 취소" : "선택"}
            </button>
          </div>
        </div>

        {!selectMode ? (
          <div className="mb-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSortKey(o.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 h-7 text-xs tap transition-colors",
                  sortKey === o.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-accent/30",
                )}
                aria-pressed={sortKey === o.id}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : null}

        {usedTags.length > 0 ? (
          <div className="mb-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {usedTags.map((t) => {
              const active = activeTagIds.includes(t.id)
              const colorIndex = colorIndexForTag({ id: t.id, name: t.name })
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 h-7 text-xs tap transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground/80 hover:bg-accent/30",
                  )}
                  style={
                    active
                      ? undefined
                      : {
                          backgroundColor: `hsl(var(--tag-${colorIndex}) / 0.18)`,
                        }
                  }
                  aria-pressed={active}
                >
                  #{t.name}
                </button>
              )
            })}
          </div>
        ) : null}

        {sortedPersons.length === 0 ? (
          <EmptyState
            icon="👋"
            title="첫 사람을 추가해볼까요?"
            description="이름만 있어도 충분해요."
            action={{ label: "+ 인맥 추가", href: "/persons/new" }}
          />
        ) : hasFilter && visiblePersons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            일치하는 인맥이 없어요. 다른 키워드/태그로 시도해보세요.
          </div>
        ) : (
          <>
            {!selectMode ? (
              <div className="mb-1 flex items-center gap-3 px-3">
                <div className="h-0 w-9 shrink-0" aria-hidden />
                <div className="flex-1" aria-hidden />
                <button
                  type="button"
                  onClick={() => setAnalysisGuideOpen(true)}
                  className="w-14 shrink-0 inline-flex items-center justify-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                  aria-label="관계 분석 기준 보기"
                >
                  친밀도
                  <HelpCircle className="h-3 w-3" />
                </button>
              </div>
            ) : null}
            <div className="space-y-1.5">
              {visiblePersons.map((p) => (
                <PersonCard
                  key={p.id}
                  href={selectMode ? undefined : `/persons/${p.id}`}
                  variant={variantFor({
                    last_contact_at: p.last_contact_at,
                    score: p.score,
                  })}
                  selectMode={selectMode}
                  selected={selectedIds.has(p.id)}
                  onToggleSelect={() => toggleSelected(p.id)}
                  person={{
                    id: p.id,
                    name: p.name,
                    nickname: p.nickname,
                    photoUrl: p.photo_url,
                    gender: p.gender,
                    profileIndex: p.profile_index,
                    avatarBg: p.avatar_bg,
                    relationshipType: p.relationship_type,
                    relationshipLabel: p.relationship_label,
                    mbti: p.mbti,
                    lastContactAt: p.last_contact_at,
                    lastContactChannel: p.last_contact_channel,
                    score: p.score ?? null,
                    tags: p.tags.map((t) => ({
                      id: t.id,
                      name: t.name,
                      colorIndex: colorIndexForTag({
                        id: t.id,
                        name: t.name,
                      }),
                    })),
                  }}
                />
              ))}
            </div>
            {selectMode ? <div className="h-24" aria-hidden /> : null}
            {!hasFilter && hiddenCount > 0 ? (
              <Button
                variant="ghost"
                className="mt-3 w-full text-primary"
                onClick={() => setShowAll(true)}
              >
                모두 보기 ({hiddenCount}명 더)
              </Button>
            ) : null}
          </>
        )}
      </section>

      {selectMode ? (
        <div
          className="fixed inset-x-0 z-30 flex items-center gap-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur shadow-soft"
          style={{
            bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <span className="text-sm font-semibold">
            {selectedIds.size}명 선택
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5"
            disabled={selectedIds.size === 0 || bulkBusy}
            onClick={openTagDialog}
          >
            <TagIcon className="h-3.5 w-3.5" />
            태그 추가
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={selectedIds.size === 0 || bulkBusy}
            onClick={bulkAnalyze}
          >
            {bulkBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            관계 분석
          </Button>
        </div>
      ) : null}

      <AnalysisGuideDialog
        open={analysisGuideOpen}
        onOpenChange={setAnalysisGuideOpen}
      />

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>태그 추가</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}명에게 적용할 태그를 고르거나 새로 만들어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  아직 태그가 없어요. 아래에서 새로 만들어 주세요.
                </p>
              ) : (
                tags.map((t) => {
                  const active = tagDialogSelected.includes(t.id)
                  return (
                    <TagChip
                      key={t.id}
                      tag={{
                        id: t.id,
                        name: t.name,
                        colorIndex: colorIndexForTag({
                          id: t.id,
                          name: t.name,
                        }),
                      }}
                      variant={active ? "selected" : "default"}
                      onClick={() =>
                        setTagDialogSelected((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((x) => x !== t.id)
                            : [...prev, t.id],
                        )
                      }
                    />
                  )
                })
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">새 태그 만들기</p>
              <Input
                value={newDialogTag}
                onChange={(e) => setNewDialogTag(e.target.value)}
                placeholder="예: 동아리"
                maxLength={20}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setTagDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={applyBulkTags}
              disabled={
                bulkBusy ||
                (tagDialogSelected.length === 0 && !newDialogTag.trim())
              }
            >
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
