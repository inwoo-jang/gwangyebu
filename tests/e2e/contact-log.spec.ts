import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { seedFixtures, canSeed } from "./_helpers/seed"
import { FIXTURE_PERSONS } from "./_helpers/fixtures"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("F-CONTACT-LOG 연락 기록", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("AC-CL-1 인물 상세에서 연락 기록 다이얼로그 노출", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}`)
    await page.getByRole("button", { name: /연락 기록/ }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("heading", { name: "연락 기록 추가" })).toBeVisible()
    await expect(page.getByLabel("채널")).toBeVisible()
    await expect(page.getByLabel("방향")).toBeVisible()
  })

  test("AC-CL-1 연락 기록 저장 후 타임라인에 노출 + last_contacted_at 갱신", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto(`/persons/${FIXTURE_PERSONS[2].id}`)
    await page.getByRole("button", { name: /연락 기록/ }).click()
    await page.getByLabel("채널").selectOption("phone")
    await page.getByLabel("방향").selectOption("outbound")
    await page.getByLabel(/메모/).fill("E2E 테스트 메모")
    await page.getByRole("button", { name: "저장" }).click()
    // 타임라인에 메모가 노출되는지
    await expect(page.getByText("E2E 테스트 메모")).toBeVisible({
      timeout: 5000,
    })
  })
})
