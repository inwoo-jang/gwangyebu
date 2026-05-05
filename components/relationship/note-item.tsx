import * as React from "react"
import { Pin } from "lucide-react"
import { fullDateKo, timeKo } from "@/lib/format/date"
import type { Note } from "@/lib/supabase/types"

interface NoteItemProps {
  note: Note
}

export function NoteItem({ note }: NoteItemProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {fullDateKo(note.created_at)} · {timeKo(note.created_at)}
        </span>
        {note.pinned ? (
          <span
            aria-label="고정된 메모"
            className="inline-flex items-center gap-1 text-xs text-primary"
          >
            <Pin className="h-3 w-3" /> 고정
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">
        {note.body}
      </p>
    </div>
  )
}
