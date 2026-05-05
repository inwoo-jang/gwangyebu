import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { canSeed, seedFixtures } from "./_helpers/seed"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("BottomNav 네비게이션", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("모바일 viewport에서 BottomNav가 노출 (홈/검색/리마인더/설정 + 인물 추가 FAB)", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/")
    const nav = page.getByRole("navigation", { name: "주 메뉴" })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole("link", { name: /홈/ })).toBeVisible()
    await expect(nav.getByRole("link", { name: /검색/ })).toBeVisible()
    await expect(nav.getByRole("link", { name: /리마인더/ })).toBeVisible()
    await expect(nav.getByRole("link", { name: /설정/ })).toBeVisible()
    await expect(
      nav.getByRole("link", { name: "인물 추가" }),
    ).toBeVisible()
  })

  test("BottomNav에서 검색 탭 클릭 → /search 이동", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/")
    const nav = page.getByRole("navigation", { name: "주 메뉴" })
    await nav.getByRole("link", { name: /검색/ }).click()
    await expect(page).toHaveURL(/\/search/)
  })

  test("데스크톱 viewport(1280x800)에서는 BottomNav가 lg:hidden으로 가려진다", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/")
    const nav = page.getByRole("navigation", { name: "주 메뉴" })
    // lg:hidden 클래스 → display:none
    await expect(nav).toBeHidden()
  })
})
