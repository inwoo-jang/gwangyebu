"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/env"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("올바른 이메일을 입력해 주세요"),
  next: z.string().optional(),
})

const oauthSchema = z.object({
  provider: z.enum(["google", "kakao"]),
  next: z.string().optional(),
})

function buildRedirectUrl(next?: string): string {
  const base = env.APP_URL.replace(/\/$/, "")
  const url = new URL(`${base}/auth/callback`)
  if (next) url.searchParams.set("next", next)
  return url.toString()
}

/**
 * 프로그램 호출용. 결과를 ActionResult로 반환.
 */
export async function sendMagicLinkAction(
  input: { email: string; next?: string },
): Promise<ActionResult<{ sent: true }>> {
  const parsed = emailSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: buildRedirectUrl(parsed.data.next) },
  })

  if (error) return fail({ code: "internal", message: error.message })
  return ok({ sent: true })
}

/**
 * <form action={sendMagicLink}> 용 폼 액션.
 * 성공/실패 모두 /login?... 으로 redirect.
 */
export async function sendMagicLink(formData: FormData): Promise<void> {
  const result = await sendMagicLinkAction({
    email: String(formData.get("email") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  })
  if (result.ok) {
    redirect("/login?sent=1")
  } else {
    redirect(`/login?error=${encodeURIComponent(result.error.message)}`)
  }
}

export async function signInWithOAuthAction(formData: FormData): Promise<void> {
  const parsed = oauthSchema.safeParse({
    provider: formData.get("provider"),
    next: formData.get("next") ?? undefined,
  })
  if (!parsed.success) {
    redirect("/login?error=invalid_provider")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: { redirectTo: buildRedirectUrl(parsed.data.next) },
  })

  if (error || !data?.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`)
  }
  redirect(data.url)
}
