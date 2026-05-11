import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export const renameCollectionSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export const listCollectionsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listAcquisitionHistorySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listAcquisitionsSchema = listAcquisitionHistorySchema.extend({
  userId: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  collectionId: z.string().trim().optional(),
});
