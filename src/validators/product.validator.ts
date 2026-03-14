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

// ─── Product Properties ─────────────────────────────────────────────────────

const productPropertiesSchema = z
  .object({
    size: z.string().trim().nullable().optional().default(null),
    material: z.string().trim().nullable().optional().default(null),
    color: z.string().trim().nullable().optional().default(null),
    weight: z.string().trim().nullable().optional().default(null),
  })
  .optional()
  .default({ size: null, material: null, color: null, weight: null });

// ─── Create ──────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: translatedFieldSchema,
  description: optionalTranslatedFieldSchema,
  images: z.array(z.string()).optional().default([]),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  price: z.coerce.number().min(0).optional().default(0),
  properties: productPropertiesSchema,
  fileFormats: z.array(z.string().trim().toUpperCase()).optional().default([]),
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
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.coerce.number().min(0).optional(),
  properties: z
    .object({
      size: z.string().trim().nullable().optional(),
      material: z.string().trim().nullable().optional(),
      color: z.string().trim().nullable().optional(),
      weight: z.string().trim().nullable().optional(),
    })
    .optional(),
  fileFormats: z.array(z.string().trim().toUpperCase()).optional(),
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
