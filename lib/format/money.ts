/**
 * 한국 원화 포매팅.
 * - 1,234,000원 형식
 * - null/undefined 시 "—"
 */
export function formatKRW(amount: number | null | undefined): string {
  if (amount == null) return "—"
  return `${amount.toLocaleString("ko-KR")}원`
}

export function parseKRW(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "")
  if (!digits) return null
  return Number(digits)
}
