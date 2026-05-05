import Link from "next/link"
import { Cake, Sparkles } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { ReminderItem } from "@/components/relationship/reminder-item"
import { HomePersonsList } from "@/components/relationship/home-persons-list"
import { ProfileAvatar } from "@/components/relationship/profile-avatar"
import { CollapsibleSection } from "@/components/ui/collapsible-section"
import { Button } from "@/components/ui/button"
import {
  fetchPersonsForList,
  fetchUpcomingReminders,
} from "@/lib/queries/persons"
import { getUserSettings } from "@/lib/actions/settings"
import { listTags } from "@/lib/actions/tags"
import { fullDateKo } from "@/lib/format/date"
import {
  describeDaysUntil,
  findUpcomingBirthdays,
} from "@/lib/birthday"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestHome } from "@/components/guest/guest-home"
import { createClient } from "@/lib/supabase/server"
import type { Gift } from "@/lib/supabase/types"

export const metadata = { title: "홈" }
export const dynamic = "force-dynamic"

export default async function HomePage() {
  if (await isGuestMode()) {
    return <GuestHome />
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 다가오는 생일에 쓸 모든 gifts (선물 이력 카운트용)
  const giftsRes = user
    ? await supabase
        .from("gifts")
        .select("person_id, direction")
        .eq("user_id", user.id)
    : { data: [] as Pick<Gift, "person_id" | "direction">[] }
  const allGifts = (giftsRes.data ?? []) as Pick<
    Gift,
    "person_id" | "direction"
  >[]

  const [persons, reminders, profile, tagsRes] = await Promise.all([
    fetchPersonsForList({ limit: 200 }),
    fetchUpcomingReminders(3),
    getUserSettings(),
    listTags(),
  ])

  const allTags = tagsRes.ok ? tagsRes.data : []

  const upcomingBirthdays = findUpcomingBirthdays(persons, allGifts, {
    withinDays: 30,
  })

  const greeting =
    profile.ok && profile.data.display_name
      ? `${profile.data.display_name}님,`
      : "안녕하세요,"

  return (
    <AppShell header={<AppHeader brand />}>
      <section className="mb-4">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">
          오늘은 누구에게 안부 전해볼까요?
        </h2>
      </section>

      {persons.length === 0 ? (
        <section className="mb-6">
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/40 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-sm font-semibold">시작하기</h3>
            </div>
            <p className="mt-2 text-sm text-foreground/80">
              인맥을 추가하고 연락·기록을 쌓으면 관계 건강도가 자동으로 잡혀요.
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/persons/new">+ 인맥 추가</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {upcomingBirthdays.length > 0 ? (
        <CollapsibleSection
          icon={<Cake className="h-4 w-4 text-primary" />}
          title="다가오는 생일"
          meta={`${upcomingBirthdays.length}명`}
          defaultOpen
          className="mb-6 border-primary/30"
        >
          <ul className="space-y-2">
            {upcomingBirthdays.slice(0, 3).map((u) => (
              <li
                key={u.person.id}
                className="flex items-center gap-3 rounded-lg bg-accent/20 p-2"
              >
                <ProfileAvatar
                  gender={u.person.gender}
                  profileIndex={u.person.profile_index}
                  bgId={u.person.avatar_bg}
                  name={u.person.name}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/persons/${u.person.id}`}
                    className="text-sm font-semibold hover:underline truncate"
                  >
                    {u.person.name}
                    {u.person.nickname ? (
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({u.person.nickname})
                      </span>
                    ) : null}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="text-primary font-medium">
                      {describeDaysUntil(u.daysUntil)}
                    </span>{" "}
                    · {fullDateKo(u.nextBirthday)}
                    {u.hasGiftHistory ? (
                      <>
                        <span className="mx-1">·</span>🎁 주고받은 사람
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
            {upcomingBirthdays.length > 3 ? (
              <li className="text-center text-[11px] text-muted-foreground">
                +{upcomingBirthdays.length - 3}명 더{" "}
                <Link
                  href="/records"
                  className="text-primary hover:underline"
                >
                  선물 탭에서 보기
                </Link>
              </li>
            ) : null}
          </ul>
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        icon="🔔"
        title="다가오는 리마인더"
        meta={
          reminders.length > 0 ? (
            <Link
              href="/reminders"
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              모두 보기
            </Link>
          ) : (
            "0건"
          )
        }
        defaultOpen
        className="mb-6"
      >
        {reminders.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            예정된 리마인더가 없어요.
          </p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <ReminderItem key={r.id} reminder={r} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <HomePersonsList persons={persons} allTags={allTags} />
    </AppShell>
  )
}
