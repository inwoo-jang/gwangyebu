"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ContactRound, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ContactsImportGuide } from "@/components/relationship/contacts-import-guide"
import {
  isContactPickerSupported,
  parseVCard,
  pickFromContactPicker,
  type ImportedContact,
} from "@/lib/contacts/parse-vcard"
import { bulkCreatePersons } from "@/lib/actions/persons"

/**
 * 전화번호부 가져오기 (인증 모드).
 * - Contact Picker API → 시스템 picker (Chrome Android)
 * - 미지원 → vCard(.vcf) 파일 업로드 폴백
 * 가져온 항목은 서버 액션 bulkCreatePersons로 일괄 등록.
 */
export function ContactsImport() {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [supported, setSupported] = React.useState(false)

  React.useEffect(() => {
    setSupported(isContactPickerSupported())
  }, [])

  const submit = async (items: ImportedContact[]) => {
    if (items.length === 0) {
      toast.message("선택한 연락처가 없어요")
      return
    }
    const res = await bulkCreatePersons(
      items.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
      })),
    )
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    const { added, skipped } = res.data
    toast.success(
      `${added}명 추가됨${skipped > 0 ? ` (중복/오류 ${skipped}명 건너뜀)` : ""}`,
    )
    if (added > 0) router.refresh()
  }

  const handlePicker = async () => {
    setBusy(true)
    try {
      const items = await pickFromContactPicker()
      await submit(items)
    } catch (e) {
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
      await submit(items)
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
      <div className="w-full flex items-center justify-between gap-2">
        {!supported ? (
          <p className="text-[11px] text-muted-foreground">
            이 브라우저는 전화번호부 직접 접근이 막혀있어요. .vcf 파일로 가져와주세요.
          </p>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            다중 선택 가능 · 중복 자동 스킵
          </span>
        )}
        <ContactsImportGuide />
      </div>
    </div>
  )
}
