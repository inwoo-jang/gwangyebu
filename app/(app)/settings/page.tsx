import { LogOut } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SettingsForm } from "@/components/settings/settings-form"
import { DataExportButton } from "@/components/settings/data-export-button"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { getUserSettings } from "@/lib/actions/settings"
import { env } from "@/lib/env"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestSettings } from "@/components/guest/guest-settings"

export const dynamic = "force-dynamic"
export const metadata = { title: "설정" }

export default async function SettingsPage() {
  if (await isGuestMode()) {
    return <GuestSettings />
  }
  const profileRes = await getUserSettings()
  const fallbackPrefs = {
    reminders: true,
    ai: true,
    events: true,
    quiet_hours: { start: "22:00", end: "07:00" },
  }

  const initial = profileRes.ok
    ? {
        display_name: profileRes.data.display_name ?? "",
        ai_provider: profileRes.data.ai_provider ?? "auto",
        notification_prefs:
          profileRes.data.notification_prefs ?? fallbackPrefs,
        locale: profileRes.data.locale ?? "ko-KR",
        timezone: profileRes.data.timezone ?? "Asia/Seoul",
      }
    : {
        display_name: "",
        ai_provider: "auto" as const,
        notification_prefs: fallbackPrefs,
        locale: "ko-KR",
        timezone: "Asia/Seoul",
      }

  return (
    <AppShell header={<AppHeader title="설정" />}>
      <div className="space-y-6">
        <SettingsForm
          initial={initial}
          envDefaultProvider={env.AI_DEFAULT_PROVIDER}
        />

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">화면 테마</h2>
          <Label className="text-xs text-muted-foreground">
            라이트/다크/시스템 추종
          </Label>
          <ThemeToggle />
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">데이터 Export</h2>
          <p className="text-xs text-muted-foreground">
            모든 인물·연락 기록·태그를 JSON 파일로 내려받을 수 있어요.
          </p>
          <DataExportButton />
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">계정</h2>
          <form action="/auth/logout" method="post">
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </form>
        </section>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          관계부 v0.1 · M1 베타
        </p>
      </div>
    </AppShell>
  )
}
