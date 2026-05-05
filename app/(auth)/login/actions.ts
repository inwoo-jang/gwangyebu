"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { ok, fail, fromZod, type ActionResult } from "@/lib/actions/result"

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("올바른 이메일을 입력해 주세요"),
  password: z
    .string()
    .min(6, "비밀번호는 6자 이상이어야 해요")
    .max(72, "비밀번호가 너무 깁니다"),
  next: z.string().optional(),
})

function safeNext(next?: string): string {
  if (!next) return "/"
  return next.startsWith("/") ? next : "/"
}

/** 이메일+비밀번호 회원가입 (이메일 인증 OFF 가정 — 즉시 로그인됨). */
export async function signUpAction(input: {
  email: string
  password: string
  next?: string
}): Promise<ActionResult<{ created: true }>> {
  const parsed = credentialsSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return fail({ code: "internal", message: error.message })
  return ok({ created: true })
}

/** 이메일+비밀번호 로그인. */
export async function signInAction(input: {
  email: string
  password: string
}): Promise<ActionResult<{ signedIn: true }>> {
  const parsed = credentialsSchema.safeParse(input)
  if (!parsed.success) return fromZod(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return fail({ code: "internal", message: error.message })
  return ok({ signedIn: true })
}

/** <form action={signUp}> 폼 어더. */
export async function signUp(formData: FormData): Promise<void> {
  const result = await signUpAction({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: formData.get("next") ? String(formData.get("next")) : undefined,
  })
  if (result.ok) {
    redirect(safeNext(formData.get("next")?.toString()))
  } else {
    redirect(`/login?error=${encodeURIComponent(result.error.message)}`)
  }
}

/** <form action={signIn}> 폼 어더. */
export async function signIn(formData: FormData): Promise<void> {
  const result = await signInAction({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })
  if (result.ok) {
    redirect(safeNext(formData.get("next")?.toString()))
  } else {
    redirect(`/login?error=${encodeURIComponent(result.error.message)}`)
  }
}
