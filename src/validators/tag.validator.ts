import { z } from 'zod';

// ─── Shared: Translated Field ────────────────────────────────────────────────

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

// ─── Create ──────────────────────────────────────────────────────────────────

export const createTagSchema = z.object({
  name: translatedFieldSchema,
  isActive: z.boolean().optional().default(true),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateTagSchema = z.object({
  name: translatedFieldSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;

// ─── List / Search Query ─────────────────────────────────────────────────────

export const listTagsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type ListTagsInput = z.infer<typeof listTagsSchema>;
