"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  TagManageDialog,
  type ManageTag,
} from "@/components/relationship/tag-manage-dialog"
import { createTag, deleteTag, updateTag } from "@/lib/actions/tags"
import type { Tag } from "@/lib/supabase/types"

interface AuthTagManageButtonProps {
  tags: Tag[]
  /** tagId → 사용 중인 인물 수 */
  usageCount?: Map<string, number>
  trigger: React.ReactNode
}

export function AuthTagManageButton({
  tags,
  usageCount,
  trigger,
}: AuthTagManageButtonProps) {
  const router = useRouter()
  const manageTags: ManageTag[] = tags.map((t) => ({ id: t.id, name: t.name }))

  return (
    <TagManageDialog
      tags={manageTags}
      usageCount={usageCount}
      trigger={trigger}
      onCreate={async (name) => {
        const res = await createTag({ name })
        if (!res.ok) {
          toast.error(res.error.message)
          return false
        }
        toast.success("태그를 추가했어요")
        router.refresh()
        return true
      }}
      onRename={async (id, name) => {
        const res = await updateTag({ id, name })
        if (!res.ok) {
          toast.error(res.error.message)
          return false
        }
        toast.success("태그 이름을 수정했어요")
        router.refresh()
        return true
      }}
      onDelete={async (id) => {
        const res = await deleteTag({ id })
        if (!res.ok) {
          toast.error(res.error.message)
          return false
        }
        toast.success("태그를 삭제했어요")
        router.refresh()
        return true
      }}
    />
  )
}
