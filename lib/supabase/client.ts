/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 * - NEXT_PUBLIC_ 환경 변수 사용
 * - 쿠키 기반 세션 (Supabase SSR)
 */
import { createBrowserClient } from "@supabase/ssr"
import { env } from "@/lib/env"

export function createClient() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}
