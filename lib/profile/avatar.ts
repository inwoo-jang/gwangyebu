/**
 * 프로필 아바타 시스템
 * - 성별: male | female
 * - profile_index: 1~30 (각 성별마다 30개 png 보유)
 * - avatar_bg: 1~6 (파스텔 팔레트)
 *
 * 이미지 경로: /profiles/{male|female}/{1..30}.png
 */

export type Gender = "male" | "female"

export const PROFILE_IMAGE_COUNT = 30
export const AVATAR_BG_COUNT = 6

export const DEFAULT_GENDER: Gender = "female"
export const DEFAULT_PROFILE_INDEX = 1
export const DEFAULT_AVATAR_BG = 1

/** 파스텔 6색 팔레트 (HSL — globals 토큰과 별개로 인라인 사용) */
export const PASTEL_BG: { id: number; label: string; hsl: string }[] = [
  { id: 1, label: "연한 살구", hsl: "20 90% 92%" },
  { id: 2, label: "민트", hsl: "150 60% 90%" },
  { id: 3, label: "라일락", hsl: "270 50% 92%" },
  { id: 4, label: "스카이", hsl: "200 70% 92%" },
  { id: 5, label: "버터", hsl: "50 80% 90%" },
  { id: 6, label: "로즈", hsl: "340 60% 92%" },
]

export function profileImageUrl(
  gender: Gender,
  index: number = DEFAULT_PROFILE_INDEX,
): string {
  const safe = Math.max(1, Math.min(PROFILE_IMAGE_COUNT, index))
  return `/profiles/${gender}/${safe}.png`
}

export function pastelBgStyle(bgId: number = DEFAULT_AVATAR_BG): {
  backgroundColor: string
} {
  const found = PASTEL_BG.find((p) => p.id === bgId) ?? PASTEL_BG[0]
  return { backgroundColor: `hsl(${found.hsl})` }
}
