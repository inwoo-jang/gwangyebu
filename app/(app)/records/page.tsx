import { isGuestMode } from "@/lib/guest/mode"
import { GuestRecords } from "@/components/guest/guest-records"
import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { EmptyState } from "@/components/common/empty-state"

export const metadata = { title: "기록" }
export const dynamic = "force-dynamic"

export default async function RecordsPage() {
  if (await isGuestMode()) {
    return <GuestRecords />
  }
  return (
    <AppShell header={<AppHeader title="주고받은 기록" />}>
      <EmptyState
        icon="🎁"
        title="기록 (M2)"
        description="경조사·선물·대여 통합 관리 — 인증 모드는 추후 마이그레이션 후 활성화됩니다. 지금은 게스트 모드에서 사용해보세요."
      />
    </AppShell>
  )
}
