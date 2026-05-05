import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { seedFixtures, canSeed } from "./_helpers/seed"
import { FIXTURE_PERSONS } from "./_helpers/fixtures"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("F-SEARCH 검색·필터", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("검색 페이지 — 미인증 시 /login", async ({ page }) => {
    test.skip(hasAuth(), "인증된 환경에서는 별도 케이스로 검증")
    await page.goto("/search")
    await expect(page).toHaveURL(/\/login/)
  })

  test("AC-SR-1 검색바에 입력 → URL ?q= 갱신 (디바운스)", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/search")
    await page.getByLabel("인물 검색").fill("김지수")
    await page.waitForURL(/q=/, { timeout: 2000 })
    expect(page.url()).toContain("q=")
  })

  test("AC-SR-3 관계유형 필터 칩 클릭 → URL ?types= 갱신", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/search")
    await page.getByRole("button", { name: "친구" }).click()
    await page.waitForURL(/types=/, { timeout: 2000 })
    expect(page.url()).toContain("types=friend")
  })

  test("결과 0건 시 빈 상태 카피 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/search?q=__zzz_no_match_zzz__")
    await expect(page.getByText("검색 결과가 없어요")).toBeVisible()
  })

  test("시드된 인물 이름으로 검색 → 결과 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto(`/search?q=${encodeURIComponent("최수아")}`)
    await expect(
      page.getByText(FIXTURE_PERSONS[2].name).first(),
    ).toBeVisible()
  })
})
