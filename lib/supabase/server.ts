/**
 * 서버 컴포넌트 / 서버 액션 / 라우트 핸들러용 Supabase 클라이언트.
 * - next/headers cookies()로 세션 관리
 */
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { env } from "@/lib/env"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options: CookieOptions
        }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component 컨텍스트(읽기 전용)에서 호출되면 무시.
          // middleware에서 세션 갱신을 처리하므로 안전.
        }
      },
    },
  })
}

/**
 * service_role 키를 사용하는 서버 전용 admin 클라이언트.
 * 절대 클라이언트(브라우저)에 노출 금지.
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        /* no-op */
      },
    },
  })
}
