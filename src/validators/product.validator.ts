import { z } from 'zod';

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

// ─── Product Property (definition ID + value) ───────────────────────────────

const productPropertySchema = z.object({
  definition: z.string().min(1, 'Property definition ID is required'),
  value: z.string().min(1, 'Property value is required').trim(),
});

// ─── Create ──────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: translatedFieldSchema,
  description: optionalTranslatedFieldSchema,
  thumbnail: z.string().trim().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  price: z.coerce.number().min(0).optional().default(0),
  properties: z.array(productPropertySchema).optional().default([]),
  fileFormats: z.array(z.string().trim().toUpperCase()).optional().default([]),
  weight: z.string().trim().optional().default(''),
  size: z.string().trim().optional().default(''),
  isActive: z.boolean().optional().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateProductSchema = z.object({
  name: translatedFieldSchema.optional(),
  description: z
    .object({
      en: z.string().trim().optional(),
      ru: z.string().trim().optional(),
    })
    .optional(),
  thumbnail: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.coerce.number().min(0).optional(),
  properties: z.array(productPropertySchema).optional(),
  fileFormats: z.array(z.string().trim().toUpperCase()).optional(),
  weight: z.string().trim().optional(),
  size: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─── List / Search Query ─────────────────────────────────────────────────────

export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;
