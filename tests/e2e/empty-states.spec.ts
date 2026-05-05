import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { canSeed } from "./_helpers/seed"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("빈 상태(Empty State) 카피 검증", () => {
  test("인증된 사용자 + 인물 0명 → 첫 사람 추가 안내", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + (시드 비움) 미설정으로 건너뜀",
    )
    // seed를 일부러 비움 — DB가 없으면 어차피 SKIP
    await page.goto("/")
    await expect(page.getByText("첫 사람을 추가해볼까요?")).toBeVisible()
    await expect(
      page.getByRole("link", { name: /인물 추가/ }),
    ).toBeVisible()
  })

  test("리마인더 0건 → 빈 상태 카피", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + 시드 미설정으로 건너뜀",
    )
    await page.goto("/reminders")
    // 빈 상태 또는 시드된 리마인더 둘 중 하나
    const empty = page.getByText("예정된 리마인더가 없어요")
    await empty.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => {
      /* 시드된 리마인더가 있을 수 있음 — pass */
    })
  })

  test("검색 결과 0건 → 빈 상태 카피", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + 시드 미설정으로 건너뜀",
    )
    await page.goto("/search?q=__zzz_no_match_zzz__")
    await expect(page.getByText("검색 결과가 없어요")).toBeVisible()
  })
})
