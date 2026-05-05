"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

/**
 * OAuth 로그인 버튼 (Google / Kakao).
 * 현재 OAuth provider 미설정 상태이므로 클릭 시 토스트만 띄우고 비활성화.
 * provider 등록 끝나면 onClick을 server action으로 교체.
 */
export function OAuthButtons() {
  const showComingSoon = () => {
    toast.message("해당 기능은 준비중입니다.")
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={showComingSoon}
      >
        Google로 계속하기
      </Button>
      <button
        type="button"
        onClick={showComingSoon}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#FEE500] px-4 py-2 text-sm font-medium text-[#181600] transition-opacity hover:opacity-90"
      >
        카카오로 계속하기
      </button>
    </div>
  )
}
