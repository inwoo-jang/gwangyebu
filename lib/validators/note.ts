import { z } from "zod"

export const noteCreateSchema = z.object({
  person_id: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  pinned: z.boolean().default(false),
})

export const noteUpdateSchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(5000).optional(),
  pinned: z.boolean().optional(),
})

export const noteIdSchema = z.object({ id: z.string().uuid() })

export type NoteCreateInput = z.infer<typeof noteCreateSchema>
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>
