"use client"

import * as React from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { GuestPerson } from "@/lib/guest/types"

interface PersonSelectProps {
  persons: GuestPerson[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  className?: string
}

/**
 * 200+ 인맥에서도 빠르게 찾을 수 있는 검색 가능 콤보박스.
 * - 트리거: 현재 선택된 인물 카드형 표시
 * - 펼침 시: 검색 입력 + 필터링된 결과 리스트
 * - 이름·닉네임·카톡닉·인스타 핸들 모두 매칭
 */
export function PersonSelect({
  persons,
  value,
  onChange,
  placeholder = "인물 선택",
  className,
}: PersonSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = React.useMemo(
    () => persons.find((p) => p.id === value),
    [persons, value],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return persons
    return persons.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.nickname?.toLowerCase().includes(q) ?? false) ||
        (p.kakao_nickname?.toLowerCase().includes(q) ?? false) ||
        (p.instagram_handle?.toLowerCase().includes(q) ?? false),
    )
  }, [persons, query])

  // 외부 클릭 시 닫기
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

  // 펼치면 검색 input 자동 포커스
  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setQuery("")
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full items-center gap-2 rounded-md border border-input bg-card px-2 h-10 text-sm tap",
          "hover:bg-accent/30 transition-colors",
        )}
      >
        {selected ? (
          <>
            <ProfileAvatar
              gender={selected.gender}
              profileIndex={selected.profile_index}
              bgId={selected.avatar_bg}
              name={selected.name}
              size="xs"
            />
            <span className="truncate font-medium">{selected.name}</span>
            {selected.nickname ? (
              <span className="truncate text-xs text-muted-foreground">
                ({selected.nickname})
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {open ? (
        <div
          role="listbox"
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
                const active = p.id === value
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(p.id)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent/30",
                      )}
                    >
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

          <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
            {filtered.length}명
          </p>
        </div>
      ) : null}
    </div>
  )
}
