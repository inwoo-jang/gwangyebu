import { notFound } from "next/navigation"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestPersonDetail } from "@/components/guest/guest-person-detail"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TagChip } from "@/components/relationship/tag-chip"
import { RelationshipScoreGauge } from "@/components/relationship/relationship-score-gauge"
import { EventTimeline, type TimelineItem } from "@/components/relationship/event-timeline"
import { ReminderItem } from "@/components/relationship/reminder-item"
import { LogContactDialog } from "@/components/contact/log-contact-dialog"
import { ReminderCreateForm } from "@/components/relationship/reminder-create-form"
import { NoteAddForm } from "@/components/relationship/note-add-form"
import { AnalyzeButton } from "@/components/relationship/analyze-button"
import { fetchPersonDetail } from "@/lib/queries/persons"
import {
  RELATIONSHIP_TYPE_LABEL,
} from "@/lib/format/relationship"
import { daysAgoKo, fullDateKo } from "@/lib/format/date"
import { colorIndexForTag } from "@/lib/format/tag"

export const dynamic = "force-dynamic"

interface PersonDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PersonDetailPageProps) {
  const { id } = await params
  if (await isGuestMode()) {
    return { title: "인물" }
  }
  const detail = await fetchPersonDetail(id)
  return { title: detail?.person.name ?? "인물" }
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const { id } = await params
  if (await isGuestMode()) {
    return <GuestPersonDetail personId={id} />
  }
  const detail = await fetchPersonDetail(id)
  if (!detail) notFound()

  const { person, tags, contacts, notes, score, upcomingReminder } = detail
  const relInfo = RELATIONSHIP_TYPE_LABEL[person.relationship_type]

  const timeline: TimelineItem[] = [
    ...contacts.map<TimelineItem>((c) => ({
      kind: "contact",
      data: c,
      ts: c.occurred_at,
    })),
    ...notes.map<TimelineItem>((n) => ({
      kind: "note",
      data: n,
      ts: n.created_at,
    })),
  ]

  const initials = person.name.trim().slice(0, 1)
  const birthday =
    person.birth_month && person.birth_day
      ? `${person.birth_year ? `${person.birth_year}.` : ""}${person.birth_month}월 ${person.birth_day}일`
      : null

  return (
    <AppShell
      header={
        <AppHeader
          title={person.name}
          back={{ href: "/" }}
          actions={
            <Button asChild size="icon" variant="ghost" aria-label="편집">
              <Link href={`/persons/${person.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      }
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {person.photo_url ? (
              <AvatarImage src={person.photo_url} alt={person.name} />
            ) : null}
            <AvatarFallback className="bg-secondary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {person.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {relInfo.label}
              {person.mbti ? ` · ${person.mbti}` : ""}
              {birthday ? ` · 🎂 ${birthday}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {person.last_contact_at
                ? `마지막 연락 ${daysAgoKo(person.last_contact_at)} (${fullDateKo(person.last_contact_at)})`
                : "아직 연락 기록이 없어요"}
            </p>
          </div>
          <RelationshipScoreGauge score={score?.score ?? null} size="md" />
        </div>

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <TagChip
                key={t.id}
                tag={{
                  id: t.id,
                  name: t.name,
                  colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                }}
                size="sm"
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        <LogContactDialog personId={person.id} />
        <ReminderCreateForm personId={person.id} />
        <AnalyzeButton personId={person.id} />
        <Button asChild variant="ghost" disabled className="opacity-60">
          <span>🎁 경조사</span>
        </Button>
      </section>

      {upcomingReminder ? (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            다음 리마인더
          </h3>
          <ReminderItem
            reminder={{ ...upcomingReminder, person_name: person.name }}
          />
        </section>
      ) : null}

      {(person.memo ||
        person.how_we_met ||
        person.food_preference) ? (
        <section className="mt-5 space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
          {person.how_we_met ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                알게 된 경로
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{person.how_we_met}</p>
            </div>
          ) : null}
          {person.food_preference ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                음식 취향
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">
                {person.food_preference}
              </p>
            </div>
          ) : null}
          {person.memo ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">메모</p>
              <p className="mt-0.5 whitespace-pre-wrap">{person.memo}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">타임라인</h3>
        </div>
        <EventTimeline items={timeline} />
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          새 메모 추가
        </h3>
        <NoteAddForm personId={person.id} />
      </section>
    </AppShell>
  )
}
