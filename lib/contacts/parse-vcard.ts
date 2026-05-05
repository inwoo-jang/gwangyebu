/**
 * 매우 단순한 vCard (3.0 / 4.0) 파서.
 * 명세 전부를 지원하진 않고, 일반적인 export 결과(이름·전화·이메일)만 추출.
 */

export interface ImportedContact {
  name: string
  phone: string | null
  email: string | null
}

export function parseVCard(text: string): ImportedContact[] {
  const blocks = text
    .split(/BEGIN:VCARD/i)
    .slice(1)
    .map((b) => b.split(/END:VCARD/i)[0] ?? "")
    .filter((b) => b.trim().length > 0)

  const out: ImportedContact[] = []
  for (const block of blocks) {
    const lines = unfoldLines(block).split(/\r?\n/)
    let name = ""
    let phone: string | null = null
    let email: string | null = null
    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue

      // FN:이름  또는 FN;CHARSET=UTF-8:이름
      if (/^FN(?:;[^:]*)?:/i.test(line)) {
        name = line.replace(/^FN(?:;[^:]*)?:/i, "").trim()
      }
      // N:Family;Given;...
      else if (!name && /^N(?:;[^:]*)?:/i.test(line)) {
        const v = line.replace(/^N(?:;[^:]*)?:/i, "").trim()
        const parts = v.split(";")
        // Korean order: family + given (e.g., "김;지수;;;") → "김지수"
        name = (parts[0] + (parts[1] ?? "")).trim() || parts.join(" ").trim()
      }
      // TEL...:
      else if (!phone && /^TEL(?:;[^:]*)?:/i.test(line)) {
        phone = line.replace(/^TEL(?:;[^:]*)?:/i, "").trim()
      }
      // EMAIL...:
      else if (!email && /^EMAIL(?:;[^:]*)?:/i.test(line)) {
        email = line.replace(/^EMAIL(?:;[^:]*)?:/i, "").trim()
      }
    }
    if (name) out.push({ name, phone, email })
  }
  return out
}

/** vCard는 라인 폴딩(다음 줄이 공백/탭으로 시작)을 쓸 수 있어 평탄화. */
function unfoldLines(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "")
}

/**
 * Web Contact Picker API 사용 가능 여부 (Chrome Android에서만 true).
 */
export function isContactPickerSupported(): boolean {
  if (typeof navigator === "undefined") return false
  // @ts-expect-error — 'contacts' is not in lib.dom.d.ts yet
  return typeof navigator.contacts?.select === "function"
}

interface ContactInfo {
  name?: string[]
  tel?: string[]
  email?: string[]
}

/**
 * Contact Picker API를 호출해 사용자가 고른 연락처 배열을 반환.
 * 미지원 브라우저에서는 호출 전 isContactPickerSupported로 분기할 것.
 */
export async function pickFromContactPicker(): Promise<ImportedContact[]> {
  // @ts-expect-error — Web Contact Picker API typing
  const picked = (await navigator.contacts.select(
    ["name", "tel", "email"],
    { multiple: true },
  )) as ContactInfo[]
  return picked
    .map((c) => ({
      name: (c.name?.[0] ?? "").trim(),
      phone: c.tel?.[0] ?? null,
      email: c.email?.[0] ?? null,
    }))
    .filter((c) => c.name.length > 0)
}
