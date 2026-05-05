import { z } from "zod"

const colorRegex = /^#[0-9A-Fa-f]{6}$/

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1, "태그명").max(20),
  color: z.string().regex(colorRegex).optional().nullable(),
})

export const tagAttachSchema = z.object({
  person_id: z.string().uuid(),
  tag_id: z.string().uuid(),
})

export const tagDetachSchema = tagAttachSchema

export const tagUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "태그명").max(20),
})

export const tagIdSchema = z.object({
  id: z.string().uuid(),
})

export type TagCreateInput = z.infer<typeof tagCreateSchema>
export type TagAttachInput = z.infer<typeof tagAttachSchema>
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>
