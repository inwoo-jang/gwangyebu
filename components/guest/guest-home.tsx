"use client"

import * as React from "react"
import Link from "next/link"
import { differenceInDays } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { PersonCard } from "@/components/relationship/person-card"
import { ReminderItem } from "@/components/relationship/reminder-item"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { GuestBadge } from "@/components/guest/guest-badge"
import { GuestBootstrap } from "@/components/guest/guest-bootstrap"
import { useGuestStore } from "@/lib/guest/store"
import { useGuestHydrated } from "@/lib/guest/use-hydrated"
import { GuestLoading } from "@/components/guest/guest-loading"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { colorIndexForTag } from "@/lib/format/tag"
import { cn } from "@/lib/utils"
import {
  describeDaysUntil,
  findUpcomingBirthdays,
} from "@/lib/birthday"
import {
  Cake,
  Search,
  X,
  Sparkles,
  Tag as TagIcon,
  Loader2,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react"
import { GuestTagManageButton } from "@/components/guest/guest-tag-manage-button"
import { Input } from "@/components/ui/input"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TagChip } from "@/components/relationship/tag-chip"
import { AnalysisGuideDialog } from "@/components/relationship/analysis-guide-dialog"
import { analyzePerson } from "@/lib/guest/analyze"
import { useUiStore } from "@/lib/guest/ui-store"
import { toast } from "sonner"
import { fullDateKo } from "@/lib/format/date"
import type { Reminder } from "@/lib/supabase/types"
import type { GuestReminder } from "@/lib/guest/types"

type SortKey = "alpha" | "scoreDesc" | "scoreAsc"

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "alpha", label: "가나다순" },
  { id: "scoreDesc", label: "친밀도 높은순" },
  { id: "scoreAsc", label: "친밀도 낮은순" },
]

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

function toReminderForView(
  r: GuestReminder,
  personName: string | undefined,
): Reminder & { person_name: string } {
  return {
    ...r,
    user_id: "guest",
    person_name: personName ?? "인물",
  }
}

