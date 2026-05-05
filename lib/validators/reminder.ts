import { z } from "zod"

export const reminderTypeSchema = z.enum([
  "followup",
  "birthday",
  "event",
  "custom",
])

export const reminderRepeatSchema = z.enum(["none", "yearly"])
export const reminderChannelSchema = z.enum(["inapp", "webpush", "kakao"])
export const reminderStatusSchema = z.enum([
  "active",
  "done",
  "dismissed",
  "snoozed",
])

export const reminderCreateSchema = z.object({
  person_id: z.string().uuid(),
  reminder_type: reminderTypeSchema.default("followup"),
  scheduled_at: z.string().datetime(),
  repeat_rule: reminderRepeatSchema.default("none"),
  channel: reminderChannelSchema.default("inapp"),
  title: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  co_person_ids: z.array(z.string().uuid()).max(20).optional(),
  message: z.string().max(1000).optional().nullable(),
})

export const reminderCompleteSchema = z.object({
  id: z.string().uuid(),
})

export const reminderListSchema = z.object({
  status: reminderStatusSchema.optional(),
  person_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
})

export type ReminderCreateInput = z.infer<typeof reminderCreateSchema>
export type ReminderListInput = z.infer<typeof reminderListSchema>
