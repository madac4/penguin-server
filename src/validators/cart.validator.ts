import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

// ─── Add Item ────────────────────────────────────────────────────────────────

export const addCartItemSchema = z.object({
  productId: objectId,
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

// ─── Merge Guest Cart ────────────────────────────────────────────────────────

export const mergeCartSchema = z.object({
  items: z
    .array(z.object({ productId: objectId }))
    .min(1, 'Items array must not be empty')
    .max(50, 'Cannot merge more than 50 items at once'),
});

export type MergeCartInput = z.infer<typeof mergeCartSchema>;
