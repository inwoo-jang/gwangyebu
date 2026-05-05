import { cookies } from "next/headers"
import { GUEST_COOKIE_NAME } from "./types"

export async function isGuestMode(): Promise<boolean> {
  const store = await cookies()
  return store.get(GUEST_COOKIE_NAME)?.value === "1"
}
