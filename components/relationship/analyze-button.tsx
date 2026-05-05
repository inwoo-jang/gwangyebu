"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface AnalyzeButtonProps {
  personId: string
}

export function AnalyzeButton({ personId }: AnalyzeButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const run = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string
            error?: string
          }
          toast.error(body.message ?? body.error ?? "AI 분석 실패")
          return
        }
        toast.success("AI 분석이 완료되었어요")
        router.push(`/persons/${personId}/analysis`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "요청 실패")
      }
    })
  }

  return (
    <Button onClick={run} disabled={pending} variant="outline" className="gap-1">
      <Sparkles className="h-4 w-4" />
      {pending ? "분석 중..." : "AI 관계 분석"}
    </Button>
  )
}
