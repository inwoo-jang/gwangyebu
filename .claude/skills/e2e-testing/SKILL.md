---
name: e2e-testing
description: Playwright로 모바일 viewport 기반 E2E 테스트를 작성한다. Supabase 로컬 인스턴스 사용, AI 호출은 fixture로 대체. "E2E", "Playwright", "통합 테스트" 요청에 사용.
---

# E2E 테스트 스킬 (Playwright)

## 설정

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" },
  projects: [
    { name: "Pixel 5", use: devices["Pixel 5"] },
    { name: "iPhone 13", use: devices["iPhone 13"] },
    { name: "Desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

## 테스트 패턴

```ts
import { test, expect } from "@playwright/test"

test("인물 추가 → 리스트에 표시", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "인물 추가" }).click()
  await page.getByLabel("이름").fill("김지수")
  await page.getByLabel("MBTI").fill("ENFP")
  await page.getByRole("button", { name: "저장" }).click()

  await expect(page.getByText("김지수")).toBeVisible()
})
```

## 규칙

- 셀렉터: `getByRole`, `getByLabel`, `getByText` 우선 (test-id는 최후 수단)
- 한국어 라벨 그대로 사용
- 각 테스트는 독립적 (beforeEach에서 시드/리셋)
- AI 호출 차단: `page.route("**/api/ai/**", ...)` 로 fixture 응답
- 인증: 로그인 상태 storageState 재사용

## 시드 전략

- `tests/fixtures/seed.ts` — 테스트 사용자 + 샘플 인물 데이터
- 각 spec 시작 시 supabase admin client로 리셋 후 시드
