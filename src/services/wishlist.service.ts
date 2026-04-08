import type { PaginatedDto } from '@/dtos/common.dto';
import { toProductDto, type ProductDto } from '@/dtos/product.dto';
import { paginatedResult } from '@/utils/pagination.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Product, type IProductDocument } from '../models/product.model';
import { Wishlist } from '../models/wishlist.model';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOrCreateWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, products: [] });
  }

  return wishlist;
}

// ─── Add to Wishlist ─────────────────────────────────────────────────────────

export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<{ likeCount: number }> {
  const product = await Product.findById(productId);

  if (!product) throw new ErrorHandler('Product not found', 404);

  const wishlist = await getOrCreateWishlist(userId);

  const alreadyExists = wishlist.products.some((p) => p.productId.toString() === productId);
  if (alreadyExists) throw new ErrorHandler('Product is already in wishlist', 409);

  wishlist.products.push({ productId, addedAt: new Date() } as any);
  await wishlist.save();

  const updated = await Product.findOneAndUpdate(
    { _id: productId },
    { $inc: { likeCount: 1 } },
    { new: true, projection: { likeCount: 1 } },
  );
  return { likeCount: updated?.likeCount ?? product.likeCount + 1 };
}

// ─── Remove from Wishlist ────────────────────────────────────────────────────

export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<{ likeCount: number }> {
  const product = await Product.findById(productId);
  if (!product) throw new ErrorHandler('Product not found', 404);

  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) throw new ErrorHandler('Product is not in wishlist', 404);

  const idx = wishlist.products.findIndex((p) => p.productId.toString() === productId);
  if (idx === -1) throw new ErrorHandler('Product is not in wishlist', 404);

  wishlist.products.splice(idx, 1);
  await wishlist.save();

  const updated = await Product.findOneAndUpdate(
    { _id: productId, likeCount: { $gt: 0 } },
    { $inc: { likeCount: -1 } },
    { new: true, projection: { likeCount: 1 } },
  );
  return { likeCount: updated?.likeCount ?? Math.max(0, product.likeCount - 1) };
}

// ─── Toggle Wishlist ─────────────────────────────────────────────────────────

export async function toggleWishlist(
  userId: string,
  productId: string,
): Promise<{ added: boolean; likeCount: number }> {
  const product = await Product.findById(productId);
  if (!product) throw new ErrorHandler('Product not found', 404);

  const wishlist = await getOrCreateWishlist(userId);

  const idx = wishlist.products.findIndex((p) => p.productId.toString() === productId);

  if (idx !== -1) {
    wishlist.products.splice(idx, 1);
    await wishlist.save();
    const updated = await Product.findOneAndUpdate(
      { _id: productId, likeCount: { $gt: 0 } },
      { $inc: { likeCount: -1 } },
      { new: true, projection: { likeCount: 1 } },
    );
    return { added: false, likeCount: updated?.likeCount ?? Math.max(0, product.likeCount - 1) };
  }

  wishlist.products.push({ productId, addedAt: new Date() } as any);
  await wishlist.save();
  const updated = await Product.findOneAndUpdate(
    { _id: productId },
    { $inc: { likeCount: 1 } },
    { new: true, projection: { likeCount: 1 } },
  );
  return { added: true, likeCount: updated?.likeCount ?? product.likeCount + 1 };
}

// ─── Get User Wishlist (paginated, returns products) ─────────────────────────
export async function getUserWishlist(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<PaginatedDto<ProductDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

  const wishlist = await Wishlist.findOne({ userId }).lean();
  if (!wishlist || wishlist.products.length === 0) {
    return paginatedResult([], 0, page, limit);
  }

  const sorted = [...wishlist.products].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
  );

  const total = sorted.length;
  const start = (page - 1) * limit;
  const paged = sorted.slice(start, start + limit);

  const productIds = paged.map((p) => p.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const ordered = productIds
    .map((id) => productMap.get(id.toString()))
    .filter(Boolean) as typeof products;

  return paginatedResult(
    ordered.map((p) => toProductDto(p as unknown as IProductDocument)),
    total,
    page,
    limit,
  );
}

// ─── Get Wishlist Count ──────────────────────────────────────────────────────

export async function getWishlistCount(userId: string): Promise<number> {
  const wishlist = await Wishlist.findOne({ userId }).lean();
  return wishlist?.products.length ?? 0;
}

// ─── Remove a product from all wishlists (cleanup on product deletion) ───────
export async function removeAllForProduct(productId: string): Promise<void> {
  await Wishlist.updateMany(
    { 'products.productId': productId },
    { $pull: { products: { productId } } },
  );
}

// ─── Clean Wishlist ──────────────────────────────────────────────────────────
export async function cleanWishlist(userId: string): Promise<void> {
  await Wishlist.deleteOne({ userId });
}
