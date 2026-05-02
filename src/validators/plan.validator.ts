import { z } from 'zod';

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

export const createPlanSchema = z.object({
  name: translatedFieldSchema,
  downloadCredits: z.coerce.number().int().min(0),
  durationDays: z.coerce.number().int().min(1),
  priceCents: z.coerce.number().int().min(0),
  isPopular: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z.object({
  name: translatedFieldSchema.optional(),
  downloadCredits: z.coerce.number().int().min(0).optional(),
  durationDays: z.coerce.number().int().min(1).optional(),
  priceCents: z.coerce.number().int().min(0).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export const listPlansSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type ListPlansInput = z.infer<typeof listPlansSchema>;