export function GuestHome() {
  const hydrated = useGuestHydrated()
  const persons = useGuestStore((s) => s.persons)
  const reminders = useGuestStore((s) => s.reminders)
  const personTags = useGuestStore((s) => s.personTags)
  const tags = useGuestStore((s) => s.tags)
  const scores = useGuestStore((s) => s.scores)
  const settings = useGuestStore((s) => s.settings)
  const gifts = useGuestStore((s) => s.gifts)

  const upcomingBirthdays = React.useMemo(
    () => findUpcomingBirthdays(persons, gifts, { withinDays: 30 }),
    [persons, gifts],
  )
  const completeReminder = useGuestStore((s) => s.completeReminder)
  const snoozeReminder = useGuestStore((s) => s.snoozeReminder)
  const setScore = useGuestStore((s) => s.setScore)
  const allContacts = useGuestStore((s) => s.contacts)
  const allNotes = useGuestStore((s) => s.notes)
  const attachTag = useGuestStore((s) => s.attachTag)
  const createTagAction = useGuestStore((s) => s.createTag)

  /** 단일 분석 진행 중 personId 셋 */
  const [analyzingIds, setAnalyzingIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  /** 다중선택 모드 */
  const [selectMode, setSelectMode] = React.useState(false)
  const setHideFab = useUiStore((s) => s.setHideFab)
  React.useEffect(() => {
    setHideFab(selectMode)
    return () => setHideFab(false)
  }, [selectMode, setHideFab])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [bulkBusy, setBulkBusy] = React.useState(false)
  const [analysisGuideOpen, setAnalysisGuideOpen] = React.useState(false)
  const [tagDialogOpen, setTagDialogOpen] = React.useState(false)
  const [tagDialogSelected, setTagDialogSelected] = React.useState<string[]>([])
  const [newDialogTag, setNewDialogTag] = React.useState("")

  const runAnalyzeFor = (id: string) => {
    const p = persons.find((x) => x.id === id)
    if (!p) return
    setAnalyzingIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    // 룰 기반은 즉시지만 UX상 짧은 지연으로 spinner 노출
    setTimeout(() => {
      const personContacts = allContacts.filter((c) => c.person_id === id)
      const personNotes = allNotes.filter((n) => n.person_id === id)
      setScore(
        analyzePerson({ person: p, contacts: personContacts, notes: personNotes }),
      )
      setAnalyzingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 250)
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const bulkAnalyze = async () => {
    if (selectedIds.size === 0) return
    setBulkBusy(true)
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      const p = persons.find((x) => x.id === id)
      if (!p) continue
      const personContacts = allContacts.filter((c) => c.person_id === id)
      const personNotes = allNotes.filter((n) => n.person_id === id)
      setScore(
        analyzePerson({ person: p, contacts: personContacts, notes: personNotes }),
      )
    }
    setBulkBusy(false)
    toast.success(`${ids.length}명 관계 분석 완료`)
    exitSelectMode()
  }

  const openTagDialog = () => {
    if (selectedIds.size === 0) return
    setTagDialogSelected([])
    setNewDialogTag("")
    setTagDialogOpen(true)
  }

  const applyBulkTags = () => {
    const tagIdsToApply = [...tagDialogSelected]
    const newName = newDialogTag.trim()
    if (newName) {
      const newId = createTagAction(newName)
      if (newId) tagIdsToApply.push(newId)
    }
    if (tagIdsToApply.length === 0 || selectedIds.size === 0) {
      setTagDialogOpen(false)
      return
    }
    for (const personId of selectedIds) {
      for (const tagId of tagIdsToApply) {
        attachTag(personId, tagId)
      }
    }
    toast.success(`${selectedIds.size}명에 태그 적용 완료`)
    setTagDialogOpen(false)
    exitSelectMode()
  }

  const [query, setQuery] = React.useState<string>("")
  const [showAll, setShowAll] = React.useState<boolean>(false)
  const [sortKey, setSortKey] = React.useState<SortKey>("alpha")
  const HOME_LIMIT = 30

  const scoreByPerson = React.useMemo(
    () => new Map(scores.map((s) => [s.person_id, s])),
    [scores],
  )

  const sortedPersons = React.useMemo(() => {
    const arr = [...persons]
    const scoreOf = (id: string) => scoreByPerson.get(id)?.score ?? null
    switch (sortKey) {
      case "scoreDesc":
      case "scoreAsc": {
        const dir = sortKey === "scoreDesc" ? -1 : 1
        return arr.sort((a, b) => {
          const sa = scoreOf(a.id)
          const sb = scoreOf(b.id)
          // 미측정은 항상 마지막
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons, sortKey, scoreByPerson])

  const [activeTagIds, setActiveTagIds] = React.useState<string[]>([])

  // 사용된 태그만 필터 칩에 노출 (인물에 매핑되지 않은 태그는 숨김)
  const usedTags = React.useMemo(() => {
    const ids = new Set(personTags.map((pt) => pt.tag_id))
    return tags.filter((t) => ids.has(t.id))
  }, [tags, personTags])

  // 인물 → 태그 ID 집합 인덱스 (검색 필터에서 빠르게 사용)
  const tagIdsByPerson = React.useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const pt of personTags) {
      const set = map.get(pt.person_id) ?? new Set<string>()
      set.add(pt.tag_id)
      map.set(pt.person_id, set)
    }
    return map
  }, [personTags])

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
        const personTagSet = tagIdsByPerson.get(p.id)
        if (!personTagSet) return false
        // OR 조건: 선택된 태그 중 하나라도 매칭
        if (!activeTagIds.some((tid) => personTagSet.has(tid))) return false
      }
      return true
    })
  }, [sortedPersons, query, activeTagIds, tagIdsByPerson])

  const visiblePersons = React.useMemo(() => {
    if (query.trim() || activeTagIds.length > 0 || showAll)
      return filteredPersons
    return filteredPersons.slice(0, HOME_LIMIT)
  }, [filteredPersons, query, activeTagIds, showAll])

  const hiddenCount = filteredPersons.length - visiblePersons.length
  const isSearching = query.trim().length > 0
  const hasFilter = isSearching || activeTagIds.length > 0

  const upcoming = React.useMemo(() => {
    return [...reminders]
      .filter((r) => r.status !== "done")
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      )
      .slice(0, 3)
  }, [reminders])

  const tagIndex = React.useMemo(
    () => new Map(tags.map((t) => [t.id, t])),
    [tags],
  )
  const personById = React.useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons],
  )

  const greeting = settings.display_name
    ? `${settings.display_name}님,`
    : "안녕하세요,"

  if (!hydrated) {
    return (
      <>
        <GuestBootstrap />
        <GuestLoading title="관계부" />
      </>
    )
  }

  return (
    <>
      <GuestBootstrap />
      <AppShell
        header={
          <AppHeader
            brand
            actions={
              <div className="flex items-center gap-2">
                <GuestBadge />
              </div>
            }
          />
        }
      >
        <section className="mb-4">
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            오늘은 누구에게 안부 전해볼까요?
          </h2>
        </section>

        {!isSearching ? (
        <>
        <section className="mb-6">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/40 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-sm font-semibold">게스트 모드 안내</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              데이터는 이 브라우저(localStorage)에만 저장돼요. 샘플 인물 3명이
              이미 추가되어 있으니, 자유롭게 둘러보세요.
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/persons/new">+ 인맥 추가</Link>
              </Button>
            </div>
          </div>
        </section>

        {upcomingBirthdays.length > 0 ? (
          <CollapsibleSection
            icon={<Cake className="h-4 w-4 text-primary" />}
            title="다가오는 생일"
            meta={`${upcomingBirthdays.length}명`}
            defaultOpen
            className="mb-6 border-primary/30"
          >
            <ul className="space-y-2">
              {upcomingBirthdays.slice(0, 3).map((u) => (
                <li
                  key={u.person.id}
                  className="flex items-center gap-3 rounded-lg bg-accent/20 p-2"
                >
                  <ProfileAvatar
                    gender={u.person.gender}
                    profileIndex={u.person.profile_index}
                    bgId={u.person.avatar_bg}
                    name={u.person.name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/persons/${u.person.id}`}
                      className="text-sm font-semibold hover:underline truncate"
                    >
                      {u.person.name}
                      {u.person.nickname ? (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({u.person.nickname})
                        </span>
                      ) : null}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="text-primary font-medium">
                        {describeDaysUntil(u.daysUntil)}
                      </span>{" "}
                      · {fullDateKo(u.nextBirthday)}
                      {u.hasGiftHistory ? (
                        <>
                          <span className="mx-1">·</span>
                          🎁 주고받은 사람
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
              {upcomingBirthdays.length > 3 ? (
                <li className="text-center text-[11px] text-muted-foreground">
                  +{upcomingBirthdays.length - 3}명 더{" "}
                  <Link href="/records" className="text-primary hover:underline">
                    선물 탭에서 보기
                  </Link>
                </li>
              ) : null}
            </ul>
          </CollapsibleSection>
        ) : null}

        <CollapsibleSection
          icon="🔔"
          title="다가오는 리마인더"
          meta={
            upcoming.length > 0 ? (
              <Link
                href="/reminders"
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                모두 보기
              </Link>
            ) : (
              `${upcoming.length}건`
            )
          }
          defaultOpen
          className="mb-6"
        >
          {upcoming.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              예정된 리마인더가 없어요.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((r) => (
                <ReminderItem
                  key={r.id}
                  reminder={toReminderForView(
                    r,
                    personById.get(r.person_id)?.name,
                  )}
                  onComplete={() => completeReminder(r.id)}
                  onSnooze={() =>
                    snoozeReminder(
                      r.id,
                      new Date(Date.now() + 86_400_000).toISOString(),
                    )
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleSection>
        </>
        ) : null}

        {/* 검색바 — 인맥 리스트 바로 위 (카톡 친구목록 스타일) */}
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
                <GuestTagManageButton
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

          {/* 정렬 옵션 (선택 모드 아닐 때만) */}
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

          {/* 태그 필터 칩 (사용된 태그만, 가로 스크롤) */}
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
                        : { backgroundColor: `hsl(var(--tag-${colorIndex}) / 0.18)` }
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
              {/* 컬럼 헤더 — 카드의 점수 영역과 동일 레이아웃으로 정렬 */}
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
                {visiblePersons.map((p) => {
                  const personTagIds = personTags
                    .filter((pt) => pt.person_id === p.id)
                    .map((pt) => pt.tag_id)
                  const personTagList = personTagIds
                    .map((id) => tagIndex.get(id))
                    .filter((t): t is NonNullable<typeof t> => Boolean(t))
                  const score = scoreByPerson.get(p.id)
                  return (
                    <PersonCard
                      key={p.id}
                      href={selectMode ? undefined : `/persons/${p.id}`}
                      variant={variantFor({
                        last_contact_at: p.last_contact_at,
                        score: score?.score,
                      })}
                      onScoreClick={() => runAnalyzeFor(p.id)}
                      scoreLoading={analyzingIds.has(p.id)}
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
                        lastContactChannel: null,
                        score: score?.score ?? null,
                        tags: personTagList.map((t) => ({
                          id: t.id,
                          name: t.name,
                          colorIndex: colorIndexForTag({
                            id: t.id,
                            name: t.name,
                          }),
                        })),
                      }}
                    />
                  )
                })}
              </div>
              {/* 다중선택 액션바 가림 방지: 액션바(약 56px) + 여백 + 안전영역 만큼 추가 패딩 */}
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

        {/* 다중선택 시 하단 sticky 액션바 (BottomNav 위에 떠 있음) */}
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
      </AppShell>

      <AnalysisGuideDialog
        open={analysisGuideOpen}
        onOpenChange={setAnalysisGuideOpen}
      />

      {/* 일괄 태그 추가 다이얼로그 */}
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
                tagDialogSelected.length === 0 && !newDialogTag.trim()
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
