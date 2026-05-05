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
        title="기록이 없어요"
        description="경조사, 선물, 금전 대여 내역 등을 추가해보세요."
      />
    </AppShell>
  )
}
