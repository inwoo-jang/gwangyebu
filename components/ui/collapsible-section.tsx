"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  title: React.ReactNode
  /** 우측 작은 메타 텍스트(건수 등) */
  meta?: React.ReactNode
  /** 펼침 시 좌측 아이콘(이모지 등) */
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** 외곽 카드 스타일 적용 (기본 true) */
  card?: boolean
}

/**
 * 접기/펼치기 섹션. 헤더 클릭으로 토글.
 * 키보드 접근성: Enter/Space.
 */
export function CollapsibleSection({
  title,
  meta,
  icon,
  defaultOpen = true,
  children,
  className,
  bodyClassName,
  card = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <section
      className={cn(
        card ? "rounded-xl border border-border bg-card" : "",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 text-left",
          card ? "px-3 py-2.5" : "py-1.5",
        )}
      >
        {icon ? <span aria-hidden>{icon}</span> : null}
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {meta ? (
          <span className="ml-1 text-[11px] text-muted-foreground">{meta}</span>
        ) : null}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 text-muted-foreground transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>
      {open ? (
        <div
          className={cn(
            card ? "border-t border-border px-3 py-3" : "pt-2",
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
