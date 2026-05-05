"use client"

import * as React from "react"
import { useGuestStore } from "@/lib/guest/store"

/**
 * 첫 진입 시 빈 store에 샘플 데이터 시드.
 * Hydration 이후에 한 번 호출.
 */
export function GuestBootstrap() {
  const ensureSeeded = useGuestStore((s) => s.ensureSeeded)
  React.useEffect(() => {
    ensureSeeded()
  }, [ensureSeeded])
  return null
}
