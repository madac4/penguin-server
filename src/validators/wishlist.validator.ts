import { z } from 'zod';

// ─── List Wishlist Query ─────────────────────────────────────────────────────

export const listWishlistSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type ListWishlistInput = z.infer<typeof listWishlistSchema>;

// ─── Check Wishlist Query ────────────────────────────────────────────────────

export const checkWishlistSchema = z.object({
  productIds: z.string().transform((val) =>
    val
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  ),
});
