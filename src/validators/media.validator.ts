import { z } from 'zod';
import { MediaType, UploadFolder } from '../utils/enums';

// ─── Upload ──────────────────────────────────────────────────────────────────

export const uploadMediaSchema = z.object({
  folder: z.nativeEnum(UploadFolder),
  alt: z.string().trim().optional().default(''),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

// ─── Update ──────────────────────────────────────────────────────────────────

export const updateMediaSchema = z.object({
  alt: z.string().trim().optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

// ─── List / Filter Query ─────────────────────────────────────────────────────

export const listMediaSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  folder: z.nativeEnum(UploadFolder).optional(),
  type: z.nativeEnum(MediaType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type ListMediaInput = z.infer<typeof listMediaSchema>;

// ─── Batch Delete ────────────────────────────────────────────────────────────

export const batchDeleteMediaSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
});

export type BatchDeleteMediaInput = z.infer<typeof batchDeleteMediaSchema>;
