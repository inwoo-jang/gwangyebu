"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-3xl">😢</p>
      <h2 className="text-lg font-semibold">문제가 발생했어요</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 도움이 필요할 수 있어요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </main>
  )
}
