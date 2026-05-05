"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  TagManageDialog,
  type ManageTag,
} from "@/components/relationship/tag-manage-dialog"
import { useGuestStore } from "@/lib/guest/store"

interface GuestTagManageButtonProps {
  trigger: React.ReactNode
}

export function GuestTagManageButton({ trigger }: GuestTagManageButtonProps) {
  const tags = useGuestStore((s) => s.tags)
  const personTags = useGuestStore((s) => s.personTags)
  const createTag = useGuestStore((s) => s.createTag)
  const updateTag = useGuestStore((s) => s.updateTag)
  const deleteTag = useGuestStore((s) => s.deleteTag)

  const usageCount = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const pt of personTags) {
      map.set(pt.tag_id, (map.get(pt.tag_id) ?? 0) + 1)
    }
    return map
  }, [personTags])

  const manageTags: ManageTag[] = tags.map((t) => ({ id: t.id, name: t.name }))

  return (
    <TagManageDialog
      tags={manageTags}
      usageCount={usageCount}
      trigger={trigger}
      onCreate={(name) => {
        const dup = tags.find((t) => t.name === name)
        if (dup) {
          toast.error("이미 같은 이름의 태그가 있어요")
          return false
        }
        createTag(name)
        toast.success("태그를 추가했어요")
        return true
      }}
      onRename={(id, name) => {
        const ok = updateTag(id, name)
        if (!ok) {
          toast.error("이미 같은 이름의 태그가 있어요")
          return false
        }
        toast.success("태그 이름을 수정했어요")
        return true
      }}
      onDelete={(id) => {
        deleteTag(id)
        toast.success("태그를 삭제했어요")
        return true
      }}
    />
  )
}
