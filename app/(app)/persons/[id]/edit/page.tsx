import { notFound } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { PersonForm } from "@/components/relationship/person-form"
import { fetchPersonDetail } from "@/lib/queries/persons"
import { listTags } from "@/lib/actions/tags"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestPersonForm } from "@/components/guest/guest-person-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "인물 편집" }

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPersonPage({ params }: EditPageProps) {
  const { id } = await params
  if (await isGuestMode()) {
    return <GuestPersonForm mode="edit" personId={id} />
  }

  const [detail, tagsRes] = await Promise.all([
    fetchPersonDetail(id),
    listTags(),
  ])
  if (!detail) notFound()

  const tags = tagsRes.ok ? tagsRes.data : []

  return (
    <AppShell
      header={
        <AppHeader title="인물 편집" back={{ href: `/persons/${id}` }} />
      }
    >
      <PersonForm
        mode="edit"
        availableTags={tags}
        initial={{
          id: detail.person.id,
          name: detail.person.name,
          relationship_type: detail.person.relationship_type,
          birth_year: detail.person.birth_year,
          birth_month: detail.person.birth_month,
          birth_day: detail.person.birth_day,
          mbti: detail.person.mbti,
          how_we_met: detail.person.how_we_met,
          food_preference: detail.person.food_preference,
          memo: detail.person.memo,
          reminder_interval_days: detail.person.reminder_interval_days,
          tag_ids: detail.tags.map((t) => t.id),
        }}
      />
    </AppShell>
  )
}
