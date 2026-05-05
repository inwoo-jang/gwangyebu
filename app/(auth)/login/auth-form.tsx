"use client"

import * as React from "react"
import { Check, Loader2, X as XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn, signUp } from "./actions"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  next: string
}

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "taken" }
  | { kind: "invalid" }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthForm({ next }: AuthFormProps) {
  const [email, setEmail] = React.useState("")
  const [check, setCheck] = React.useState<CheckState>({ kind: "idle" })

  // debounce 중복 체크
  React.useEffect(() => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setCheck({ kind: "idle" })
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setCheck({ kind: "invalid" })
      return
    }

    setCheck({ kind: "checking" })
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
          signal: ctrl.signal,
        })
        if (!res.ok) {
          setCheck({ kind: "idle" })
          return
        }
        const data = (await res.json()) as { available: boolean | null }
        if (data.available === true) setCheck({ kind: "available" })
        else if (data.available === false) setCheck({ kind: "taken" })
        else setCheck({ kind: "idle" })
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setCheck({ kind: "idle" })
        }
      }
    }, 400)

    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [email])

  return (
    <form className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="email">이메일</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "pr-9",
              check.kind === "available" && "border-success",
              check.kind === "taken" && "border-warning",
            )}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            {check.kind === "checking" ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : check.kind === "available" ? (
              <Check className="h-4 w-4 text-success" />
            ) : check.kind === "taken" ? (
              <XIcon className="h-4 w-4 text-warning" />
            ) : null}
          </span>
        </div>
        {check.kind === "available" ? (
          <p className="text-[11px] text-success">사용 가능한 이메일이에요</p>
        ) : check.kind === "taken" ? (
          <p className="text-[11px] text-warning">
            이미 가입된 이메일입니다. 로그인을 시도해 주세요.
          </p>
        ) : null}
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
        <Button
          formAction={signIn}
          type="submit"
          className="flex-1"
          disabled={check.kind === "checking"}
        >
          로그인
        </Button>
        <Button
          formAction={signUp}
          type="submit"
          variant="outline"
          className="flex-1"
          disabled={check.kind === "taken" || check.kind === "checking"}
        >
          회원가입
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        이메일 인증 없이 즉시 가입돼요. 비밀번호는 6자 이상.
      </p>
    </form>
  )
}
