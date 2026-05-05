"use client"

import * as React from "react"
import { CreditCard, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cropImageToBusinessCard } from "@/lib/image/crop-card"

interface BusinessCardSectionProps {
  cardUrl: string | null
  personName: string
  onChange: (dataUrl: string) => void
  onClear: () => void
}

/**
 * 인물 상세에 들어가는 명함 섹션.
 * - 이미지 없을 때: 업로드 CTA
 * - 이미지 있을 때: 명함 미리보기 + 변경/삭제
 *
 * 일반 사진을 올리면 9:5 한국 명함 비율로 중앙 크롭해서 저장.
 */
export function BusinessCardSection({
  cardUrl,
  personName,
  onChange,
  onClear,
}: BusinessCardSectionProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)

  const pickFile = () => inputRef.current?.click()

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      const dataUrl = await cropImageToBusinessCard(file)
      onChange(dataUrl)
      toast.success(
        cardUrl ? "명함을 변경했어요" : "명함을 등록했어요 (9:5 자동 크롭)",
      )
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "이미지 처리에 실패했어요",
      )
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleClear = () => {
    if (!confirm("명함을 삭제할까요?")) return
    onClear()
    toast.success("명함을 삭제했어요")
  }

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">명함</h3>
        {cardUrl ? (
          <span className="text-[11px] text-muted-foreground">9:5 비율</span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {cardUrl ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardUrl}
            alt={`${personName}의 명함`}
            className="w-full rounded-xl border border-border bg-card object-contain shadow-soft"
            style={{ aspectRatio: "9 / 5" }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={pickFile}
              disabled={busy}
              className="flex-1 gap-1.5"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              변경
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={busy}
              className="gap-1.5 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pickFile}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-6 text-sm text-muted-foreground transition-colors hover:bg-accent/30"
          style={{ minHeight: "8rem" }}
        >
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>이미지 처리 중...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-6 w-6" />
              <span className="font-medium">명함 업로드</span>
              <span className="text-[11px]">
                일반 사진도 OK — 9:5 비율로 자동 크롭됩니다
              </span>
            </>
          )}
        </button>
      )}
    </section>
  )
}
