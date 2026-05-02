import { z } from 'zod';

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

export const createCategoryFilterSchema = z.object({
  name: translatedFieldSchema,
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryFilterInput = z.infer<typeof createCategoryFilterSchema>;

export const updateCategoryFilterSchema = z.object({
  name: translatedFieldSchema.optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryFilterInput = z.infer<typeof updateCategoryFilterSchema>;

export const listCategoryFiltersSchema = z.object({
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type ListCategoryFiltersInput = z.infer<typeof listCategoryFiltersSchema>;
