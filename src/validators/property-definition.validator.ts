import { z } from 'zod';

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID');
const propertyValueSchema = z.string().min(1, 'Property value is required').trim();

// ─── Create ──────────────────────────────────────────────────────────────────

export const createPropertyDefinitionSchema = z.object({
  name: translatedFieldSchema,
  categories: z.array(objectIdSchema).min(1, 'At least one category is required'),
  values: z.array(propertyValueSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
  showInListing: z.boolean().optional().default(false),
});

export type CreatePropertyDefinitionInput = z.infer<typeof createPropertyDefinitionSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const updatePropertyDefinitionSchema = z.object({
  name: translatedFieldSchema.optional(),
  categories: z.array(objectIdSchema).min(1, 'At least one category is required').optional(),
  values: z.array(propertyValueSchema).optional(),
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
  category: objectIdSchema.optional(),
});

export type ListPropertyDefinitionsInput = z.infer<typeof listPropertyDefinitionsSchema>;
