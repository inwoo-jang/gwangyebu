import Link from "next/link"
import { sendMagicLink, signInWithOAuthAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
      {sp.sent ? (
        <p
          role="status"
          className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          로그인 링크를 보냈어요. 메일을 확인해 주세요.
        </p>
      ) : null}

      <form action={sendMagicLink} className="space-y-3">
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
        <Button type="submit" className="w-full">
          로그인 링크 받기
        </Button>
      </form>

      <div className="relative my-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-2">또는</span>
        <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        <form action={signInWithOAuthAction}>
          <input type="hidden" name="provider" value="google" />
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="outline" className="w-full">
            Google로 계속하기
          </Button>
        </form>
        <form action={signInWithOAuthAction}>
          <input type="hidden" name="provider" value="kakao" />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#FEE500] px-4 py-2 text-sm font-medium text-[#181600] transition-opacity hover:opacity-90"
          >
            카카오로 계속하기
          </button>
        </form>
      </div>

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
