"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { RELATIONSHIP_TYPE_OPTIONS } from "@/lib/format/relationship"
import type { RelationshipType, Tag } from "@/lib/supabase/types"
import { TagChip } from "@/components/relationship/tag-chip"
import { colorIndexForTag } from "@/lib/format/tag"

interface FilterChipsProps {
  tags: Tag[]
}

export function FilterChips({ tags }: FilterChipsProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const types = (sp.get("types") ?? "").split(",").filter(Boolean) as
    | RelationshipType[]
    | string[]
  const tagIds = (sp.get("tags") ?? "").split(",").filter(Boolean)

  const update = (key: "types" | "tags", values: string[]) => {
    const params = new URLSearchParams(sp.toString())
    if (values.length > 0) params.set(key, values.join(","))
    else params.delete(key)
    router.replace(`/search?${params.toString()}`)
  }

  const toggleType = (t: RelationshipType) => {
    const set = new Set(types as string[])
    if (set.has(t)) set.delete(t)
    else set.add(t)
    update("types", Array.from(set))
  }

  const toggleTag = (id: string) => {
    const set = new Set(tagIds)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    update("tags", Array.from(set))
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          관계 유형
        </p>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_TYPE_OPTIONS.map((opt) => {
            const active = (types as string[]).includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleType(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
      {tags.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            태그
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <TagChip
                key={t.id}
                tag={{
                  id: t.id,
                  name: t.name,
                  colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                }}
                size="sm"
                variant={tagIds.includes(t.id) ? "selected" : "default"}
                onClick={() => toggleTag(t.id)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
