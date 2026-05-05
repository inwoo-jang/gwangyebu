import { test, expect } from "@playwright/test"

test("홈 화면이 렌더링된다", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "관계부" })).toBeVisible()
})
