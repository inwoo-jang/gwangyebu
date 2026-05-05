import { NextResponse } from "next/server"
import { GUEST_COOKIE_NAME } from "@/lib/guest/types"

function startGuest(request: Request) {
  const url = new URL(request.url)
  const next = url.searchParams.get("next") ?? "/"
  const safeNext = next.startsWith("/") ? next : "/"

  const response = NextResponse.redirect(new URL(safeNext, request.url), 303)
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: "1",
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}

export async function POST(request: Request) {
  return startGuest(request)
}

// GET도 허용 — 공유 가능한 단일 링크로 게스트 모드 진입.
// 예: http://localhost:3000/api/guest/start
export async function GET(request: Request) {
  return startGuest(request)
}
