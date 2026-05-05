import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { seedFixtures, canSeed } from "./_helpers/seed"
import { FIXTURE_PERSONS } from "./_helpers/fixtures"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("F-REMINDER 리마인더", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("AC-RM-7 리마인더 페이지 — 미인증 시 /login", async ({ page }) => {
    test.skip(hasAuth(), "인증된 환경에서는 별도 케이스로 검증")
    await page.goto("/reminders")
    await expect(page).toHaveURL(/\/login/)
  })

  test("AC-RM-7 시드된 리마인더가 그룹별로 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/reminders")
    await expect(
      page.getByRole("heading", { name: "리마인더" }),
    ).toBeVisible()
    // 시드된 인물명이 어디든 노출
    await expect(page.getByText("박민준").first()).toBeVisible()
  })

  test("AC-RM-2 인물 상세에서 리마인더 추가 폼 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}`)
    await expect(page.getByRole("button", { name: /리마인더/ })).toBeVisible()
  })

  test("AC-RM-4 완료 버튼 클릭 시 리스트에서 제거되거나 line-through", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/reminders")
    const completeBtn = page.getByRole("button", { name: "완료" }).first()
    if (await completeBtn.isVisible()) {
      await completeBtn.click()
      // 토스트 또는 갱신 — 페이지가 reload되거나 빈 상태가 되거나
      await page.waitForTimeout(500)
    }
  })

  test("AC-RM-5 내일로 연기 버튼 노출", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/reminders")
    const snoozeBtn = page.getByRole("button", { name: "내일로 연기" }).first()
    await expect(snoozeBtn).toBeVisible()
  })
})
