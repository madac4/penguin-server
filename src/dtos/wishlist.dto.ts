import type { IWishlistDocument } from '../models/wishlist.model'

export interface WishlistProductDto {
  productId: string;
  addedAt: string;
}

export interface WishlistDto {
  id: string;
  userId: string;
  products: WishlistProductDto[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export function toWishlistDto(doc: IWishlistDocument): WishlistDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    products: doc.products.map((p) => ({
      productId: p.productId.toString(),
      addedAt: p.addedAt.toISOString(),
    })),
    totalItems: doc.products.length,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
