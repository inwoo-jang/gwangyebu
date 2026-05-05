import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { PersonCardSkeleton } from "@/components/relationship/person-card"

export default function Loading() {
  return (
    <AppShell header={<AppHeader title="불러오는 중..." />}>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <PersonCardSkeleton key={i} />
        ))}
      </div>
    </AppShell>
  )
}
