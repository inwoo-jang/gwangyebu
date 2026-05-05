"use client"

import * as React from "react"
import { LogOut, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { GuestBadge } from "@/components/guest/guest-badge"
import { useGuestStore } from "@/lib/guest/store"
import { GUEST_STORAGE_KEY } from "@/lib/guest/types"
import type { AiProvider } from "@/lib/supabase/types"

const CONFIRM_TEXT = "초기화"

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
  const [resetOpen, setResetOpen] = React.useState(false)
  const [resetInput, setResetInput] = React.useState("")

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

  const handleResetConfirmed = () => {
    resetAll()
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GUEST_STORAGE_KEY)
    }
    setResetOpen(false)
    setResetInput("")
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

          <CollapsibleSection
            icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
            title={
              <span className="text-destructive text-xs">
                위험 영역 — 데이터 초기화
              </span>
            }
            defaultOpen={false}
            card={false}
            className="border-destructive/40 bg-destructive/5 mt-2"
            bodyClassName="pt-0"
          >
            <p className="text-[11px] text-muted-foreground mb-2">
              인물·연락 기록·태그·리마인더 등 이 브라우저에 저장된{" "}
              <strong className="text-destructive">모든 게스트 데이터</strong>가
              영구 삭제되며 복구할 수 없어요.
            </p>
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
              className="w-full gap-2 text-destructive border-destructive/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              게스트 데이터 초기화…
            </Button>
          </CollapsibleSection>
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

      <Dialog
        open={resetOpen}
        onOpenChange={(o) => {
          setResetOpen(o)
          if (!o) setResetInput("")
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              모든 게스트 데이터 초기화
            </DialogTitle>
            <DialogDescription>
              이 작업은 <strong className="text-destructive">되돌릴 수 없어요</strong>.
              인물·연락 기록·태그·리마인더·경조사·선물·대여 모든 데이터가
              영구 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              계속하려면 아래 칸에{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground font-mono">
                {CONFIRM_TEXT}
              </code>{" "}
              이라고 정확히 입력해 주세요.
            </p>
            <Input
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              placeholder={CONFIRM_TEXT}
              autoComplete="off"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetConfirmed}
              disabled={resetInput.trim() !== CONFIRM_TEXT}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              영구 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
