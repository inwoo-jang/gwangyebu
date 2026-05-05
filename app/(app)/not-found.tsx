import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-3xl">🤔</p>
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없어요</h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        주소가 변경되었거나 삭제되었을 수 있어요.
      </p>
      <Button asChild>
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </main>
  )
}
