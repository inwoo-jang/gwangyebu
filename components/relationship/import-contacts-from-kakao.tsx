"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logContact } from "@/lib/actions/contacts"
import {
  parseKakaoExport,
  ruleBasedSummary,
  type KakaoDayBucket,
} from "@/lib/kakao/parse-export"

interface Props {
  personId: string
  personName: string
  /** 사용자 본인의 카톡 표시명 (inbound/outbound 판정) */
  selfName?: string
}

type ImportResult =
  | { kind: "txt"; days: number; logs: number }
  | { kind: "jpg"; ok: boolean }

/**
 * 인증 모드용 카카오톡 임포트.
 * - .txt: 날짜별 자동 파싱 + AI 요약 → 각 날짜 1건씩 contacts_log 등록
 * - .jpg: 사용자가 날짜 입력 + AI Vision 요약 → 1건 등록
 */
export function ImportContactsFromKakao({
  personId,
  personName,
  selfName,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [progress, setProgress] = React.useState<string>("")
  const [lastResult, setLastResult] = React.useState<ImportResult | null>(null)

  const [screenshotDate, setScreenshotDate] = React.useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })

  const txtInputRef = React.useRef<HTMLInputElement>(null)
  const jpgInputRef = React.useRef<HTMLInputElement>(null)

  const handleTxt = async (file: File) => {
    setBusy(true)
    setLastResult(null)
    try {
      const text = await file.text()
      setProgress("대화 파싱 중...")
      const parsed = parseKakaoExport(text, selfName)
      if (parsed.days.length === 0) {
        toast.error("카카오톡 대화 형식을 인식하지 못했어요")
        return
      }

      const days = parsed.days.slice(-60)
      setProgress(`${days.length}일치 발견, 요약 생성 중...`)

      let logs = 0
      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        setProgress(`${i + 1}/${days.length} — ${day.date} 요약`)
        const memo = await summarizeBucket(day, personName)
        const direction =
          day.outboundCount >= day.inboundCount ? "outbound" : "inbound"
        const occurredAt =
          day.messages[day.messages.length - 1]?.occurredAt ??
          new Date(`${day.date}T09:00:00`).toISOString()
        const res = await logContact({
          person_id: personId,
          channel: "kakao",
          direction,
          occurred_at: occurredAt,
          memo,
        })
        if (res.ok) logs += 1
      }

      setLastResult({ kind: "txt", days: days.length, logs })
      toast.success(`연락 기록 ${logs}건이 캘린더에 추가됐어요`)
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "txt 파일 처리에 실패했어요",
      )
    } finally {
      setBusy(false)
      setProgress("")
      if (txtInputRef.current) txtInputRef.current.value = ""
    }
  }

  const handleJpg = async (file: File) => {
    setBusy(true)
    setLastResult(null)
    try {
      setProgress("이미지 분석 중...")
      const fd = new FormData()
      fd.append("image", file)
      fd.append("personName", personName)
      fd.append("date", screenshotDate)

      const res = await fetch("/api/ai/summarize-image", {
        method: "POST",
        body: fd,
      })
      const json = (await res.json()) as
        | { ok: true; summary: string; model: string }
        | { ok: false; error: string }

      let memo = ""
      if (res.ok && json.ok) {
        memo = json.summary
      } else if (!res.ok && "error" in json) {
        if (json.error === "NO_ANTHROPIC_KEY") {
          toast.message(
            "AI 키가 설정되지 않아 자동 요약을 건너뜁니다. 메모는 비워두고 등록할게요.",
          )
        } else {
          toast.error(`AI 요약 실패: ${json.error}`)
        }
      }

      const logRes = await logContact({
        person_id: personId,
        channel: "kakao",
        direction: "unknown",
        occurred_at: new Date(`${screenshotDate}T09:00:00`).toISOString(),
        memo: memo || null,
      })
      if (!logRes.ok) {
        toast.error(logRes.error.message)
        return
      }

      setLastResult({ kind: "jpg", ok: Boolean(memo) })
      toast.success("스크린샷에서 연락 기록 1건 추가됐어요")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "이미지 처리에 실패했어요",
      )
    } finally {
      setBusy(false)
      setProgress("")
      if (jpgInputRef.current) jpgInputRef.current.value = ""
    }
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Upload className="h-3.5 w-3.5" />
        파일로 가져오기
      </Button>
    )
  }

  return (
    <div className="w-full rounded-xl border border-border bg-card p-3 space-y-4">
      <p className="text-xs text-muted-foreground">
        카톡 대화 .txt 또는 스크린샷 .jpg를 올리면 자동으로 연락 기록을 만들어요.
        AI 키가 서버에 설정돼 있으면 메모도 자동 요약합니다.
      </p>

      <section className="space-y-1.5">
        <Label className="text-xs font-semibold">카카오톡 .txt 내보내기</Label>
        <p className="text-[11px] text-muted-foreground">
          날짜 자동 추출 + AI 요약 (각 날짜별 1건씩 등록)
        </p>
        <input
          ref={txtInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleTxt(f)
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => txtInputRef.current?.click()}
          className="w-full"
        >
          .txt 선택
        </Button>
      </section>

      <section className="space-y-1.5 border-t border-border pt-3">
        <Label className="text-xs font-semibold">카톡 스크린샷 (.jpg)</Label>
        <p className="text-[11px] text-muted-foreground">
          날짜를 직접 입력 + AI Vision으로 요약
        </p>
        <div>
          <Label htmlFor="ss-date" className="text-[11px]">
            대화 날짜
          </Label>
          <Input
            id="ss-date"
            type="date"
            value={screenshotDate}
            onChange={(e) => setScreenshotDate(e.target.value)}
            disabled={busy}
            max={(() => {
              const d = new Date()
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
            })()}
          />
        </div>
        <input
          ref={jpgInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleJpg(f)
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !screenshotDate}
          onClick={() => jpgInputRef.current?.click()}
          className="w-full"
        >
          이미지 선택
        </Button>
      </section>

      {busy ? (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {progress || "처리 중..."}
        </p>
      ) : null}

      {lastResult ? (
        <p className="text-xs text-success">
          {lastResult.kind === "txt"
            ? `완료: ${lastResult.days}일에서 ${lastResult.logs}건 추가`
            : `완료: 1건 추가${lastResult.ok ? "" : " (메모 비움)"}`}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          닫기
        </Button>
      </div>
    </div>
  )
}

async function summarizeBucket(
  bucket: KakaoDayBucket,
  personName: string,
): Promise<string | null> {
  const text = bucket.messages.map((m) => `${m.sender}: ${m.body}`).join("\n")
  const trimmed =
    text.length > 8_000
      ? `${text.slice(0, 4_000)}\n...(중략)...\n${text.slice(-4_000)}`
      : text
  try {
    const res = await fetch("/api/ai/summarize-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personName,
        date: bucket.date,
        channel: "kakao",
        text: trimmed,
      }),
    })
    const json = (await res.json()) as
      | { ok: true; summary: string }
      | { ok: false; error: string; fallback?: string }
    if (res.ok && json.ok) return json.summary
    if (!res.ok && "fallback" in json && json.fallback) return json.fallback
    return ruleBasedSummary(bucket) || null
  } catch {
    return ruleBasedSummary(bucket) || null
  }
}
