import { z } from 'zod';

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

// ─── Create ──────────────────────────────────────────────────────────────────

export const createPropertyDefinitionSchema = z.object({
  name: translatedFieldSchema,
  isActive: z.boolean().optional().default(true),
  showInListing: z.boolean().optional().default(false),
});

export type CreatePropertyDefinitionInput = z.infer<typeof createPropertyDefinitionSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const updatePropertyDefinitionSchema = z.object({
  name: translatedFieldSchema.optional(),
  isActive: z.boolean().optional(),
  showInListing: z.boolean().optional(),
});

export type UpdatePropertyDefinitionInput = z.infer<typeof updatePropertyDefinitionSchema>;

// ─── List / Search Query ─────────────────────────────────────────────────────

export const listPropertyDefinitionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type ListPropertyDefinitionsInput = z.infer<typeof listPropertyDefinitionsSchema>;
