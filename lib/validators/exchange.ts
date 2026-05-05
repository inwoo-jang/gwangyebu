import { z } from "zod"

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식")

export const eventTypeSchema = z.enum([
  "wedding",
  "funeral",
  "firstbirthday",
  "birthday",
  "anniversary",
  "other",
])

export const giftDirectionSchema = z.enum(["sent", "received"])
export const giftKindSchema = z.enum(["cash", "item"])
export const loanDirectionSchema = z.enum(["lent", "borrowed"])

export const eventCreateSchema = z.object({
  person_id: z.string().uuid(),
  event_type: eventTypeSchema,
  occurred_at: ymd,
  location: z.string().trim().max(100).optional().nullable(),
  attended: z.boolean().optional().nullable(),
  amount_paid: z.number().int().min(0).optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
})
export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().uuid(),
})
export const eventIdSchema = z.object({ id: z.string().uuid() })

export const giftCreateSchema = z
  .object({
    person_id: z.string().uuid(),
    linked_event_id: z.string().uuid().optional().nullable(),
    direction: giftDirectionSchema,
    kind: giftKindSchema,
    amount: z.number().int().min(0).optional().nullable(),
    item_name: z.string().trim().min(1).max(50).optional().nullable(),
    estimated_value: z.number().int().min(0).optional().nullable(),
    occurred_at: ymd,
    reason: z.string().trim().max(100).optional().nullable(),
    notified_at: z.string().datetime().optional().nullable(),
  })
  .refine(
    (v) =>
      (v.kind === "cash" && v.amount != null && !v.item_name) ||
      (v.kind === "item" && !!v.item_name),
    { message: "현금이면 amount, 물품이면 item_name 필수" },
  )
export const giftUpdateSchema = z.object({
  id: z.string().uuid(),
  linked_event_id: z.string().uuid().optional().nullable(),
  direction: giftDirectionSchema.optional(),
  kind: giftKindSchema.optional(),
  amount: z.number().int().min(0).optional().nullable(),
  item_name: z.string().trim().min(1).max(50).optional().nullable(),
  estimated_value: z.number().int().min(0).optional().nullable(),
  occurred_at: ymd.optional(),
  reason: z.string().trim().max(100).optional().nullable(),
  notified_at: z.string().datetime().optional().nullable(),
})
export const giftIdSchema = z.object({ id: z.string().uuid() })

export const loanCreateSchema = z.object({
  person_id: z.string().uuid(),
  direction: loanDirectionSchema,
  amount: z.number().int().min(1, "0원 초과여야 해요"),
  occurred_at: ymd,
  due_at: ymd.optional().nullable(),
  returned_at: ymd.optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
})
export const loanUpdateSchema = z.object({
  id: z.string().uuid(),
  direction: loanDirectionSchema.optional(),
  amount: z.number().int().min(1).optional(),
  occurred_at: ymd.optional(),
  due_at: ymd.optional().nullable(),
  returned_at: ymd.optional().nullable(),
  memo: z.string().max(500).optional().nullable(),
})
export const loanIdSchema = z.object({ id: z.string().uuid() })

export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type GiftCreateInput = z.infer<typeof giftCreateSchema>
export type LoanCreateInput = z.infer<typeof loanCreateSchema>
