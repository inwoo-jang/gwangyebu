/**
 * 태그 색상 매핑 — color hex가 있으면 사용하지 않고 (별도 처리),
 * 없을 때 id 또는 name 해시로 1..8 colorIndex를 자동 배정.
 */

export function colorIndexForTag(input: { id?: string; name: string }): number {
  const seed = input.id ?? input.name
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 8) + 1
}
