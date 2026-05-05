"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TagChip } from "@/components/relationship/tag-chip"
import {
  TagManageDialog,
  type ManageTag,
} from "@/components/relationship/tag-manage-dialog"
import { Settings as SettingsIcon } from "lucide-react"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import {
  RELATIONSHIP_TYPE_OPTIONS,
  MBTI_OPTIONS,
} from "@/lib/format/relationship"
import { colorIndexForTag } from "@/lib/format/tag"
import { createPerson, updatePerson } from "@/lib/actions/persons"
import { createTag, deleteTag, updateTag } from "@/lib/actions/tags"
import {
  AVATAR_BG_COUNT,
  DEFAULT_AVATAR_BG,
  DEFAULT_GENDER,
  DEFAULT_PROFILE_INDEX,
  PASTEL_BG,
  PROFILE_IMAGE_COUNT,
  type Gender,
  pastelBgStyle,
  profileImageUrl,
} from "@/lib/profile/avatar"
import { cn } from "@/lib/utils"
import type { RelationshipType, Tag } from "@/lib/supabase/types"

const FORM_ID = "auth-person-form"

const formSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
  nickname: z.string().max(30).optional(),
  relationship_type: z.enum([
    "family",
    "friend",
    "colleague",
    "client",
    "acquaintance",
    "lover",
    "crush",
    "custom",
    "etc",
  ]),
  relationship_label: z.string().max(30).optional(),
  phone_number: z.string().max(20).optional(),
  kakao_nickname: z.string().max(50).optional(),
  instagram_handle: z.string().max(30).optional(),
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

