/**
 * 한국 휴대폰 번호 표기 유틸.
 * 입력은 숫자만 추출, 표시 시 010-1234-5678 형식.
 */

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "")
}

export function formatPhoneKo(raw: string | null | undefined): string {
  if (!raw) return ""
  const d = digitsOnly(raw)
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length > 3 && d.length <= 7)
    return `${d.slice(0, 3)}-${d.slice(3)}`
  return d
}

export function telUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const d = digitsOnly(raw)
  if (d.length < 9) return null
  return `tel:${d}`
}

export function smsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const d = digitsOnly(raw)
  if (d.length < 9) return null
  return `sms:${d}`
}
