import * as React from "react"
import {
  CONTACT_CHANNEL_LABEL,
  CONTACT_DIRECTION_LABEL,
} from "@/lib/format/relationship"
import { fullDateKo, timeKo } from "@/lib/format/date"
import type { ContactLog } from "@/lib/supabase/types"

interface ContactLogItemProps {
  log: ContactLog
}

export function ContactLogItem({ log }: ContactLogItemProps) {
  const ch = CONTACT_CHANNEL_LABEL[log.channel]
  const dir = CONTACT_DIRECTION_LABEL[log.direction]
  const channelLabel =
    log.channel === "custom" && log.custom_channel
      ? log.custom_channel
      : ch.label

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span aria-hidden>{ch.icon}</span>
        <span>{channelLabel}</span>
        {dir ? (
          <span className="text-xs text-muted-foreground">· {dir}</span>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {timeKo(log.occurred_at)}
        </span>
      </div>
      {log.memo ? (
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">
          {log.memo}
        </p>
      ) : null}
      <p className="mt-1 text-[11px] text-muted-foreground">
        {fullDateKo(log.occurred_at)}
      </p>
    </div>
  )
}
