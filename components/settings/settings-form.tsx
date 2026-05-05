"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updateUserSettings } from "@/lib/actions/settings"
import type { AiProvider, NotificationPrefs } from "@/lib/supabase/types"

interface SettingsFormProps {
  initial: {
    display_name: string
    ai_provider: AiProvider
    notification_prefs: NotificationPrefs
    locale: string
    timezone: string
  }
  envDefaultProvider: string
}

export function SettingsForm({ initial, envDefaultProvider }: SettingsFormProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const [displayName, setDisplayName] = React.useState(initial.display_name)
  const [aiProvider, setAiProvider] = React.useState<AiProvider>(
    initial.ai_provider,
  )
  const [reminders, setReminders] = React.useState(
    initial.notification_prefs.reminders,
  )
  const [aiAlerts, setAiAlerts] = React.useState(initial.notification_prefs.ai)
  const [eventsAlerts, setEventsAlerts] = React.useState(
    initial.notification_prefs.events,
  )

  const onSave = () => {
    startTransition(async () => {
      const res = await updateUserSettings({
        display_name: displayName.trim() || initial.display_name,
        ai_provider: aiProvider,
        notification_prefs: {
          reminders,
          ai: aiAlerts,
          events: eventsAlerts,
          quiet_hours: initial.notification_prefs.quiet_hours,
        },
      })
      if (res.ok) {
        toast.success("저장되었어요")
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">프로필</h2>
        <div className="space-y-1.5">
          <Label htmlFor="display_name">표시명</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={30}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">알림</h2>
        <Toggle
          id="notif-reminder"
          label="리마인더 알림"
          checked={reminders}
          onChange={setReminders}
        />
        <Toggle
          id="notif-ai"
          label="AI 추천 알림"
          checked={aiAlerts}
          onChange={setAiAlerts}
        />
        <Toggle
          id="notif-events"
          label="경조사 알림 (M2)"
          checked={eventsAlerts}
          onChange={setEventsAlerts}
        />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">AI 프로바이더</h2>
        <p className="text-xs text-muted-foreground">
          기본값(서버 환경): <code>{envDefaultProvider}</code>
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="ai_provider">선택</Label>
          <Select
            id="ai_provider"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AiProvider)}
            options={[
              { value: "auto", label: "자동 (권장 — 폴백 포함)" },
              { value: "claude", label: "Claude" },
              { value: "gemini", label: "Gemini" },
            ]}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  )
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="cursor-pointer text-sm">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