export interface PersonFormInitial {
  id?: string
  name: string
  nickname?: string | null
  relationship_type: RelationshipType
  relationship_label?: string | null
  gender?: Gender | null
  profile_index?: number | null
  avatar_bg?: number | null
  phone_number?: string | null
  kakao_nickname?: string | null
  instagram_handle?: string | null
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

interface PersonFormProps {
  mode: "create" | "edit"
  initial?: PersonFormInitial
  availableTags: Tag[]
  /** 폼 위에 노출할 부가 콘텐츠 (예: 일괄 가져오기 안내) */
  preContent?: React.ReactNode
}

export function PersonForm({
  mode,
  initial,
  availableTags,
  preContent,
}: PersonFormProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [tags, setTags] = React.useState<Tag[]>(availableTags)
  const [tagIds, setTagIds] = React.useState<string[]>(initial?.tag_ids ?? [])
  const [newTagName, setNewTagName] = React.useState("")
  const [gender, setGender] = React.useState<Gender>(
    initial?.gender ?? DEFAULT_GENDER,
  )
  const [profileIndex, setProfileIndex] = React.useState<number>(
    initial?.profile_index ?? DEFAULT_PROFILE_INDEX,
  )
  const [avatarBg, setAvatarBg] = React.useState<number>(
    initial?.avatar_bg ?? DEFAULT_AVATAR_BG,
  )
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const submittedRef = React.useRef(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      nickname: initial?.nickname ?? "",
      relationship_type: initial?.relationship_type ?? "etc",
      relationship_label: initial?.relationship_label ?? "",
      phone_number: initial?.phone_number ?? "",
      kakao_nickname: initial?.kakao_nickname ?? "",
      instagram_handle: initial?.instagram_handle ?? "",
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

  const isLocalDirty = React.useMemo(() => {
    const initialTagIds = initial?.tag_ids ?? []
    const initialGender = initial?.gender ?? DEFAULT_GENDER
    const initialProfile = initial?.profile_index ?? DEFAULT_PROFILE_INDEX
    const initialBg = initial?.avatar_bg ?? DEFAULT_AVATAR_BG
    const sameTags =
      initialTagIds.length === tagIds.length &&
      initialTagIds.every((id) => tagIds.includes(id))
    return (
      gender !== initialGender ||
      profileIndex !== initialProfile ||
      avatarBg !== initialBg ||
      !sameTags
    )
  }, [initial, tagIds, gender, profileIndex, avatarBg])

  const isDirty =
    (form.formState.isDirty || isLocalDirty) && !submittedRef.current
  const backHref =
    mode === "edit" && initial?.id ? `/persons/${initial.id}` : "/"

  const handleBack = () => {
    if (isDirty) setLeaveOpen(true)
    else router.push(backHref)
  }

  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const submit = (values: FormValues) => {
    startTransition(async () => {
      const payload = {
        name: values.name,
        nickname: values.nickname?.trim() || null,
        gender,
        profile_index: profileIndex,
        avatar_bg: avatarBg,
        relationship_type: values.relationship_type,
        relationship_label:
          values.relationship_type === "custom"
            ? values.relationship_label?.trim() || null
            : null,
        phone_number: values.phone_number?.trim()
          ? values.phone_number.replace(/\D/g, "")
          : null,
        kakao_nickname: values.kakao_nickname?.trim() || null,
        instagram_handle: values.instagram_handle?.trim()
          ? values.instagram_handle.trim().replace(/^@/, "")
          : null,
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
        submittedRef.current = true
        toast.success(
          mode === "create" ? "인물이 추가되었어요" : "저장되었어요",
        )
        router.push(`/persons/${res.data.id}`)
        router.refresh()
      } else {
        toast.error(res.error.message)
      }
    })
  }

  const saveAndLeave = () => {
    setLeaveOpen(false)
    void form.handleSubmit(submit)()
  }
  const discardAndLeave = () => {
    submittedRef.current = true
    setLeaveOpen(false)
    router.push(backHref)
  }

  const headerTitle = mode === "create" ? "새 인맥 추가" : "인맥 편집"
  const submitLabel = mode === "create" ? "추가" : "저장"

  return (
    <AppShell
      header={
        <AppHeader
          title={headerTitle}
          back={{ onClick: handleBack }}
          actions={
            <Button
              type="submit"
              form={FORM_ID}
              size="sm"
              className="font-semibold"
              disabled={pending}
            >
              {submitLabel}
            </Button>
          }
        />
      }
    >
      {preContent ? <div className="mb-4">{preContent}</div> : null}
      <form
        id={FORM_ID}
        onSubmit={form.handleSubmit(submit)}
        className="space-y-5"
      >
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Label className="text-sm font-medium">프로필 이미지</Label>
          <div className="flex items-center gap-3">
            <ProfileAvatar
              gender={gender}
              profileIndex={profileIndex}
              bgId={avatarBg}
              size="lg"
            />
            <div className="flex flex-1 gap-2">
              <button
                type="button"
                onClick={() => setGender("female")}
                className={cn(
                  "flex-1 h-9 rounded-md border text-sm tap",
                  gender === "female"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                여자
              </button>
              <button
                type="button"
                onClick={() => setGender("male")}
                className={cn(
                  "flex-1 h-9 rounded-md border text-sm tap",
                  gender === "male"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                남자
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              이미지 선택 (1~{PROFILE_IMAGE_COUNT})
            </Label>
            <div className="mt-1.5 grid grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1">
              {Array.from({ length: PROFILE_IMAGE_COUNT }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setProfileIndex(n)}
                    className={cn(
                      "rounded-full overflow-hidden h-10 w-10 border-2 transition-all",
                      profileIndex === n
                        ? "border-primary scale-110"
                        : "border-transparent opacity-80 hover:opacity-100",
                    )}
                    style={pastelBgStyle(avatarBg)}
                    aria-label={`프로필 ${n}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profileImageUrl(gender, n)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ),
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">배경색</Label>
            <div className="mt-1.5 flex gap-2">
              {Array.from({ length: AVATAR_BG_COUNT }, (_, i) => i + 1).map(
                (id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAvatarBg(id)}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-all",
                      avatarBg === id
                        ? "border-primary scale-110"
                        : "border-transparent",
                    )}
                    style={pastelBgStyle(id)}
                    aria-label={PASTEL_BG.find((p) => p.id === id)?.label}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        <div className="space-y-1.5">
          <Label htmlFor="name">이름 *</Label>
          <Input id="name" placeholder="홍길동" {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nickname">닉네임 / 애칭</Label>
          <Input
            id="nickname"
            placeholder="예: 지수, 민호 형, 사장님"
            {...form.register("nickname")}
          />
          <p className="text-[11px] text-muted-foreground">
            본명과 함께 표시되고 검색에도 잡혀요.
          </p>
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

        {form.watch("relationship_type") === "custom" ? (
          <div className="space-y-1.5">
            <Label htmlFor="relationship_label">
              관계 라벨 직접입력 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="relationship_label"
              placeholder="예: 사촌형, 거래처 사장님, 사부님"
              maxLength={30}
              {...form.register("relationship_label")}
            />
            <p className="text-[11px] text-muted-foreground">
              인물 카드와 상세에 이 라벨이 표시돼요.
            </p>
          </div>
        ) : null}

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
          <Label htmlFor="phone_number">휴대폰 번호</Label>
          <Input
            id="phone_number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-0000-0000"
            {...form.register("phone_number")}
          />
          <p className="text-[11px] text-muted-foreground">
            전화/문자 바로가기에 사용돼요.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="kakao_nickname">카톡 친구 이름</Label>
          <Input
            id="kakao_nickname"
            placeholder="예: 지수🌸 / 이민호 과장"
            {...form.register("kakao_nickname")}
          />
          <p className="text-[11px] text-muted-foreground">
            카톡 친구 목록에 보이는 이름을 적어두면, 인물 상세에서 ‘카톡 열기’
            누를 때 이 이름이 클립보드에 복사돼 카톡 검색에 바로 붙여넣을 수 있어요.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instagram_handle">인스타그램</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="instagram_handle"
              placeholder="jisoo.kim"
              className="pl-7"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...form.register("instagram_handle")}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            @를 빼고 핸들만 입력하세요.
          </p>
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
          <div className="flex items-center justify-between">
            <Label>태그 (최대 10개)</Label>
            <TagManageDialog
              tags={tags as ManageTag[]}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  <SettingsIcon className="h-3 w-3" />
                  관리
                </button>
              }
              onCreate={async (name) => {
                const res = await createTag({ name })
                if (!res.ok) {
                  toast.error(res.error.message)
                  return false
                }
                setTags((prev) => [...prev, res.data])
                toast.success("태그를 추가했어요")
                return true
              }}
              onRename={async (id, name) => {
                const res = await updateTag({ id, name })
                if (!res.ok) {
                  toast.error(res.error.message)
                  return false
                }
                setTags((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, name } : t)),
                )
                toast.success("태그 이름을 수정했어요")
                return true
              }}
              onDelete={async (id) => {
                const res = await deleteTag({ id })
                if (!res.ok) {
                  toast.error(res.error.message)
                  return false
                }
                setTags((prev) => prev.filter((t) => t.id !== id))
                setTagIds((prev) => prev.filter((tid) => tid !== id))
                toast.success("태그를 삭제했어요")
                return true
              }}
            />
          </div>
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
      </form>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>변경 사항을 저장할까요?</DialogTitle>
            <DialogDescription>
              저장하지 않으면 입력한 내용이 사라집니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={discardAndLeave}>
              버리고 나가기
            </Button>
            <Button onClick={saveAndLeave} disabled={pending}>
              저장하고 나가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
