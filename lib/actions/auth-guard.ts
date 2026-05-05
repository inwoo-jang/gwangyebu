/**
 * 서버 액션에서 현재 사용자 ID를 보장한다.
 */
import { createClient } from "@/lib/supabase/server"
import { fail, type ActionResult } from "@/lib/actions/result"

export async function requireUser(): Promise<
  | { ok: true; userId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: ActionResult<never> }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false,
      error: fail({ code: "unauthorized", message: "로그인이 필요합니다" }),
    }
  }
  return { ok: true, userId: user.id, supabase }
}
