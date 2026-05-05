import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AddFab } from "@/components/layout/add-fab"
import { env } from "@/lib/env"
import { isGuestMode } from "@/lib/guest/mode"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const guest = await isGuestMode()

  if (!guest) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      redirect("/login")
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }
  }

  return (
    <>
      {children}
      <AddFab />
      <BottomNav />
    </>
  )
}
