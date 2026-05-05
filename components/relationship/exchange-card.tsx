"use client"

import * as React from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Mail,
  MailX,
  MoreHorizontal,
} from "lucide-react"
import { fullDateKo } from "@/lib/format/date"
import { formatKRW } from "@/lib/format/money"
import { cn } from "@/lib/utils"

export type ExchangeKind = "event" | "gift" | "loan"
export type ExchangeFlow =
  | "sent"
  | "received"
  | "lent"
  | "borrowed"

const EVENT_TYPE_LABEL: Record<string, string> = {
  wedding: "결혼식",
  funeral: "장례식",
  firstbirthday: "돌잔치",
  birthday: "생일",
  anniversary: "기념일",
  other: "기타 경조사",
}

const KIND_BADGE: Record<ExchangeKind, { label: string; className: string }> = {
  event: { label: "경조사", className: "bg-secondary text-secondary-foreground" },
  gift: { label: "선물", className: "bg-accent/40 text-accent-foreground" },
  loan: {
    label: "대여",
    className: "bg-warning/15 text-warning",
  },
}

const FLOW_LABEL: Record<ExchangeFlow, { label: string; tone: string; Icon: React.ComponentType<{ className?: string }> }> = {
  sent: { label: "보냄", tone: "text-destructive", Icon: ArrowUpRight },
  received: { label: "받음", tone: "text-success", Icon: ArrowDownLeft },
  lent: { label: "빌려줌", tone: "text-destructive", Icon: ArrowUpRight },
  borrowed: { label: "빌림", tone: "text-success", Icon: ArrowDownLeft },
}

export interface ExchangeCardData {
  id: string
  kind: ExchangeKind
  flow: ExchangeFlow
  /** 경조사면 event_type, 선물이면 occasion, 대여면 null */
  occasion: string | null
  amount: number | null
  itemName: string | null
  occurredAt: string
  /** 대여 회수 완료일 — 있으면 회수됨 */
  returnedAt: string | null
  /** 대여 약속 회수일 (옵션) */
  dueAt: string | null
  /** 선물 준비 메시지 발송 시각 (gift 전용). null이면 미발송 */
  notifiedAt?: string | null
  memo: string | null
  personName?: string
  href?: string
}

interface ExchangeCardProps {
  data: ExchangeCardData
  onMore?: () => void
  className?: string
}

export function ExchangeCard({ data, onMore, className }: ExchangeCardProps) {
  const flowInfo = FLOW_LABEL[data.flow]
  const FlowIcon = flowInfo.Icon
  const kindBadge = KIND_BADGE[data.kind]
  const occasionLabel =
    data.kind === "event"
      ? data.occasion
        ? EVENT_TYPE_LABEL[data.occasion] ?? data.occasion
        : "경조사"
      : data.occasion ?? null
  const isLoan = data.kind === "loan"
  const isGift = data.kind === "gift"
  const isReturned = isLoan && Boolean(data.returnedAt)

  // 선물은 항목명이 본문, 금액은 부수적. 경조사/대여는 금액이 본문.
  const headline =
    isGift && data.itemName
      ? data.itemName
      : data.amount != null
        ? formatKRW(data.amount)
        : data.itemName ?? "—"

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card px-3 py-2.5 text-sm",
        isReturned ? "opacity-70" : "",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full",
            flowInfo.tone,
            "bg-current/10",
          )}
          aria-hidden
        >
          <FlowIcon className={cn("h-4 w-4", flowInfo.tone)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                kindBadge.className,
              )}
            >
              {kindBadge.label}
            </span>
            {occasionLabel ? (
              <span className="text-xs font-medium text-foreground">
                {occasionLabel}
              </span>
            ) : null}
            <span className={cn("text-[11px]", flowInfo.tone)}>
              · {flowInfo.label}
            </span>
            {data.personName ? (
              <span className="text-[11px] text-muted-foreground truncate">
                · {data.personName}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "font-semibold truncate",
                isGift ? "text-base" : "text-base tabular-nums",
              )}
            >
              {headline}
            </span>
            {/* 선물에 금액이 부가 입력된 경우만 작게 표기 */}
            {isGift && data.amount != null ? (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                ({formatKRW(data.amount)})
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
            {fullDateKo(data.occurredAt)}
            {isLoan && !isReturned && data.dueAt ? (
              <>
                <span className="mx-1">·</span>
                회수 예정 {fullDateKo(data.dueAt)}
              </>
            ) : null}
          </p>

          {data.memo ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {data.memo}
            </p>
          ) : null}

          {isGift ? (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px]">
              {data.notifiedAt ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <Mail className="h-3 w-3" />
                  {fullDateKo(data.notifiedAt)} 메시지 보냄
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MailX className="h-3 w-3" />
                  메시지 미발송
                </span>
              )}
            </div>
          ) : null}

          {isLoan ? (
            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px]">
              {isReturned ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  {fullDateKo(data.returnedAt!)} 회수
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning">
                  <Clock className="h-3 w-3" />
                  미회수
                </span>
              )}
            </div>
          ) : null}
        </div>

        {onMore ? (
          <button
            type="button"
            onClick={onMore}
            aria-label="옵션"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent/30 tap"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>
    </article>
  )
}
