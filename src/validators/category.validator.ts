import { z } from 'zod'

// ─── Shared: Translated Field ────────────────────────────────────────────────

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

const optionalTranslatedFieldSchema = z
  .object({
    en: z.string().trim().optional().default(''),
    ru: z.string().trim().optional().default(''),
  })
  .optional()
  .default({ en: '', ru: '' });

// ─── Create ──────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: translatedFieldSchema,
  description: optionalTranslatedFieldSchema,
  parent: z.string().optional().nullable().default(null),
  image: z.string().optional().nullable().default(null),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateCategorySchema = z.object({
  name: translatedFieldSchema.optional(),
  description: z
    .object({
      en: z.string().trim().optional(),
      ru: z.string().trim().optional(),
    })
    .optional(),
  parent: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ─── List / Search Query ─────────────────────────────────────────────────────

export const listCategoriesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  parent: z.string().optional(),
});

export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
