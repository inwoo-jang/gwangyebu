import Link from "next/link"
import { signIn, signUp } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OAuthButtons } from "./oauth-buttons"

export const metadata = { title: "로그인" }

interface LoginPageProps {
  searchParams?: Promise<{ next?: string; error?: string; sent?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = (await searchParams) ?? {}
  const next = sp.next ?? "/"

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <header className="space-y-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="관계부"
          className="mx-auto w-full max-w-xs object-contain"
        />
        <p className="text-sm text-muted-foreground">
          잊지 않게, 흐지부지되지 않게.
          <br />
          AI 인맥 비서와 함께 시작하세요.
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

      <form className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="current-password"
            placeholder="6자 이상"
          />
        </div>
        <div className="flex gap-2">
          <Button formAction={signIn} type="submit" className="flex-1">
            로그인
          </Button>
          <Button
            formAction={signUp}
            type="submit"
            variant="outline"
            className="flex-1"
          >
            회원가입
          </Button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          이메일 인증 없이 즉시 가입돼요. 비밀번호는 6자 이상.
        </p>
      </form>

      <div className="relative my-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-2">또는</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
      </div>

      <OAuthButtons />

      <div className="relative my-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-2">또는</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
      </div>

      <form
        action={`/api/guest/start?next=${encodeURIComponent(next)}`}
        method="post"
      >
        <Button type="submit" variant="secondary" className="w-full">
          게스트로 시작하기
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          데이터는 이 브라우저에만 저장됩니다.
        </p>
      </form>

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
