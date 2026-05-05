"use client"

import { create } from "zustand"

/**
 * 일시적 UI 상태 (persist 안 함).
 * 페이지 간 통신: 예) 홈에서 다중선택 모드일 때 + FAB 숨기기.
 */
interface UiStore {
  /** 우하단 + FAB을 강제로 숨길지 */
  hideFab: boolean
  setHideFab: (hide: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  hideFab: false,
  setHideFab: (hideFab) => set({ hideFab }),
}))
