"use client"

import * as React from "react"
import { useGuestStore } from "./store"

/**
 * Zustand persist는 클라이언트에서 비동기로 localStorage를 rehydrate한다.
 * SSR/첫 CSR 렌더에서는 store가 default 값(빈 배열)이므로
 * 실제 데이터에 의존하는 화면은 hydrate 완료 후에만 렌더해야 한다.
 */
export function useGuestHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    if (useGuestStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useGuestStore.persist.onFinishHydration(() =>
      setHydrated(true),
    )
    return unsub
  }, [])

  return hydrated
}
