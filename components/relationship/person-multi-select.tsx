"use client"

import * as React from "react"
import { ChevronDown, Search, X, Check } from "lucide-react"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { GuestPerson } from "@/lib/guest/types"

interface PersonMultiSelectProps {
  persons: GuestPerson[]
  /** 이미 선택된 ID들 */
  values: string[]
  onChange: (ids: string[]) => void
  /** 선택 후보에서 제외할 ID들 (예: 메인 person_id) */
  excludeIds?: string[]
  placeholder?: string
  className?: string
  max?: number
}

/**
 * 다중 선택용 콤보. 검색 가능, 체크박스 표시.
 * 선택된 인물은 칩으로 트리거 영역에 노출.
 */
export function PersonMultiSelect({
  persons,
  values,
  onChange,
  excludeIds,
  placeholder = "함께하는 사람 (선택)",
  className,
  max = 20,
}: PersonMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const excludeSet = React.useMemo(
    () => new Set(excludeIds ?? []),
    [excludeIds],
  )

  const candidates = React.useMemo(
    () => persons.filter((p) => !excludeSet.has(p.id)),
    [persons, excludeSet],
  )

  const selected = React.useMemo(
    () => candidates.filter((p) => values.includes(p.id)),
    [candidates, values],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nickname?.toLowerCase().includes(q) ?? false) ||
        (p.kakao_nickname?.toLowerCase().includes(q) ?? false) ||
        (p.instagram_handle?.toLowerCase().includes(q) ?? false),
    )
  }, [candidates, query])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery("")
    }
  }, [open])

  const toggle = (id: string) => {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id))
    } else if (values.length < max) {
      onChange([...values, id])
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full items-center gap-2 rounded-md border border-input bg-card px-2 min-h-10 text-sm tap",
          "hover:bg-accent/30 transition-colors",
        )}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground py-2">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1 py-1.5">
            {selected.slice(0, 4).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-accent/40 px-2 py-0.5 text-[11px]"
              >
                <ProfileAvatar
                  gender={p.gender}
                  profileIndex={p.profile_index}
                  bgId={p.avatar_bg}
                  name={p.name}
                  size="xs"
                  className="!h-4 !w-4"
                />
                {p.name}
              </span>
            ))}
            {selected.length > 4 ? (
              <span className="text-[11px] text-muted-foreground">
                +{selected.length - 4}명
              </span>
            ) : null}
          </div>
        )}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-soft"
        >
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름·닉네임·카톡·인스타로 검색"
              className="pl-9 pr-8 h-9"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="검색 지우기"
                className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md hover:bg-accent"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              일치하는 인물이 없어요.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {filtered.map((p) => {
                const checked = values.includes(p.id)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(p.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm",
                        checked ? "bg-primary/10" : "hover:bg-accent/30",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-4 w-4 items-center justify-center rounded border-2 shrink-0",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card",
                        )}
                      >
                        {checked ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <ProfileAvatar
                        gender={p.gender}
                        profileIndex={p.profile_index}
                        bgId={p.avatar_bg}
                        name={p.name}
                        size="xs"
                      />
                      <span className="truncate font-medium">{p.name}</span>
                      {p.nickname ? (
                        <span className="truncate text-xs text-muted-foreground">
                          ({p.nickname})
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              {selected.length} / {max}명 선택
            </span>
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => onChange([])}
                className="hover:underline"
              >
                전체 해제
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
