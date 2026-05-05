import { test, expect } from "@playwright/test"
import { hasAuth } from "./_helpers/auth"

test.describe("F-AUTH 로그인", () => {
  test("로그인 페이지가 렌더링된다", async ({ page }) => {
    await page.goto("/login")
    await expect(
      page.getByRole("heading", { name: "관계부", level: 1 }),
    ).toBeVisible()
    await expect(page.getByLabel("이메일")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "로그인 링크 받기" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Google로 계속하기" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "카카오로 계속하기" }),
    ).toBeVisible()
  })

  test("이메일 미입력 시 폼 제출이 차단된다 (HTML5 required)", async ({
    page,
  }) => {
    await page.goto("/login")
    const submitBtn = page.getByRole("button", {
      name: "로그인 링크 받기",
    })
    await submitBtn.click()
    // HTML5 required: 폼은 여전히 /login에 머무른다
    await expect(page).toHaveURL(/\/login/)
  })

  test("AC-AUTH-4 미인증 시 보호 라우트는 /login으로 리다이렉트된다", async ({
    page,
  }) => {
    test.skip(
      hasAuth(),
      "인증된 환경에서는 본 테스트(미인증 리다이렉트)를 건너뜀",
    )
    await page.goto("/persons/new")
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
  })

  test("이미 인증된 next 파라미터는 폼 hidden input에 보존된다", async ({
    page,
  }) => {
    await page.goto("/login?next=%2Fpersons%2Fnew")
    const next = page.locator('input[name="next"]').first()
    await expect(next).toHaveValue("/persons/new")
  })

  test("error 쿼리스트링이 있으면 alert가 노출된다", async ({ page }) => {
    await page.goto("/login?error=%EC%83%98%ED%94%8C%20%EC%97%90%EB%9F%AC")
    // Next.js route announcer도 role=alert를 가지므로 텍스트로 좁힌다.
    await expect(page.getByText("샘플 에러")).toBeVisible()
  })
})
