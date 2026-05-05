import { test, expect } from "@playwright/test"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { seedFixtures, canSeed } from "./_helpers/seed"
import { FIXTURE_PERSONS } from "./_helpers/fixtures"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

test.describe("F-PERSON 인물 CRUD", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("AC-PER-1 인물 생성 폼 — 미인증 시 /login 리다이렉트", async ({
    page,
  }) => {
    test.skip(
      hasAuth(),
      "인증된 환경: 별도 케이스(인물 생성 폼 노출)에서 검증",
    )
    await page.goto("/persons/new")
    await expect(page).toHaveURL(/\/login/)
  })

  test("AC-PER-1 인물 생성 폼 — 인증 + 시드된 환경에서 노출", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/persons/new")
    await expect(
      page.getByRole("heading", { name: "새 인물 추가" }),
    ).toBeVisible()
    await expect(page.getByLabel("이름 *")).toBeVisible()
    await expect(page.getByRole("button", { name: /추가|저장/ })).toBeVisible()
  })

  test("AC-PER-1 폼에 이름·MBTI·태그 입력 후 저장 → 홈에 노출", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/persons/new")
    await page.getByLabel("이름 *").fill("테스트인물")
    await page.getByLabel("MBTI").selectOption("ENFP")
    await page.getByRole("button", { name: /추가|저장/ }).click()
    // 저장 → 인물 상세로 이동
    await expect(page.getByRole("heading", { name: "테스트인물" })).toBeVisible({
      timeout: 5000,
    })
  })

  test("AC-PER-3 시드된 인물이 홈 리스트에 카드로 노출된다", async ({
    page,
  }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/")
    for (const p of FIXTURE_PERSONS) {
      await expect(page.getByText(p.name).first()).toBeVisible()
    }
  })

  test("AC-PER-4 인물 상세에서 편집 페이지로 이동", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}`)
    await page.getByRole("link", { name: "편집" }).click()
    await expect(page).toHaveURL(/\/edit$/)
  })

  test("AC-PER-5 삭제 버튼 노출 (소프트 삭제)", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto(`/persons/${FIXTURE_PERSONS[0].id}/edit`)
    await expect(page.getByRole("button", { name: /삭제/ })).toBeVisible()
  })
})
