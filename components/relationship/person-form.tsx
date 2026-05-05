"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { TagChip } from "@/components/relationship/tag-chip"
import {
  RELATIONSHIP_TYPE_OPTIONS,
  MBTI_OPTIONS,
} from "@/lib/format/relationship"
import { colorIndexForTag } from "@/lib/format/tag"
import { createPerson, updatePerson } from "@/lib/actions/persons"
import { createTag } from "@/lib/actions/tags"
import type { RelationshipType, Tag } from "@/lib/supabase/types"

const formSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
  relationship_type: z.enum([
    "family",
    "friend",
    "colleague",
    "client",
    "acquaintance",
    "etc",
  ]),
  birth_year: z.string().optional(),
  birth_month: z.string().optional(),
  birth_day: z.string().optional(),
  mbti: z.string().optional(),
  how_we_met: z.string().max(100).optional(),
  food_preference: z.string().max(200).optional(),
  memo: z.string().max(2000).optional(),
  reminder_interval_days: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface PersonFormProps {
  mode: "create" | "edit"
  initial?: {
    id?: string
    name: string
    relationship_type: RelationshipType
    birth_year?: number | null
    birth_month?: number | null
    birth_day?: number | null
    mbti?: string | null
    how_we_met?: string | null
    food_preference?: string | null
    memo?: string | null
    reminder_interval_days?: number
    tag_ids: string[]
  }
  availableTags: Tag[]
}

export function PersonForm({ mode, initial, availableTags }: PersonFormProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [tagIds, setTagIds] = React.useState<string[]>(
    initial?.tag_ids ?? [],
  )
  const [tags, setTags] = React.useState<Tag[]>(availableTags)
  const [newTagName, setNewTagName] = React.useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      relationship_type: initial?.relationship_type ?? "etc",
      birth_year: initial?.birth_year?.toString() ?? "",
      birth_month: initial?.birth_month?.toString() ?? "",
      birth_day: initial?.birth_day?.toString() ?? "",
      mbti: initial?.mbti ?? "",
      how_we_met: initial?.how_we_met ?? "",
      food_preference: initial?.food_preference ?? "",
      memo: initial?.memo ?? "",
      reminder_interval_days:
        initial?.reminder_interval_days?.toString() ?? "30",
    },
  })

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : prev.length >= 10
          ? prev
          : [...prev, tagId],
    )
  }

  const addNewTag = () => {
    const name = newTagName.trim()
    if (!name) return
    startTransition(async () => {
      const res = await createTag({ name })
      if (res.ok) {
        setTags((prev) => [...prev, res.data])
        setTagIds((prev) =>
          prev.length >= 10 ? prev : [...prev, res.data.id],
        )
        setNewTagName("")
      } else {
        toast.error(res.error.message)
      }
    })
  }

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        name: values.name,
        relationship_type: values.relationship_type,
        birth_year: values.birth_year ? Number(values.birth_year) : null,
        birth_month: values.birth_month ? Number(values.birth_month) : null,
        birth_day: values.birth_day ? Number(values.birth_day) : null,
        mbti: values.mbti && values.mbti.length > 0 ? values.mbti : null,
        how_we_met: values.how_we_met || null,
        food_preference: values.food_preference || null,
        memo: values.memo || null,
        reminder_interval_days: values.reminder_interval_days
          ? Number(values.reminder_interval_days)
          : 30,
        tag_ids: tagIds,
      }

      const res =
        mode === "create"
          ? await createPerson(payload)
          : await updatePerson({ ...payload, id: initial?.id })

      if (res.ok) {
        toast.success(mode === "create" ? "인물이 추가되었어요" : "저장되었어요")
        router.push(`/persons/${res.data.id}`)
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">이름 *</Label>
        <Input id="name" placeholder="홍길동" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="relationship_type">관계유형</Label>
          <Select
            id="relationship_type"
            options={RELATIONSHIP_TYPE_OPTIONS}
            {...form.register("relationship_type")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mbti">MBTI</Label>
          <Select
            id="mbti"
            options={[
              { value: "", label: "선택 안함" },
              ...MBTI_OPTIONS.map((m) => ({ value: m, label: m })),
            ]}
            {...form.register("mbti")}
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block">생일</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="YYYY"
            inputMode="numeric"
            {...form.register("birth_year")}
          />
          <Input
            placeholder="MM"
            inputMode="numeric"
            {...form.register("birth_month")}
          />
          <Input
            placeholder="DD"
            inputMode="numeric"
            {...form.register("birth_day")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="how_we_met">알게 된 경로</Label>
        <Input
          id="how_we_met"
          placeholder="예: 동아리에서 만남"
          {...form.register("how_we_met")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="food_preference">음식 취향</Label>
        <Input
          id="food_preference"
          placeholder="예: 매운 음식 못 먹음"
          {...form.register("food_preference")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>태그 (최대 10개)</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const selected = tagIds.includes(t.id)
            return (
              <TagChip
                key={t.id}
                tag={{
                  id: t.id,
                  name: t.name,
                  colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                }}
                variant={selected ? "selected" : "default"}
                onClick={() => toggleTag(t.id)}
              />
            )
          })}
        </div>
        <div className="flex gap-2 pt-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="새 태그 이름"
            maxLength={20}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addNewTag}
            disabled={pending || !newTagName.trim()}
          >
            추가
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reminder_interval_days">기본 리마인더 주기 (일)</Label>
        <Select
          id="reminder_interval_days"
          options={[
            { value: "0", label: "없음" },
            { value: "14", label: "2주" },
            { value: "30", label: "1개월" },
            { value: "60", label: "2개월" },
            { value: "90", label: "3개월" },
            { value: "180", label: "6개월" },
          ]}
          {...form.register("reminder_interval_days")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea
          id="memo"
          rows={4}
          maxLength={2000}
          placeholder="자유로운 메모 (취향·기념일·인상 등)"
          {...form.register("memo")}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "저장 중..." : mode === "create" ? "추가" : "저장"}
        </Button>
      </div>
    </form>
  )
}
