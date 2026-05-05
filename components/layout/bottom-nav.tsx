"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Bell, Settings, BookOpenText } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  match: (pathname: string) => boolean
}

const ITEMS: NavItem[] = [
  {
    href: "/",
    label: "홈",
    icon: Home,
    match: (p) =>
      p === "/" || p.startsWith("/persons") || p.startsWith("/search"),
  },
  {
    href: "/records",
    label: "기록",
    icon: BookOpenText,
    match: (p) => p.startsWith("/records"),
  },
  {
    href: "/reminders",
    label: "리마인더",
    icon: Bell,
    match: (p) => p.startsWith("/reminders"),
  },
  {
    href: "/settings",
    label: "설정",
    icon: Settings,
    match: (p) => p.startsWith("/settings"),
  },
]

export function BottomNav() {
  const pathname = usePathname() ?? "/"

  return (
    <nav
      role="navigation"
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur safe-bottom lg:hidden"
    >
      <ul className="mx-auto flex h-nav max-w-xl items-stretch px-1">
        {ITEMS.map((item) => (
          <NavTab key={item.href} item={item} active={item.match(pathname)} />
        ))}
      </ul>
    </nav>
  )
}

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-nav flex-col items-center justify-center gap-1 text-[11px] font-medium",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    </li>
  )
}
