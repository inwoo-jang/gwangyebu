import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { PersonCardSkeleton } from "@/components/relationship/person-card"

export function GuestLoading({ title = "관계부" }: { title?: string }) {
  return (
    <AppShell header={<AppHeader title={title} />}>
      <div className="space-y-3 pt-2">
        <PersonCardSkeleton />
        <PersonCardSkeleton />
        <PersonCardSkeleton />
      </div>
    </AppShell>
  )
}
