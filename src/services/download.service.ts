import type { PaginatedDto } from '@/dtos/common.dto';
import { toProductDto, type ProductDto } from '@/dtos/product.dto';
import { User } from '@/models/user.model';
import { Role } from '@/utils/enums';
import { paginatedResult } from '@/utils/pagination.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Collection } from '../models/collection.model';
import { Download } from '../models/download.model';
import { Product, type IProductDocument } from '../models/product.model';
import { consumeDownload } from './subscription.service';
import * as uploadService from './upload.service';

export const UNCATEGORIZED = 'Uncategorized';
const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 60;

export interface DownloadedProductDto {
  id: string;
  productId: string;
  product: ProductDto;
  collectionId: string | null;
  acquisitionSource: string;
  subscriptionId: string | null;
  subscriptionPlanId: string | null;
  quotaConsumed: boolean;
  acquiredAt: string;
}

export interface ListAllDownloadsQuery {
  page?: number;
  limit?: number;
  userId?: string;
  productId?: string;
  collectionId?: string;
}

// ─── Get or create the Uncategorized collection ───────────────────────────────

async function getOrCreateUncategorized(userId: string) {
  let col = await Collection.findOne({ userId, name: UNCATEGORIZED });
  if (!col) col = await Collection.create({ userId, name: UNCATEGORIZED, items: [] });
  return col;
}

// ─── Acquire a product (consumes 1 quota, one-time per account) ───────────────

export async function acquireProduct(
  userId: string,
  productId: string,
  collectionId?: string,
): Promise<{ collectionId: string }> {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ErrorHandler('Product not found', 404);

  let collection;
  if (collectionId) {
    collection = await Collection.findOne({ _id: collectionId, userId });
    if (!collection) throw new ErrorHandler('Collection not found', 404);
  } else {
    collection = await getOrCreateUncategorized(userId);
  }

  if (product.isFree) {
    const alreadyInCollection = collection.items.some((i) => i.productId.toString() === productId);
    if (!alreadyInCollection) {
      collection.items.push({ productId, enrolledAt: new Date() } as any);
      await collection.save();
    }

    await Collection.updateMany(
      { userId, _id: { $ne: collection._id } },
      { $pull: { items: { productId } } },
    );

    return { collectionId: collection._id.toString() };
  }

  const alreadyAcquired = await Download.exists({ userId, productId });
  if (alreadyAcquired) throw new ErrorHandler('You have already acquired this product', 409);

  const quota = await consumeDownload(userId);

  const acquiredAt = new Date();
  await Download.create({
    userId,
    productId,
    collectionId: collection._id,
    acquisitionSource: 'subscription_quota',
    subscriptionId: quota.subscriptionId,
    subscriptionPlanId: quota.subscriptionPlanId,
    quotaConsumed: true,
    acquiredAt,
    downloadedAt: acquiredAt,
  });

  const alreadyInCollection = collection.items.some((i) => i.productId.toString() === productId);
  if (!alreadyInCollection) {
    collection.items.push({ productId, enrolledAt: new Date() } as any);
    await collection.save();
  }

  return { collectionId: collection._id.toString() };
}

// ─── Get files for an acquired product (unlimited, no quota consumed) ─────────

export async function getProductFiles(
  userId: string,
  productId: string,
): Promise<{
  files: { url: string; filename: string; format: string; size: number; expiresIn: number }[];
}> {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ErrorHandler('Product not found', 404);

  if (!product.isFree) {
    const acquired = await Download.exists({ userId, productId });
    const user = await User.findOne({ _id: userId });
    if (!acquired && user?.role !== Role.Administrator)
      throw new ErrorHandler('Product not acquired', 403);
  }

  return {
    files: await Promise.all(
      product.files.map(async (f) => ({
        url: await uploadService.createSignedDownloadUrl(f.url, DOWNLOAD_URL_EXPIRES_IN_SECONDS),
        filename: f.filename,
        format: f.format,
        size: f.size,
        expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS,
      })),
    ),
  };
}

// ─── List user downloads (paginated, with product data) ───────────────────────

export async function getUserDownloads(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<PaginatedDto<DownloadedProductDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const [downloads, total] = await Promise.all([
    Download.find({ userId })
      .sort({ acquiredAt: -1, downloadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Download.countDocuments({ userId }),
  ]);

  const productIds = downloads.map((d) => d.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items: DownloadedProductDto[] = downloads
    .map((d) => {
      const product = productMap.get(d.productId.toString());
      if (!product) return null;
      const acquiredAt = d.acquiredAt ?? d.downloadedAt;
      return {
        id: d._id.toString(),
        productId: d.productId.toString(),
        product: toProductDto(product as unknown as IProductDocument),
        collectionId: d.collectionId ? d.collectionId.toString() : null,
        acquisitionSource: d.acquisitionSource ?? 'migration',
        subscriptionId: d.subscriptionId ? d.subscriptionId.toString() : null,
        subscriptionPlanId: d.subscriptionPlanId ? d.subscriptionPlanId.toString() : null,
        quotaConsumed: d.quotaConsumed ?? true,
        acquiredAt: acquiredAt.toISOString(),
      };
    })
    .filter(Boolean) as DownloadedProductDto[];

  return paginatedResult(items, total, page, limit);
}

// ─── Admin: list acquisitions across users ───────────────────────────────────

export async function listAllDownloads(
  query: ListAllDownloadsQuery,
): Promise<PaginatedDto<DownloadedProductDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.userId) filter.userId = query.userId;
  if (query.productId) filter.productId = query.productId;
  if (query.collectionId) filter.collectionId = query.collectionId;

  const [downloads, total] = await Promise.all([
    Download.find(filter).sort({ acquiredAt: -1, downloadedAt: -1 }).skip(skip).limit(limit).lean(),
    Download.countDocuments(filter),
  ]);

  const productIds = downloads.map((d) => d.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items: DownloadedProductDto[] = downloads
    .map((d) => {
      const product = productMap.get(d.productId.toString());
      if (!product) return null;
      const acquiredAt = d.acquiredAt ?? d.downloadedAt;
      return {
        id: d._id.toString(),
        productId: d.productId.toString(),
        product: toProductDto(product as unknown as IProductDocument),
        collectionId: d.collectionId ? d.collectionId.toString() : null,
        acquisitionSource: d.acquisitionSource ?? 'migration',
        subscriptionId: d.subscriptionId ? d.subscriptionId.toString() : null,
        subscriptionPlanId: d.subscriptionPlanId ? d.subscriptionPlanId.toString() : null,
        quotaConsumed: d.quotaConsumed ?? true,
        acquiredAt: acquiredAt.toISOString(),
      };
    })
    .filter(Boolean) as DownloadedProductDto[];

  return paginatedResult(items, total, page, limit);
}

// ─── Cleanup on product deletion ─────────────────────────────────────────────

export async function removeProductFromAllDownloads(productId: string): Promise<void> {
  await Download.deleteMany({ productId });
}
