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

// ─── Product File (uploaded via media routes, referenced by URL) ─────────────

const productFileSchema = z.object({
  url: z.string().url('File URL must be a valid URL'),
  filename: z.string().min(1, 'Filename is required'),
  format: z.string().min(1, 'Format is required'),
  size: z.number().int().min(0, 'Size must be a non-negative integer'),
});

// ─── Create ──────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: translatedFieldSchema,
  description: optionalTranslatedFieldSchema,
  thumbnail: z.string().trim().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  files: z.array(productFileSchema).optional().default([]),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  price: z.coerce.number().min(0).optional().default(0),
  properties: z.array(productPropertySchema).optional().default([]),
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
  files: z.array(productFileSchema).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.coerce.number().min(0).optional(),
  properties: z.array(productPropertySchema).optional(),
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
  sortBy: z
    .enum(['newest', 'price_asc', 'price_desc', 'popular'])
    .optional()
    .default('newest'),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  // Comma-separated list of format labels: ?formats=STL,GLB,OBJ
  formats: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((f) => f.trim().toUpperCase())
            .filter(Boolean)
        : undefined,
    ),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;
