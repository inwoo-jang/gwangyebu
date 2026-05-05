"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Cake } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ExchangeForm } from "@/components/relationship/exchange-form"
import { createEvent } from "@/lib/actions/exchange"

interface EventQuickAddProps {
  personId: string
  personName?: string
}

function ymd(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso
}

/**
 * 인물 상세 헤더 액션줄에서 호출되는 "빠른 경조사 추가" 시트.
 * 클릭 시 ExchangeForm event 모드를 띄우고, 저장하면 곧장 server action으로 등록.
 */
export function EventQuickAdd({ personId, personName }: EventQuickAddProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-1">
          <Cake className="h-4 w-4" />
          경조사
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>경조사 추가</SheetTitle>
          <SheetDescription>
            {personName ? `${personName}님의 ` : ""}결혼식·장례식 등 경조사비 기록.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-3 pb-2">
          <ExchangeForm
            kind="event"
            onCancel={() => setOpen(false)}
            onSubmit={(v) => {
              startTransition(async () => {
                const res = await createEvent({
                  person_id: personId,
                  event_type: v.event_type,
                  occurred_at: ymd(v.occurred_at),
                  location: v.location || null,
                  attended: v.direction === "received" ? false : true,
                  amount_paid: v.amount,
                  memo: v.memo || null,
                })
                if (res.ok) {
                  setOpen(false)
                  toast.success("경조사가 기록됐어요")
                  router.refresh()
                } else {
                  toast.error(res.error.message)
                }
              })
            }}
          />
          {pending ? (
            <p className="mt-1 text-[11px] text-muted-foreground">처리 중...</p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
