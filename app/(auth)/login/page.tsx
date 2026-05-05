import Link from "next/link"
import { OAuthButtons } from "./oauth-buttons"
import { AuthForm } from "./auth-form"

export const metadata = { title: "로그인" }

interface LoginPageProps {
  searchParams?: Promise<{ next?: string; error?: string; sent?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = (await searchParams) ?? {}
  const next = sp.next ?? "/"

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-5 px-5 py-8 sm:justify-center sm:py-12">
      <header className="space-y-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="관계부"
          className="mx-auto w-auto max-w-[180px] object-contain"
        />
        <p className="text-xs text-muted-foreground">
          잊지 않게, 흐지부지되지 않게 — AI 인맥 비서
        </p>
      </header>

      {sp.error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {decodeURIComponent(sp.error)}
        </p>
      ) : null}

      <AuthForm next={next} />

      <div className="relative my-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-2">또는</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
      </div>

      <OAuthButtons />

      <p className="text-center text-xs text-muted-foreground">
        가입 시{" "}
        <Link href="/" className="underline">
          이용약관
        </Link>{" "}
        및 개인정보처리방침에 동의한 것으로 간주됩니다.
      </p>
    </main>
  )
}
