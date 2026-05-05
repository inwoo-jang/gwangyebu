"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plus,
  X,
  UserPlus,
  Bell,
  Cake,
  Gift,
  Coins,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiStore } from "@/lib/guest/ui-store"

/**
 * 우하단 고정 + FAB.
 * - 닫힘 상태: '+' 버튼만 노출
 * - 열림 상태(스피드 다이얼): 5개 액션이 위로 펼쳐짐
 *   1. 인맥 등록 (/persons/new)
 *   2. 리마인더 등록 (/reminders?add=1)
 *   3. 경조사 기록 (/records?tab=event&add=1)
 *   4. 선물 기록 (/records?tab=gift&add=1)
 *   5. 금전 기록 (/records?tab=loan&add=1)
 *
 * UiStore.hideFab 가 true면 전체를 숨긴다 (예: 다중선택 모드).
 */
export function AddFab() {
  const pathname = usePathname() ?? "/"
  const hideFab = useUiStore((s) => s.hideFab)
  const [open, setOpen] = React.useState(false)

  const hidden =
    hideFab ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/persons/new") ||
    pathname.endsWith("/edit")

  // 페이지 이동 시 자동 닫기
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  // ESC 또는 외부 클릭으로 닫기
  React.useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [open])

  if (hidden) return null

  const items: {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }[] = [
    {
      href: "/persons/new",
      label: "인맥 추가",
      icon: UserPlus,
      color: "bg-primary text-primary-foreground",
    },
    {
      href: "/reminders?add=1",
      label: "리마인더",
      icon: Bell,
      color: "bg-accent text-accent-foreground",
    },
    {
      href: "/records?tab=event&add=1",
      label: "경조사",
      icon: Cake,
      color: "bg-secondary text-secondary-foreground",
    },
    {
      href: "/records?tab=gift&add=1",
      label: "선물",
      icon: Gift,
      color: "bg-secondary text-secondary-foreground",
    },
    {
      href: "/records?tab=loan&add=1",
      label: "금전",
      icon: Coins,
      color: "bg-secondary text-secondary-foreground",
    },
  ]

  return (
    <>
      {/* 백드롭 — 열림 시 외부 클릭으로 닫기 + 살짝 어둡게 */}
      {open ? (
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        />
      ) : null}

      {/* 메뉴 아이템 (열림 시 위로 펼쳐짐) */}
      {open ? (
        <ul
          className={cn(
            "fixed right-4 z-50 flex flex-col-reverse gap-2",
            "bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+5rem)] lg:bottom-[5.5rem]",
          )}
          aria-label="빠른 추가 메뉴"
        >
          {items.map((it) => {
            const Icon = it.icon
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 group"
                >
                  <span className="rounded-md bg-foreground/90 px-2 py-1 text-xs font-medium text-background shadow-soft">
                    {it.label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-full shadow-soft transition-transform active:scale-95",
                      it.color,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}

      {/* 메인 + 버튼 — 열림 상태에선 X 아이콘 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "메뉴 닫기" : "빠른 추가 메뉴 열기"}
        aria-expanded={open}
        className={cn(
          "fixed right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95",
          "bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] lg:bottom-6",
          open ? "rotate-45" : "rotate-0",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </>
  )
}
