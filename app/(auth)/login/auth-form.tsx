"use client"

import * as React from "react"
import { ArrowRight, Check, Eye, EyeOff, Loader2, X as XIcon } from "lucide-react"
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

type Mode = "signin" | "signup"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthForm({ next }: AuthFormProps) {
  const [mode, setMode] = React.useState<Mode>("signin")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirm, setPasswordConfirm] = React.useState("")
  const [nickname, setNickname] = React.useState("")
  const [check, setCheck] = React.useState<CheckState>({ kind: "idle" })
  const [showPassword, setShowPassword] = React.useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false)

  const isSignup = mode === "signup"
  const passwordsMatch =
    !isSignup || password === "" || passwordConfirm === password
  const passwordTooShort = isSignup && password.length > 0 && password.length < 6
  const canSubmit =
    !isSignup ||
    (nickname.trim().length > 0 &&
      password.length >= 6 &&
      password === passwordConfirm &&
      check.kind !== "taken" &&
      check.kind !== "checking")

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
    <div className="space-y-3">
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
                isSignup && check.kind === "available" && "border-success",
                isSignup && check.kind === "taken" && "border-warning",
              )}
            />
            {isSignup ? (
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                {check.kind === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : check.kind === "available" ? (
                  <Check className="h-4 w-4 text-success" />
                ) : check.kind === "taken" ? (
                  <XIcon className="h-4 w-4 text-warning" />
                ) : null}
              </span>
            ) : null}
          </div>
          {isSignup && check.kind === "available" ? (
            <p className="text-[11px] text-success">사용 가능한 이메일이에요</p>
          ) : isSignup && check.kind === "taken" ? (
            <p className="text-[11px] text-warning">
              이미 가입된 이메일입니다. 로그인을 시도해 주세요.
            </p>
          ) : null}
        </div>

        {isSignup ? (
          <div className="space-y-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              name="nickname"
              required
              maxLength={30}
              autoComplete="nickname"
              placeholder="앱에서 부를 이름"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "6자 이상" : "비밀번호"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "비밀번호 가리기" : "비밀번호 보기"}
              aria-pressed={showPassword}
              tabIndex={-1}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          </div>
          {passwordTooShort ? (
            <p className="text-[11px] text-warning">
              비밀번호는 6자 이상이어야 해요.
            </p>
          ) : null}
        </div>

        {isSignup ? (
          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="다시 한 번 입력"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={cn(
                  "pr-9",
                  passwordConfirm.length > 0 &&
                    !passwordsMatch &&
                    "border-destructive",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                aria-label={
                  showPasswordConfirm ? "비밀번호 가리기" : "비밀번호 보기"
                }
                aria-pressed={showPasswordConfirm}
                tabIndex={-1}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {showPasswordConfirm ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordConfirm.length > 0 && !passwordsMatch ? (
              <p className="text-[11px] text-destructive">
                비밀번호가 일치하지 않아요.
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          formAction={isSignup ? signUp : signIn}
          type="submit"
          className="w-full"
          disabled={!canSubmit}
        >
          {isSignup ? "회원가입" : "로그인"}
        </Button>

        {isSignup ? (
          <p className="text-center text-[11px] text-muted-foreground">
            이메일 인증 없이 즉시 가입돼요. 비밀번호는 6자 이상.
          </p>
        ) : null}
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(isSignup ? "signin" : "signup")}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {isSignup ? "이미 계정이 있어요. 로그인 하기" : "회원가입 하기"}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
