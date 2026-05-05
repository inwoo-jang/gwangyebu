/**
 * Supabase admin client로 E2E 픽스처 시드/리셋.
 *
 * 환경변수 요구:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - E2E_TEST_USER_ID  (시드 대상 사용자)
 *
 * 위 환경변수가 누락되면 시드 함수는 `null`을 반환한다 → spec에서 graceful skip.
 */

import {
  FIXTURE_PERSONS,
  FIXTURE_TAGS,
  FIXTURE_CONTACT_LOGS,
  FIXTURE_REMINDERS,
} from "./fixtures"

export interface SeedResult {
  userId: string
  personIds: string[]
  reminderIds: string[]
}

export function canSeed(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.E2E_TEST_USER_ID,
  )
}

/**
 * 동적으로 supabase-js를 import한다 (헬퍼가 import만 되고 실행 안 될 때 의존 비용 회피).
 */
async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function resetUser(userId: string): Promise<void> {
  if (!canSeed()) return
  const admin = await getAdminClient()
  // FK cascade가 걸려있다고 가정 — persons 삭제로 연쇄 삭제.
  await admin.from("reminders").delete().eq("user_id", userId)
  await admin.from("contacts_log").delete().eq("user_id", userId)
  await admin.from("notes").delete().eq("user_id", userId)
  await admin.from("person_tags").delete().eq("user_id", userId)
  await admin.from("tags").delete().eq("user_id", userId)
  await admin.from("persons").delete().eq("user_id", userId)
}

export async function seedFixtures(
  userId?: string,
): Promise<SeedResult | null> {
  const uid = userId ?? process.env.E2E_TEST_USER_ID
  if (!canSeed() || !uid) return null

  const admin = await getAdminClient()

  await resetUser(uid)

  await admin.from("persons").insert(
    FIXTURE_PERSONS.map((p) => ({
      ...p,
      user_id: uid,
      status: "active",
    })),
  )
  await admin.from("tags").insert(
    FIXTURE_TAGS.map((t) => ({
      ...t,
      user_id: uid,
    })),
  )
  await admin.from("contacts_log").insert(
    FIXTURE_CONTACT_LOGS.map((c) => ({
      ...c,
      user_id: uid,
    })),
  )
  await admin.from("reminders").insert(
    FIXTURE_REMINDERS.map(({ person_name: _ignore, ...r }) => ({
      ...r,
      user_id: uid,
    })),
  )

  return {
    userId: uid,
    personIds: FIXTURE_PERSONS.map((p) => p.id),
    reminderIds: FIXTURE_REMINDERS.map((r) => r.id),
  }
}
