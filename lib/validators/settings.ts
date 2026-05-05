import { z } from "zod"

export const aiProviderSchema = z.enum([
  "claude",
  "gemini",
  "auto",
  "rule_based",
])

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

export const notificationPrefsSchema = z.object({
  reminders: z.boolean(),
  ai: z.boolean(),
  events: z.boolean(),
  quiet_hours: z.object({
    start: z.string().regex(timeRegex),
    end: z.string().regex(timeRegex),
  }),
})

export const userSettingsUpdateSchema = z.object({
  display_name: z.string().min(1).max(30).optional(),
  ai_provider: aiProviderSchema.optional(),
  notification_prefs: notificationPrefsSchema.optional(),
  locale: z.string().min(2).max(10).optional(),
  timezone: z.string().min(2).max(50).optional(),
})

export type UserSettingsUpdateInput = z.infer<typeof userSettingsUpdateSchema>
