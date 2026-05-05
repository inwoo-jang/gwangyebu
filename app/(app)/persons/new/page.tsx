import { AppShell } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { PersonForm } from "@/components/relationship/person-form"
import { listTags } from "@/lib/actions/tags"
import { isGuestMode } from "@/lib/guest/mode"
import { GuestPersonForm } from "@/components/guest/guest-person-form"
import { GuestContactsImport } from "@/components/guest/guest-contacts-import"

export const metadata = { title: "새 인맥 추가" }
export const dynamic = "force-dynamic"

export default async function NewPersonPage() {
  if (await isGuestMode()) {
    return (
      <GuestPersonForm
        mode="create"
        preContent={
          <>
            <p className="text-sm text-muted-foreground">
              이름만 있으면 충분해요. 나머지는 나중에 채워도 OK!
            </p>
            <section className="mt-3 rounded-xl border border-border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold">한 번에 여러 명 가져오기</p>
              <GuestContactsImport />
            </section>
          </>
        }
      />
    )
  }

  const tagsRes = await listTags()
  const tags = tagsRes.ok ? tagsRes.data : []

  return (
    <AppShell header={<AppHeader title="새 인맥 추가" back={{ href: "/" }} />}>
      <p className="mb-4 text-sm text-muted-foreground">
        이름만 있으면 충분해요. 나머지는 나중에 채워도 OK!
      </p>
      <PersonForm mode="create" availableTags={tags} />
    </AppShell>
  )
}
