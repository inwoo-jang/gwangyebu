import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * OAuth / Magic-link 콜백.
 * Supabase가 ?code=... 로 리다이렉트한 뒤, 세션 쿠키를 굽고 next로 보낸다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      )
    }
  }

  // 외부 리다이렉트 방지: next는 반드시 path만 허용
  const safeNext = next.startsWith("/") ? next : "/"
  return NextResponse.redirect(`${origin}${safeNext}`)
}
