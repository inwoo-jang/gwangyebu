import { z } from "zod"

export const relationshipTypeSchema = z.enum([
  "family",
  "friend",
  "colleague",
  "client",
  "acquaintance",
  "lover",
  "crush",
  "custom",
  "etc",
])

export const personStatusSchema = z.enum(["active", "inactive"])

const mbtiRegex = /^[EI][SN][TF][JP]$/

export const genderSchema = z.enum(["female", "male"])

export const personCreateSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요").max(50),
  nickname: z.string().trim().max(30).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  gender: genderSchema.default("female"),
  profile_index: z.number().int().min(1).max(30).default(1),
  avatar_bg: z.number().int().min(1).max(6).default(1),
  relationship_type: relationshipTypeSchema.default("etc"),
  relationship_label: z.string().trim().max(30).optional().nullable(),
  phone_number: z.string().trim().max(20).optional().nullable(),
  kakao_nickname: z.string().trim().max(50).optional().nullable(),
  instagram_handle: z.string().trim().max(30).optional().nullable(),
  birth_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .nullable(),
  birth_month: z.number().int().min(1).max(12).optional().nullable(),
  birth_day: z.number().int().min(1).max(31).optional().nullable(),
  mbti: z
    .string()
    .toUpperCase()
    .regex(mbtiRegex, "올바른 MBTI 4글자")
    .optional()
    .nullable(),
  food_preference: z.string().max(200).optional().nullable(),
  how_we_met: z.string().max(100).optional().nullable(),
  memo: z.string().max(2000).optional().nullable(),
  reminder_interval_days: z.number().int().min(0).max(365).default(30),
  business_card_url: z.string().url().optional().nullable(),
  status: personStatusSchema.default("active"),
  tag_ids: z.array(z.string().uuid()).max(10).optional(),
})

export const personUpdateSchema = personCreateSchema.partial().extend({
  id: z.string().uuid(),
})

export const personIdSchema = z.object({ id: z.string().uuid() })

export const personListSchema = z.object({
  query: z.string().max(50).optional(),
  relationship_types: z.array(relationshipTypeSchema).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  status: personStatusSchema.optional(),
  include_deleted: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type PersonCreateInput = z.infer<typeof personCreateSchema>
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>
export type PersonListInput = z.infer<typeof personListSchema>
