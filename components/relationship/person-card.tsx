import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Sparkles, Check } from "lucide-react"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { TagChip } from "@/components/relationship/tag-chip"
import { cn } from "@/lib/utils"
import {
  RELATIONSHIP_TYPE_LABEL,
  CONTACT_CHANNEL_LABEL,
} from "@/lib/format/relationship"
import { daysAgoKo } from "@/lib/format/date"
import { bandFor } from "@/lib/format/score"
import type {
  RelationshipType,
  ContactChannel,
} from "@/lib/supabase/types"
import type { Gender } from "@/lib/profile/avatar"

/**
 * 컴팩트 인맥 카드 — 100~1000명 스캔 가능한 밀도(~52px 높이).
 * 2줄 구성: [아바타] 이름 · 관계 · MBTI ─ 점수 / 마지막 연락 · 태그
 */
const cardVariants = cva(
  "group flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card text-card-foreground transition-all duration-150 active:scale-[0.99] hover:bg-accent/30",
  {
    variants: {
      variant: {
        default: "border-border",
        urgent:
          "border-l-4 border-l-destructive border-y-border border-r-border",
        warning:
          "border-l-4 border-l-warning border-y-border border-r-border",
        "ai-attention":
          "border-l-4 border-l-primary border-y-border border-r-border",
        compact: "px-2.5 py-2 border-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface PersonCardData {
  id: string
  name: string
  nickname?: string | null
  photoUrl?: string | null
  gender?: Gender | null
  profileIndex?: number | null
  avatarBg?: number | null
  relationshipType: RelationshipType
  mbti?: string | null
  tags?: { id: string; name: string; colorIndex?: number }[]
  lastContactAt?: string | null
  lastContactChannel?: ContactChannel | null
  score?: number | null
}

interface PersonCardProps extends VariantProps<typeof cardVariants> {
  person: PersonCardData
  href?: string
  className?: string
  /** 제공 시 점수 영역이 클릭 가능한 분석 트리거가 됨 */
  onScoreClick?: () => void
  /** true면 점수 영역에 스피너 표시 */
  scoreLoading?: boolean
  /** 선택 모드: 카드 좌측에 체크박스가 보이고 클릭으로 토글 */
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function PersonCard({
  person,
  variant = "default",
  href,
  className,
  onScoreClick,
  scoreLoading = false,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: PersonCardProps) {
  const relInfo = RELATIONSHIP_TYPE_LABEL[person.relationshipType]
  const channelInfo = person.lastContactChannel
    ? CONTACT_CHANNEL_LABEL[person.lastContactChannel]
    : null
  const score = person.score ?? null
  const band = score != null ? bandFor(score) : null

  // 선택 모드면 카드 전체가 toggle 버튼, 아니면 href Link.
  const Wrapper: React.ElementType = selectMode
    ? "button"
    : href
      ? Link
      : "div"
  const wrapperProps: Record<string, unknown> = selectMode
    ? {
        type: "button",
        onClick: (e: React.MouseEvent) => {
          e.preventDefault()
          onToggleSelect?.()
        },
        "aria-pressed": selected,
      }
    : href
      ? { href }
      : {}

  const lastLine = person.lastContactAt
    ? `${daysAgoKo(person.lastContactAt)}${channelInfo ? ` · ${channelInfo.icon}` : ""}`
    : "기록 없음"

  const hasTags = person.tags && person.tags.length > 0

  return (
    <Wrapper
      className={cn(
        cardVariants({ variant }),
        selectMode ? "w-full cursor-pointer text-left" : "",
        selected ? "ring-2 ring-primary bg-accent/30" : "",
        className,
      )}
      {...wrapperProps}
    >
      {selectMode ? (
        <span
          aria-hidden
          className={cn(
            "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card",
          )}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
      ) : null}
      <ProfileAvatar
        gender={person.gender}
        profileIndex={person.profileIndex}
        bgId={person.avatarBg}
        name={person.name}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        {/* Row 1: 이름 (닉네임) · 관계 · MBTI */}
        <div className="flex items-baseline gap-1.5">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {person.name}
            {person.nickname ? (
              <span className="ml-1 font-normal text-muted-foreground">
                ({person.nickname})
              </span>
            ) : null}
          </h3>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {relInfo.label}
            {person.mbti ? ` · ${person.mbti}` : ""}
          </span>
        </div>

        {/* Row 2: 마지막 연락 · 태그 (태그는 우측 고정, 없으면 빈 자리) */}
        <div className="mt-0.5 flex items-center gap-2">
          <p className="truncate text-xs text-muted-foreground">{lastLine}</p>
          {hasTags ? (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {person.tags!.slice(0, 2).map((t) => (
                <TagChip key={t.id} tag={t} size="sm" />
              ))}
              {person.tags!.length > 2 ? (
                <span className="text-[10px] text-muted-foreground">
                  +{person.tags!.length - 2}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* 관계 건강도 컬럼 — 항상 고정 폭 (측정 전엔 '—'). onScoreClick 있으면 버튼 */}
      {(() => {
        const baseCls =
          "flex w-14 shrink-0 flex-col items-center justify-center rounded-md tabular-nums"
        const innerInteractive = onScoreClick && !selectMode
        const content = scoreLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : score != null && band ? (
          <>
            <span className={cn("text-sm font-semibold", band.toneClass)}>
              {score}
            </span>
            <span className={cn("text-[10px]", band.toneClass)}>
              {band.label}
            </span>
          </>
        ) : innerInteractive ? (
          <>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-primary">측정</span>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-muted-foreground">
              —
            </span>
            <span className="text-[10px] text-muted-foreground">미측정</span>
          </>
        )
        if (innerInteractive) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!scoreLoading) onScoreClick()
              }}
              disabled={scoreLoading}
              aria-label={
                score != null
                  ? `관계 건강도 ${score}점 — 다시 측정`
                  : "관계 건강도 측정"
              }
              className={cn(
                baseCls,
                "h-10 hover:bg-accent/40 active:scale-95 transition-all",
              )}
            >
              {content}
            </button>
          )
        }
        return (
          <div
            className={cn(baseCls, "h-10")}
            aria-label={
              score != null ? `관계 건강도 ${score}점` : "관계 건강도 미측정"
            }
          >
            {content}
          </div>
        )
      })()}
    </Wrapper>
  )
}

export function PersonCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
      <div className="h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/4 rounded bg-muted animate-pulse" />
      </div>
    </div>
  )
}
