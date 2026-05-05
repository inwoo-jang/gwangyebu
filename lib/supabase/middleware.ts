/**
 * Next.js middleware용 Supabase 세션 갱신 + 보호 라우트 가드.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { env } from "@/lib/env"
import { GUEST_COOKIE_NAME } from "@/lib/guest/types"

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/logout",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/icons",
  "/api/health",
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (request.cookies.get(GUEST_COOKIE_NAME)?.value === "1") {
    return response
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return response
  }

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options: CookieOptions
        }[],
      ) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // 세션 토큰 자동 갱신
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  if (!user && !isPublicPath(pathname) && pathname !== "/") {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  return response
}
