import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  title?: string
  /**
   * 뒤로가기 버튼.
   * - onClick 제공 시: 버튼으로 렌더, 클릭 핸들러 호출 (모달 띄울 때 등)
   * - href만 제공 시: Link로 렌더
   */
  back?: { href?: string; label?: string; onClick?: () => void }
  actions?: React.ReactNode
  sticky?: boolean
  className?: string
  /** true면 좌측에 관계부 로고 노출 (홈 전용). 기본 false. */
  brand?: boolean
}

/**
 * 좌측 정렬 헤더: [back?] [로고?] [페이지 타이틀]  ...  [actions]
 *
 * 로고는 brand=true 일 때만 노출 (홈에서만).
 * 검색/기록/리마인더/설정/인물 추가/편집 등은 페이지 타이틀만.
 */
export function AppHeader({
  title,
  back,
  actions,
  sticky = true,
  className,
  brand = false,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "z-30 flex items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur",
        brand ? "h-24" : "h-14",
        sticky && "sticky top-0",
        className,
      )}
    >
      {back ? (
        back.onClick ? (
          <button
            type="button"
            onClick={back.onClick}
            aria-label={back.label ?? "뒤로"}
            className="-ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href={back.href ?? "/"}
            aria-label={back.label ?? "뒤로"}
            className="-ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )
      ) : null}

      {brand ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="관계부"
          className="h-16 w-auto shrink-0 object-contain"
        />
      ) : null}

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
        {title}
      </h1>

      {actions ? (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      ) : null}
    </header>
  )
}
