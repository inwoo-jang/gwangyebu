"use client"

import * as React from "react"
import { ContactRound, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useGuestStore } from "@/lib/guest/store"
import {
  isContactPickerSupported,
  parseVCard,
  pickFromContactPicker,
  type ImportedContact,
} from "@/lib/contacts/parse-vcard"
import {
  DEFAULT_AVATAR_BG,
  DEFAULT_GENDER,
  DEFAULT_PROFILE_INDEX,
} from "@/lib/profile/avatar"
import { digitsOnly } from "@/lib/format/phone"

/**
 * 전화번호부 가져오기.
 * - Contact Picker API 지원 (Chrome Android) → 시스템 picker
 * - 미지원 → vCard (.vcf) 파일 업로드 폴백
 *
 * 가져온 항목은 새 인물로 일괄 등록. 이름이 없으면 스킵.
 */
export function GuestContactsImport() {
  const persons = useGuestStore((s) => s.persons)
  const createPerson = useGuestStore((s) => s.createPerson)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [supported, setSupported] = React.useState(false)

  React.useEffect(() => {
    setSupported(isContactPickerSupported())
  }, [])

  const importBatch = (items: ImportedContact[]) => {
    // 이름 또는 전화번호로 중복 제거
    const existingNames = new Set(persons.map((p) => p.name.trim()))
    const existingPhones = new Set(
      persons
        .map((p) => digitsOnly(p.phone_number ?? ""))
        .filter((d) => d.length >= 9),
    )
    let added = 0
    let skipped = 0
    for (const c of items) {
      const name = c.name.trim()
      if (!name) {
        skipped += 1
        continue
      }
      const phoneDigits = digitsOnly(c.phone ?? "")
      if (
        existingNames.has(name) ||
        (phoneDigits.length >= 9 && existingPhones.has(phoneDigits))
      ) {
        skipped += 1
        continue
      }
      createPerson({
        name,
        photo_url: null,
        gender: DEFAULT_GENDER,
        profile_index: DEFAULT_PROFILE_INDEX,
        avatar_bg: DEFAULT_AVATAR_BG,
        relationship_type: "etc",
        phone_number: phoneDigits || null,
        kakao_nickname: null,
        instagram_handle: null,
        birth_year: null,
        birth_month: null,
        birth_day: null,
        mbti: null,
        food_preference: null,
        how_we_met: null,
        memo: c.email ? `이메일: ${c.email}` : null,
        reminder_interval_days: 60,
      })
      existingNames.add(name)
      if (phoneDigits.length >= 9) existingPhones.add(phoneDigits)
      added += 1
    }
    return { added, skipped }
  }

  const handlePicker = async () => {
    setBusy(true)
    try {
      const items = await pickFromContactPicker()
      if (items.length === 0) {
        toast.message("선택한 연락처가 없어요")
        return
      }
      const { added, skipped } = importBatch(items)
      toast.success(
        `${added}명 추가됨${skipped > 0 ? ` (중복 ${skipped}명 건너뜀)` : ""}`,
      )
    } catch (e) {
      // 사용자가 picker를 취소한 경우 등은 조용히 무시
      const msg = e instanceof Error ? e.message : "연락처 가져오기 실패"
      if (!/cancel|abort/i.test(msg)) toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const handleVcf = async (file: File) => {
    setBusy(true)
    try {
      const text = await file.text()
      const items = parseVCard(text)
      if (items.length === 0) {
        toast.error("vCard에서 연락처를 찾지 못했어요")
        return
      }
      const { added, skipped } = importBatch(items)
      toast.success(
        `${added}명 추가됨${skipped > 0 ? ` (중복 ${skipped}명 건너뜀)` : ""}`,
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "파일 처리 실패")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".vcf,text/vcard,text/x-vcard"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleVcf(f)
        }}
      />
      {supported ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handlePicker}
          disabled={busy}
          className="gap-1.5"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ContactRound className="h-3.5 w-3.5" />
          )}
          전화번호부에서 가져오기
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="gap-1.5"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        .vcf 파일 가져오기
      </Button>
      {!supported ? (
        <p className="w-full text-[11px] text-muted-foreground">
          이 브라우저에서는 전화번호부 직접 접근이 막혀 있어요. iOS/안드로이드 연락처에서 ‘vCard로 내보내기’ 후 .vcf 파일을 올려주세요.
        </p>
      ) : null}
    </div>
  )
}
