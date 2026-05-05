/**
 * 서버 액션 표준 결과 타입.
 * { ok: true, data } | { ok: false, error: { code, message, fields? } }
 */
import type { ZodError } from "zod"

export type ActionError = {
  code:
    | "validation"
    | "unauthorized"
    | "not_found"
    | "forbidden"
    | "conflict"
    | "internal"
  message: string
  fields?: Record<string, string[]>
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail<T = never>(error: ActionError): ActionResult<T> {
  return { ok: false, error }
}

export function fromZod<T = never>(err: ZodError): ActionResult<T> {
  const fields: Record<string, string[]> = {}
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_"
    fields[key] = fields[key] ?? []
    fields[key].push(issue.message)
  }
  return fail({ code: "validation", message: "입력값이 올바르지 않습니다", fields })
}
