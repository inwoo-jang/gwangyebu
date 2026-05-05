import * as React from "react"
import { cn } from "@/lib/utils"

interface AppShellProps {
  header?: React.ReactNode
  children: React.ReactNode
  hideBottomNav?: boolean
  className?: string
}

export function AppShell({
  header,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main
        className={cn(
          "mx-auto w-full max-w-xl flex-1 px-4 pb-[calc(theme(spacing.nav)+env(safe-area-inset-bottom))] pt-4 lg:pb-8",
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}
