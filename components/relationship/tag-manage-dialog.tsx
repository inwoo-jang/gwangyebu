"use client"

import * as React from "react"
import { Pencil, Trash2, Check, X, Plus, Tag as TagIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TagChip } from "@/components/relationship/tag-chip"
import { colorIndexForTag } from "@/lib/format/tag"
import { cn } from "@/lib/utils"

export interface ManageTag {
  id: string
  name: string
}

interface TagManageDialogProps {
  tags: ManageTag[]
  /** tagId → 사용 인물 수. 표시용. */
  usageCount?: Map<string, number>
  onCreate?: (name: string) => Promise<boolean | void> | boolean | void
  onRename?: (
    id: string,
    name: string,
  ) => Promise<boolean | void> | boolean | void
  onDelete?: (id: string) => Promise<boolean | void> | boolean | void
  trigger: React.ReactNode
}

/**
 * 태그 관리 모달 — 추가/이름 수정/삭제.
 * 인증/게스트 모드 공용. 호출자가 onCreate/onRename/onDelete 콜백 제공.
 * 콜백이 false 반환하면 실패 처리(이름 수정 폼 유지).
 */
export function TagManageDialog({
  tags,
  usageCount,
  onCreate,
  onRename,
  onDelete,
  trigger,
}: TagManageDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingName, setEditingName] = React.useState("")
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const sorted = React.useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [tags],
  )

  const startEdit = (t: ManageTag) => {
    setEditingId(t.id)
    setEditingName(t.name)
    setDeletingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const submitEdit = async () => {
    if (!editingId || !editingName.trim()) {
      cancelEdit()
      return
    }
    setBusy(true)
    try {
      const result = await onRename?.(editingId, editingName.trim())
      if (result === false) return // 호출자가 실패 알린 경우 폼 유지
      cancelEdit()
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async (id: string) => {
    setBusy(true)
    try {
      await onDelete?.(id)
      setDeletingId(null)
    } finally {
      setBusy(false)
    }
  }

  const submitCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const result = await onCreate?.(trimmed)
      if (result === false) {
        toast.error("이미 같은 이름의 태그가 있어요")
        return
      }
      setNewName("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            태그 관리
          </DialogTitle>
          <DialogDescription>
            태그 이름을 수정하거나 삭제할 수 있어요. 삭제하면 인물에 매핑된
            태그도 같이 풀려요.
          </DialogDescription>
        </DialogHeader>

        {/* 새 태그 추가 */}
        {onCreate ? (
          <section className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              새 태그 만들기
            </p>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 동아리, 거래처"
                maxLength={20}
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void submitCreate()
                  }
                }}
              />
              <Button
                onClick={submitCreate}
                disabled={busy || !newName.trim()}
                size="sm"
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                추가
              </Button>
            </div>
          </section>
        ) : null}

        {/* 태그 목록 */}
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            기존 태그 ({sorted.length}개)
          </p>
          {sorted.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              아직 태그가 없어요.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {sorted.map((t) => {
                const isEditing = editingId === t.id
                const isDeletingThis = deletingId === t.id
                const count = usageCount?.get(t.id) ?? 0
                return (
                  <li
                    key={t.id}
                    className={cn(
                      "rounded-lg border bg-card p-2",
                      isDeletingThis
                        ? "border-destructive bg-destructive/5"
                        : "border-border",
                    )}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          maxLength={20}
                          disabled={busy}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              void submitEdit()
                            } else if (e.key === "Escape") {
                              cancelEdit()
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={submitEdit}
                          disabled={busy || !editingName.trim()}
                          aria-label="저장"
                          className="text-primary"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={busy}
                          aria-label="취소"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : isDeletingThis ? (
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-xs text-destructive">
                          ‘{t.name}’ 태그를 삭제할까요?
                          {count > 0 ? ` (인물 ${count}명에서 풀림)` : ""}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingId(null)}
                          disabled={busy}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => confirmDelete(t.id)}
                          disabled={busy}
                        >
                          삭제
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <TagChip
                          tag={{
                            id: t.id,
                            name: t.name,
                            colorIndex: colorIndexForTag({
                              id: t.id,
                              name: t.name,
                            }),
                          }}
                          size="sm"
                        />
                        <span className="flex-1 text-[11px] text-muted-foreground tabular-nums">
                          {count > 0 ? `${count}명` : "사용 안 함"}
                        </span>
                        {onRename ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(t)}
                            aria-label="이름 수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setDeletingId(t.id)
                              setEditingId(null)
                            }}
                            aria-label="삭제"
                            className="text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
