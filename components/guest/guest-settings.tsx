"use client"

import * as React from "react"
import { LogOut, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { GuestBadge } from "@/components/guest/guest-badge"
import { useGuestStore } from "@/lib/guest/store"
import { GUEST_STORAGE_KEY } from "@/lib/guest/types"
import type { AiProvider } from "@/lib/supabase/types"

const AI_OPTIONS: { value: AiProvider; label: string }[] = [
  { value: "auto", label: "자동 (사용 가능한 키)" },
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gemini", label: "Gemini (Google)" },
  { value: "rule_based", label: "규칙 기반 (오프라인)" },
]

export function GuestSettings() {
  const settings = useGuestStore((s) => s.settings)
  const updateSettings = useGuestStore((s) => s.updateSettings)
  const exportJson = useGuestStore((s) => s.exportJson)
  const resetAll = useGuestStore((s) => s.resetAll)

  const [displayName, setDisplayName] = React.useState(
    settings.display_name ?? "",
  )

  const handleExport = () => {
    const data = exportJson()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gwangyebu-guest-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleResetData = () => {
    if (!confirm("모든 게스트 데이터를 삭제할까요? 되돌릴 수 없어요.")) return
    resetAll()
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GUEST_STORAGE_KEY)
    }
    toast.success("초기화되었어요")
  }

  return (
    <AppShell header={<AppHeader title="설정" actions={<GuestBadge />} />}>
      <div className="space-y-6">
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">프로필</h2>
          <div className="space-y-1.5">
            <Label htmlFor="display_name">표시 이름</Label>
            <div className="flex gap-2">
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="게스트"
                maxLength={30}
              />
              <Button
                onClick={() => {
                  updateSettings({ display_name: displayName })
                  toast.success("저장되었어요")
                }}
              >
                저장
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">AI 프로바이더</h2>
          <Select
            options={AI_OPTIONS}
            value={settings.ai_provider}
            onChange={(e) =>
              updateSettings({ ai_provider: e.target.value as AiProvider })
            }
          />
          <p className="text-xs text-muted-foreground">
            게스트 모드의 관계 분석은 기본적으로 규칙 기반(오프라인)으로 동작해요.
            Claude/Gemini로 바꾸려면 서버 환경에 API 키 설정이 필요합니다.
          </p>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">화면 테마</h2>
          <Label className="text-xs text-muted-foreground">
            라이트/다크/시스템 추종
          </Label>
          <ThemeToggle />
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">데이터 관리</h2>
          <p className="text-xs text-muted-foreground">
            모든 인물·연락 기록·태그를 JSON 파일로 내려받을 수 있어요.
          </p>
          <Button variant="outline" onClick={handleExport} className="w-full">
            JSON으로 내보내기
          </Button>
          <Button
            variant="outline"
            onClick={handleResetData}
            className="w-full gap-2 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            게스트 데이터 초기화
          </Button>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">계정</h2>
          <p className="text-xs text-muted-foreground">
            게스트 모드를 종료하고 로그인 화면으로 돌아갑니다. 데이터는 이 브라우저에 그대로 보관돼요.
          </p>
          <form action="/api/guest/end" method="post">
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              게스트 모드 종료
            </Button>
          </form>
        </section>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          관계부 v0.1 · 베타
        </p>
      </div>
    </AppShell>
  )
}
