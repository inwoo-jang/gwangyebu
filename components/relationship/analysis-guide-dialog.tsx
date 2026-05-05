"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AnalysisGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 관계 건강도 산출 기준 가이드 모달.
 * 홈 (?) 버튼, 인물 상세 (?) 힌트 둘 다 같은 콘텐츠 재사용.
 */
export function AnalysisGuideDialog({
  open,
  onOpenChange,
}: AnalysisGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            관계 건강도 산출 기준
          </DialogTitle>
          <DialogDescription>
            친밀도 점수가 어떻게 계산되는지 안내드려요. 0~100점 척도.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <section>
            <p className="font-semibold text-foreground">기본 점수 (0~100)</p>
            <p className="mt-1 text-muted-foreground">
              마지막 연락 후 경과일 ÷ 인물의 리마인더 주기로 계산합니다.
            </p>
            <pre className="mt-1 rounded-md bg-muted p-2 text-[11px] text-foreground/80">
              {`기본 = max(0, 100 − (경과일 / 주기) × 60)`}
            </pre>
            <p className="mt-1 text-[11px] text-muted-foreground">
              예) 주기 30일 + 마지막 연락 12일 전 → 100 − 24 = <b>76점</b>
            </p>
          </section>

          <section>
            <p className="font-semibold text-foreground">보너스</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-0.5">
              <li>메모가 1건 이상 있으면 <b>+5점</b></li>
              <li>연락 이력이 3건 이상이면 <b>+5점</b></li>
            </ul>
          </section>

          <section>
            <p className="font-semibold text-foreground">밴드 (점수대 라벨)</p>
            <ul className="mt-1 grid grid-cols-3 gap-2 text-center text-[11px]">
              <li className="rounded-md bg-success/15 py-1 text-success">
                양호 70~100
              </li>
              <li className="rounded-md bg-warning/15 py-1 text-warning">
                보통 40~69
              </li>
              <li className="rounded-md bg-destructive/15 py-1 text-destructive">
                주의 0~39
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
            <p className="text-[11px] text-foreground/90">
              <b>지금은 룰 기반</b>으로 즉시 산출돼요. AI 키(Gemini/Claude)를
              연결하면 메모 내용 / 연락 패턴 / 경조사·선물 이력까지 종합한
              <b> AI 분석</b>으로 업그레이드됩니다.
            </p>
          </section>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
