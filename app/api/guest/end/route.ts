import { NextResponse } from "next/server"
import { GUEST_COOKIE_NAME } from "@/lib/guest/types"

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303)
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  })
  return response
}
