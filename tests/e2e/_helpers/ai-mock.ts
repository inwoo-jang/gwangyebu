/**
 * AI 호출 mock — Playwright `page.route`로 결정적 응답을 주입한다.
 *
 * - `/api/ai/analyze`는 200 + RelationshipScoreRecord 또는 사용자가 지정한 status로.
 * - 외부 LLM 도메인(Anthropic/Gemini)도 차단.
 */

import type { Page, Route } from "@playwright/test"
import { FIXTURE_AI_ANALYSIS } from "./fixtures"

interface MockOptions {
  status?: number
  body?: unknown
  message?: string
}

export async function mockAiAnalyze(
  page: Page,
  opts: MockOptions = {},
): Promise<void> {
  const status = opts.status ?? 200
  const body =
    opts.body ??
    (status === 200
      ? FIXTURE_AI_ANALYSIS
      : status === 429
        ? {
            error: "quota_exceeded",
            message: opts.message ?? "오늘의 AI 분석 한도에 도달했어요.",
          }
        : { error: "analysis_failed", message: opts.message ?? "AI 분석 실패" })

  await page.route("**/api/ai/analyze", async (route: Route) => {
    if (route.request().method() !== "POST") {
      return route.fallback()
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    })
  })

  // LLM 외부 직접 호출도 차단 (서버에서 호출하지만 안전망).
  await page.route("**://api.anthropic.com/**", (route) =>
    route.abort("blockedbyclient"),
  )
  await page.route("**://generativelanguage.googleapis.com/**", (route) =>
    route.abort("blockedbyclient"),
  )
}
