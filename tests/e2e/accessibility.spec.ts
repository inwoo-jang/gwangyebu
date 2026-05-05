import { test, expect } from "@playwright/test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { hasAuth, hasE2EDb } from "./_helpers/auth"
import { canSeed, seedFixtures } from "./_helpers/seed"

const requiresAuth = !hasAuth()
const requiresDb = !hasE2EDb() || !canSeed()

/**
 * axe-core를 페이지에 인젝션하고 실행한다.
 * 외부 npm 패키지(@axe-core/playwright)에 의존하지 않고 axe-core/axe.min.js를 직접 사용.
 *
 * 본 테스트는 critical 위반만 차단한다. color-contrast(serious)는
 * 디자인 시스템 토큰 변경이 필요한 별도 이슈로 추적 — 본 spec에서는 로그만 남긴다.
 */
const IGNORED_RULES = new Set<string>([
  // 디자인 시스템 색 토큰 점진 개선 — 추후 별도 검증.
  "color-contrast",
])

async function runAxe(
  page: import("@playwright/test").Page,
): Promise<{ violations: Array<{ id: string; impact: string | null; description: string }> }> {
  // node_modules 경로에서 axe.min.js 읽기
  const axeSrc = readFileSync(
    join(process.cwd(), "node_modules/axe-core/axe.min.js"),
    "utf-8",
  )
  await page.addScriptTag({ content: axeSrc })
  return page.evaluate(async () => {
    // @ts-expect-error axe is injected globally
    const result = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    })
    return {
      violations: result.violations.map((v: {
        id: string
        impact: string | null
        description: string
      }) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
      })),
    }
  })
}

function blockingViolations(
  violations: Array<{ id: string; impact: string | null; description: string }>,
) {
  return violations.filter(
    (v) =>
      !IGNORED_RULES.has(v.id) &&
      (v.impact === "critical" || v.impact === "serious"),
  )
}

test.describe("접근성 (axe-core)", () => {
  test.beforeEach(async () => {
    if (canSeed()) {
      await seedFixtures()
    }
  })

  test("로그인 페이지는 critical/serious 위반이 없다", async ({ page }) => {
    await page.goto("/login")
    const { violations } = await runAxe(page)
    const blocking = blockingViolations(violations)
    expect(
      blocking,
      `Violations: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([])
  })

  test("홈 페이지(인증)는 critical/serious 위반이 없다", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/")
    const { violations } = await runAxe(page)
    const blocking = blockingViolations(violations)
    expect(
      blocking,
      `Violations: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([])
  })

  test("검색 페이지(인증)는 critical/serious 위반이 없다", async ({ page }) => {
    test.skip(
      requiresAuth || requiresDb,
      "auth + supabase local + seed 미설정으로 건너뜀",
    )
    await page.goto("/search")
    const { violations } = await runAxe(page)
    const blocking = blockingViolations(violations)
    expect(
      blocking,
      `Violations: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([])
  })
})
