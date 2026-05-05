import Link from "next/link"
import { Sparkles } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { PersonCard } from "@/components/relationship/person-card"
import { ReminderItem } from "@/components/relationship/reminder-item"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import {
  fetchPersonsForList,
  fetchUpcomingReminders,
} from "@/lib/queries/persons"
import { getUserSettings } from "@/lib/actions/settings"
import { differenceInDays } from "date-fns"
import { colorIndexForTag } from "@/lib/format/tag"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestHome } from "@/components/guest/guest-home"

export const metadata = { title: "홈" }
export const dynamic = "force-dynamic"

function variantFor(person: {
  last_contact_at: string | null
  score?: number | null
}): "default" | "urgent" | "warning" {
  if (!person.last_contact_at) return "default"
  const days = differenceInDays(
    new Date(),
    new Date(person.last_contact_at),
  )
  const score = person.score ?? null
  if (days > 30 && score != null && score < 40) return "urgent"
  if (days > 60) return "warning"
  return "default"
}

export default async function HomePage() {
  if (await isGuestMode()) {
    return <GuestHome />
  }

  const [persons, reminders, profile] = await Promise.all([
    fetchPersonsForList({ limit: 50 }),
    fetchUpcomingReminders(3),
    getUserSettings(),
  ])

  const greeting = profile.ok && profile.data.display_name
    ? `${profile.data.display_name}님,`
    : "안녕하세요,"

  return (
    <AppShell header={<AppHeader brand />}>
      <section className="mb-6">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">
          오늘은 누구에게 안부 전해볼까요?
        </h2>
      </section>

      <section className="mb-6">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/40 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <h3 className="text-sm font-semibold">AI 추천 (M1 기본)</h3>
          </div>
          <p className="mt-2 text-sm text-foreground/80">
            인물 5명 이상 + 연락 기록 누적 시 매주 월요일 추천 카드를
            준비해드려요. 인물 상세에서 분석을 직접 시작할 수도 있어요.
          </p>
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/persons/new">+ 인맥 추가</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            다가오는 리마인더
          </h2>
          <Link
            href="/reminders"
            className="text-xs text-primary hover:underline"
          >
            모두 보기
          </Link>
        </div>
        {reminders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            예정된 리마인더가 없어요.
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            인맥 ({persons.length}명)
          </h2>
        </div>
        {persons.length === 0 ? (
          <EmptyState
            icon="👋"
            title="첫 사람을 추가해볼까요?"
            description="이름만 있어도 충분해요."
            action={{ label: "+ 인맥 추가", href: "/persons/new" }}
          />
        ) : (
          <div className="space-y-1.5">
            {persons.map((p) => (
              <PersonCard
                key={p.id}
                href={`/persons/${p.id}`}
                variant={variantFor(p)}
                person={{
                  id: p.id,
                  name: p.name,
                  photoUrl: p.photo_url,
                  relationshipType: p.relationship_type,
                  mbti: p.mbti,
                  lastContactAt: p.last_contact_at,
                  lastContactChannel: p.last_contact_channel,
                  score: p.score,
                  tags: p.tags.map((t) => ({
                    id: t.id,
                    name: t.name,
                    colorIndex: colorIndexForTag({ id: t.id, name: t.name }),
                  })),
                }}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
