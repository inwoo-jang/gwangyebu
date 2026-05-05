"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { exportUserData } from "@/app/(app)/settings/actions"

export function DataExportButton() {
  const [pending, startTransition] = React.useTransition()

  const onExport = () => {
    startTransition(async () => {
      const res = await exportUserData()
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gwangyebu-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("데이터를 내려받았어요")
    })
  }

  return (
    <Button
      variant="outline"
      onClick={onExport}
      disabled={pending}
      className="gap-1"
    >
      <Download className="h-4 w-4" />
      {pending ? "준비 중..." : "JSON 다운로드"}
    </Button>
  )
}
