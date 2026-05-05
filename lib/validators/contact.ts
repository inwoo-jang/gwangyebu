import { z } from "zod"

export const contactChannelSchema = z.enum([
  "phone",
  "kakao",
  "sms",
  "email",
  "inperson",
  "other",
])

export const contactDirectionSchema = z.enum([
  "outbound",
  "inbound",
  "unknown",
])

export const contactLogCreateSchema = z.object({
  person_id: z.string().uuid(),
  channel: contactChannelSchema.default("other"),
  direction: contactDirectionSchema.default("unknown"),
  occurred_at: z.string().datetime().optional(),
  memo: z.string().max(500).optional().nullable(),
})

export type ContactLogCreateInput = z.infer<typeof contactLogCreateSchema>
