/**
 * 런타임 환경 변수 접근. 클라이언트에서는 NEXT_PUBLIC_ 접두어 변수만 사용.
 */
export const env = {
  // Public
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  // Server only
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  AI_DEFAULT_PROVIDER: (process.env.AI_DEFAULT_PROVIDER ?? "anthropic") as
    | "anthropic"
    | "gemini",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
} as const
