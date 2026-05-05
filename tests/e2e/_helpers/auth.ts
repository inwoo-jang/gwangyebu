/**
 * Playwright 인증 헬퍼.
 *
 * 전략:
 *  1. 환경변수 `E2E_TEST_USER_ACCESS_TOKEN`이 있으면 Supabase 쿠키로 storageState 구성.
 *  2. 없으면 `hasAuth()`가 false → spec에서 `test.skip(!hasAuth(), ...)` 로 graceful skip.
 *  3. `loginViaStorageState(page)`는 미인증 시 `/login`으로 가서 페이지 자체만 검증하도록 fallback 동작.
 *
 * 실제 OAuth/이메일 흐름은 외부 서비스에 의존하므로 자동화하지 않는다.
 */

import { type BrowserContext, type Page } from "@playwright/test"

export function hasAuth(): boolean {
  return Boolean(process.env.E2E_TEST_USER_ACCESS_TOKEN)
}

export function hasE2EDb(): boolean {
  return Boolean(
    process.env.E2E_DB ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost") &&
        process.env.SUPABASE_SERVICE_ROLE_KEY),
  )
}

/**
 * Supabase access_token을 쿠키로 주입한다.
 * (실 운영에서는 supabase ssr 라이브러리가 더 복잡한 쿠키 포맷을 사용 — 이 헬퍼는 fallback용)
 */
export async function injectSupabaseSession(
  context: BrowserContext,
  baseURL = "http://localhost:3000",
): Promise<void> {
  const token = process.env.E2E_TEST_USER_ACCESS_TOKEN
  const refresh = process.env.E2E_TEST_USER_REFRESH_TOKEN ?? ""
  if (!token) return

  const url = new URL(baseURL)
  await context.addCookies([
    {
      name: "sb-access-token",
      value: token,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "sb-refresh-token",
      value: refresh,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ])
}

/**
 * 로그인이 가능하면 인증 상태로, 아니면 미인증 그대로 / 페이지로 이동.
 * 반환값: 로그인 성공 여부.
 */
export async function tryAuthenticate(page: Page): Promise<boolean> {
  if (!hasAuth()) return false
  await injectSupabaseSession(page.context(), page.url() || undefined)
  return true
}
