import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { canSeed, seedFixtures } from "./_helpers/seed"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("F-SETTINGS 설정", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("미인증 시 /login 리다이렉트", async ({ page }) => {
    test.skip(hasAuth(), "인증된 환경에서는 별도 케이스로 검증")
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/login/)
  })

  test("AC-ST-1 알림 스위치 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/settings")
    await expect(page.getByLabel("리마인더 알림")).toBeVisible()
    await expect(page.getByLabel("AI 추천 알림")).toBeVisible()
  })

  test("AC-ST-2 AI 프로바이더 선택 select 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/settings")
    await expect(page.getByLabel("선택")).toBeVisible()
    await page.getByLabel("선택").selectOption("gemini")
    await expect(page.getByLabel("선택")).toHaveValue("gemini")
  })

  test("AC-ST-4 JSON 다운로드 버튼 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/settings")
    await expect(
      page.getByRole("button", { name: /JSON 다운로드/ }),
    ).toBeVisible()
  })

  test("AC-AUTH-5 로그아웃 폼 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/settings")
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible()
  })
})
