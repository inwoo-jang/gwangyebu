import { notFound, redirect } from "next/navigation"
import { Sparkles } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { RelationshipScoreGauge } from "@/components/relationship/relationship-score-gauge"
import { AnalyzeButton } from "@/components/relationship/analyze-button"
import { LogContactDialog } from "@/components/contact/log-contact-dialog"
import { ReminderCreateForm } from "@/components/relationship/reminder-create-form"
import { fetchPersonDetail } from "@/lib/queries/persons"
import { bandFor, urgencyLabel, urgencyToneClass } from "@/lib/format/score"
import { fullDateKo } from "@/lib/format/date"
import { isGuestMode } from "@/lib/guest/mode"

export const dynamic = "force-dynamic"
export const metadata = { title: "AI 관계 분석" }

interface AnalysisPageProps {
  params: Promise<{ id: string }>
}

interface Factor {
  label: string
  evidence: string
  weight?: number
}

interface Suggestion {
  type: "contact" | "event" | "gift" | "note"
  message: string
  urgency: "low" | "med" | "high"
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = await params
  if (await isGuestMode()) {
    redirect(`/persons/${id}`)
  }
  const detail = await fetchPersonDetail(id)
  if (!detail) notFound()

  const score = detail.score
  const factors = (score?.factors as { factors?: Factor[] } | null)?.factors as
    | Factor[]
    | undefined
  const suggestions = (
    score?.factors as { suggestions?: Suggestion[] } | null
  )?.suggestions as Suggestion[] | undefined
  const info = bandFor(score?.score ?? null)

  return (
    <AppShell
      header={
        <AppHeader
          title="AI 관계 분석"
          back={{ href: `/persons/${id}` }}
        />
      }
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <RelationshipScoreGauge score={score?.score ?? null} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {detail.person.name}님의 관계 건강도
            </p>
            <p className={`text-xl font-semibold ${info.toneClass}`}>
              {info.label}
            </p>
            {score?.computed_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                분석일: {fullDateKo(score.computed_at)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                아직 분석 결과가 없어요.
              </p>
            )}
          </div>
        </div>
        {score?.last_reason ? (
          <p className="mt-4 rounded-lg bg-accent/40 p-3 text-sm text-accent-foreground">
            <Sparkles className="mr-1 inline h-4 w-4 align-text-bottom text-primary" />
            {score.last_reason}
          </p>
        ) : null}
      </section>

      {factors && factors.length > 0 ? (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            평가 요인
          </h3>
          <ul className="space-y-2">
            {factors.map((f, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{f.label}</p>
                  {typeof f.weight === "number" ? (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        f.weight >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {f.weight > 0 ? `+${f.weight}` : f.weight}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.evidence}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {suggestions && suggestions.length > 0 ? (
        <section className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            제안 액션
          </h3>
          <ul className="space-y-2">
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                className={`rounded-lg border p-3 ${urgencyToneClass(s.urgency)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {urgencyLabel(s.urgency)}
                  </span>
                  <span className="text-xs font-medium">
                    {labelFor(s.type)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{s.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.type === "contact" ? (
                    <LogContactDialog personId={id} />
                  ) : null}
                  {s.type === "note" || s.type === "event" ? (
                    <ReminderCreateForm personId={id} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-xl border border-dashed border-border p-4 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          최신 데이터를 반영하려면 다시 분석해보세요.
        </p>
        <AnalyzeButton personId={id} />
      </section>
    </AppShell>
  )
}

function labelFor(type: Suggestion["type"]): string {
  switch (type) {
    case "contact":
      return "연락하기"
    case "event":
      return "기념일/이벤트"
    case "gift":
      return "선물"
    case "note":
      return "메모"
  }
}
