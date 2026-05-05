"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addNote } from "@/lib/actions/notes"

interface NoteAddFormProps {
  personId: string
}

export function NoteAddForm({ personId }: NoteAddFormProps) {
  const router = useRouter()
  const [body, setBody] = React.useState("")
  const [pending, startTransition] = React.useTransition()

  const submit = () => {
    if (!body.trim()) return
    startTransition(async () => {
      const res = await addNote({ person_id: personId, body: body.trim() })
      if (res.ok) {
        toast.success("메모가 저장되었어요")
        setBody("")
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        maxLength={5000}
        placeholder="메모를 남겨보세요"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending || !body.trim()} size="sm">
          {pending ? "저장 중..." : "메모 추가"}
        </Button>
      </div>
    </div>
  )
}
