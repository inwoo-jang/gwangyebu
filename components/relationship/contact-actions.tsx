"use client"

import * as React from "react"
import { Phone, MessageSquare, Instagram } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  formatPhoneKo,
  smsUrl,
  telUrl,
} from "@/lib/format/phone"

interface ContactActionsProps {
  phoneNumber?: string | null
  kakaoNickname?: string | null
  instagramHandle?: string | null
  personName?: string
}

/**
 * 인물 상세에서 노출되는 컨택트 액션 줄.
 * - 전화/문자는 tel:/sms: 표준 스킴 (모바일에서 OS 다이얼러/메시지 앱으로 이동)
 * - 카톡은 1:1 채팅 직접 진입 불가 → 카톡 앱 메인 열기 + 카톡 ID(또는 이름) 클립보드 복사
 */
export function ContactActions({
  phoneNumber,
  kakaoNickname,
  instagramHandle,
  personName,
}: ContactActionsProps) {
  const tel = telUrl(phoneNumber)
  const sms = smsUrl(phoneNumber)
  const formatted = formatPhoneKo(phoneNumber)
  const cleanIg = instagramHandle?.replace(/^@/, "").trim()

  const openKakao = async () => {
    const lookup = kakaoNickname ?? personName ?? ""
    if (lookup) {
      try {
        await navigator.clipboard.writeText(lookup)
        toast.success(`'${lookup}' 복사됨 — 카톡 검색에 붙여넣어 친구 찾기`)
      } catch {
        toast.message(`카톡에서 '${lookup}'(으)로 검색하세요`)
      }
    } else {
      toast.message("카톡 앱을 엽니다")
    }
    // 모바일: 카톡 앱 메인 진입. 데스크톱: 동작 안 할 수 있음(브라우저가 무시).
    window.location.href = "kakaotalk://"
  }

  const openInstagram = () => {
    if (!cleanIg) return
    // 모바일은 instagram:// 시도 (실패 시 브라우저가 안전하게 무시), 동시에 웹 열기
    const webUrl = `https://www.instagram.com/${encodeURIComponent(cleanIg)}/`
    window.open(webUrl, "_blank", "noopener,noreferrer")
  }

  if (!phoneNumber && !kakaoNickname && !cleanIg) {
    return null
  }

  return (
    <section className="rounded-xl border border-border bg-card p-3">
      {phoneNumber ? (
        <p className="px-1 text-xs text-muted-foreground tabular-nums">
          {formatted}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {tel ? (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <a href={tel} aria-label={`${personName ?? "인물"}에게 전화`}>
              <Phone className="h-3.5 w-3.5" />
              전화
            </a>
          </Button>
        ) : null}
        {sms ? (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <a href={sms} aria-label={`${personName ?? "인물"}에게 문자`}>
              <MessageSquare className="h-3.5 w-3.5" />
              문자
            </a>
          </Button>
        ) : null}
        {kakaoNickname || personName ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={openKakao}
          >
            <span aria-hidden>💛</span>
            카톡 열기
          </Button>
        ) : null}
        {cleanIg ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={openInstagram}
            aria-label={`${personName ?? "인물"}의 인스타그램 열기`}
          >
            <Instagram className="h-3.5 w-3.5" />
            @{cleanIg}
          </Button>
        ) : null}
      </div>
      {!kakaoNickname ? null : (
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          카톡에서 <span className="font-medium text-foreground">‘{kakaoNickname}’</span> 검색
        </p>
      )}
    </section>
  )
}
