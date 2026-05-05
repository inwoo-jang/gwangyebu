import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { seedFixtures, canSeed } from "./_helpers/seed"
import { mockAiAnalyze } from "./_helpers/ai-mock"
import { FIXTURE_PERSONS } from "./_helpers/fixtures"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("F-AI 관계 분석 (mocked)", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("AC-AI-2 분석 버튼 클릭 → mock 200 응답 → analysis 페이지로 이동", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await mockAiAnalyze(page, { status: 200 })
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}`)
    await page.getByRole("button", { name: /AI 관계 분석/ }).click()
    await page.waitForURL(/\/analysis$/, { timeout: 5000 })
    expect(page.url()).toContain("/analysis")
  })

  test("AC-AI-7 quota 초과 (429) → 에러 토스트", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await mockAiAnalyze(page, {
      status: 429,
      message: "오늘의 AI 분석 한도에 도달했어요.",
    })
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}`)
    await page.getByRole("button", { name: /AI 관계 분석/ }).click()
    await expect(page.getByText("오늘의 AI 분석 한도")).toBeVisible({
      timeout: 5000,
    })
  })

  test("500 실패 → 에러 토스트 + 페이지 머무름", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await mockAiAnalyze(page, { status: 500, message: "AI 분석 실패" })
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}`)
    await page.getByRole("button", { name: /AI 관계 분석/ }).click()
    await expect(page.getByText("AI 분석 실패")).toBeVisible({ timeout: 5000 })
    expect(page.url()).toContain(`/persons/${FIXTURE_PERSONS[0].id}`)
  })
})
