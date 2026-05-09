import { z } from 'zod';

// ─── Shared: Translated Field ────────────────────────────────────────────────

const translatedFieldSchema = z.object({
  en: z.string().min(1, 'English translation is required').trim(),
  ru: z.string().min(1, 'Russian translation is required').trim(),
});

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const categoryIdSchema = z.string().regex(objectIdRegex, 'Invalid category ID');
const tagIdSchema = z.string().regex(objectIdRegex, 'Invalid tag ID');
const propertyDefinitionIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid property definition ID');

const optionalTranslatedFieldSchema = z
  .object({
    en: z.string().trim().optional().default(''),
    ru: z.string().trim().optional().default(''),
  })
  .optional()
  .default({ en: '', ru: '' });

// ─── Product Property (definition ID + value) ───────────────────────────────

const productPropertySchema = z.object({
  definition: propertyDefinitionIdSchema,
  value: z.string().trim().optional().default(''),
  isActive: z.boolean().optional().default(true),
}).refine((property) => !property.isActive || property.value.length > 0, {
  message: 'Property value is required when property is active',
  path: ['value'],
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
  category: categoryIdSchema,
  tags: z.array(tagIdSchema).optional().default([]),
  isFree: z.boolean().optional().default(false),
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
  category: categoryIdSchema.optional(),
  tags: z.array(tagIdSchema).optional(),
  isFree: z.boolean().optional(),
  properties: z.array(productPropertySchema).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ─── List / Search Query ─────────────────────────────────────────────────────

export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  category: categoryIdSchema.optional(),
  // Comma-separated tag IDs: ?tags=id1,id2
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    ),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.enum(['newest', 'popular']).optional().default('newest'),
  // Comma-separated format labels: ?formats=STL,GLB,OBJ
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
  // Comma-separated definitionId:value pairs: ?properties=defId1:gold,defId2:modern
  // All specified pairs must match (AND logic across definitions).
  properties: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const pairs = v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const colonIdx = s.indexOf(':');
          if (colonIdx === -1) return null;
          return { definition: s.slice(0, colonIdx).trim(), value: s.slice(colonIdx + 1).trim() };
        })
        .filter(
          (p): p is { definition: string; value: string } =>
            p !== null && p.definition !== '' && p.value !== '',
        );
      return pairs.length > 0 ? pairs : undefined;
    })
    .refine(
      (pairs) => pairs === undefined || pairs.every((pair) => objectIdRegex.test(pair.definition)),
      'Invalid property definition ID',
    ),
});

export type ListProductsInput = z.infer<typeof listProductsSchema>;
