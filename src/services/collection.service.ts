import type { PaginatedDto } from '@/dtos/common.dto';
import { toProductDto, type ProductDto } from '@/dtos/product.dto';
import { paginatedResult } from '@/utils/pagination.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Collection, type ICollectionDocument } from '../models/collection.model';
import { Download } from '../models/download.model';
import { Product, type IProductDocument } from '../models/product.model';
import {
  toCollectionDto,
  toCollectionSummaryDto,
  type CollectionDto,
  type CollectionSummaryDto,
} from '../dtos/collection.dto';

const UNCATEGORIZED = 'Uncategorized';

// ─── Create Collection ────────────────────────────────────────────────────────

export async function createCollection(
  userId: string,
  name: string,
): Promise<CollectionDto> {
  const existing = await Collection.findOne({ userId, name });
  if (existing) throw new ErrorHandler('A collection with that name already exists', 409);

  const collection = await Collection.create({ userId, name, items: [] });
  return toCollectionDto(collection);
}

// ─── List User Collections (summary, no items) ────────────────────────────────

export async function getUserCollections(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<PaginatedDto<CollectionSummaryDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const [collections, total] = await Promise.all([
    Collection.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Collection.countDocuments({ userId }),
  ]);

  return paginatedResult(collections.map(toCollectionSummaryDto), total, page, limit);
}

// ─── Get Single Collection (with populated products) ─────────────────────────

export interface CollectionWithProductsDto {
  id: string;
  userId: string;
  name: string;
  items: { product: ProductDto; enrolledAt: string; isDownloaded: boolean }[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getCollectionById(
  userId: string,
  collectionId: string,
): Promise<CollectionWithProductsDto> {
  const collection = await Collection.findOne({ _id: collectionId, userId });
  if (!collection) throw new ErrorHandler('Collection not found', 404);

  const productIds = collection.items.map((i) => i.productId);

  const [products, downloads] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).lean(),
    Download.find({ userId, productId: { $in: productIds } })
      .select('productId')
      .lean(),
  ]);

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const downloadedSet = new Set(downloads.map((d) => d.productId.toString()));

  const items = collection.items
    .map((item) => {
      const product = productMap.get(item.productId.toString());
      if (!product) return null;
      return {
        product: toProductDto(product as unknown as IProductDocument),
        enrolledAt: item.enrolledAt.toISOString(),
        isDownloaded: downloadedSet.has(item.productId.toString()),
      };
    })
    .filter(Boolean) as CollectionWithProductsDto['items'];

  return {
    id: collection._id.toString(),
    userId: collection.userId.toString(),
    name: collection.name,
    items,
    itemCount: items.length,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

// ─── Rename Collection ────────────────────────────────────────────────────────

export async function renameCollection(
  userId: string,
  collectionId: string,
  name: string,
): Promise<CollectionDto> {
  const duplicate = await Collection.findOne({ userId, name, _id: { $ne: collectionId } });
  if (duplicate) throw new ErrorHandler('A collection with that name already exists', 409);

  const collection = await Collection.findOneAndUpdate(
    { _id: collectionId, userId },
    { name },
    { new: true },
  );
  if (!collection) throw new ErrorHandler('Collection not found', 404);

  return toCollectionDto(collection);
}

// ─── Delete Collection ────────────────────────────────────────────────────────

export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  const result = await Collection.deleteOne({ _id: collectionId, userId });
  if (result.deletedCount === 0) throw new ErrorHandler('Collection not found', 404);
}

// ─── Add an acquired product to a collection ─────────────────────────────────

export async function addToCollection(
  userId: string,
  collectionId: string,
  productId: string,
): Promise<CollectionDto> {
  const acquired = await Download.exists({ userId, productId });
  if (!acquired) throw new ErrorHandler('Product must be acquired before adding to a collection', 403);

  const collection = await Collection.findOne({ _id: collectionId, userId });
  if (!collection) throw new ErrorHandler('Collection not found', 404);

  const alreadyIn = collection.items.some((i) => i.productId.toString() === productId);
  if (alreadyIn) throw new ErrorHandler('Product is already in this collection', 409);

  collection.items.push({ productId, enrolledAt: new Date() } as any);
  await collection.save();

  await Promise.all([
    Collection.updateMany(
      { userId, _id: { $ne: collection._id } },
      { $pull: { items: { productId } } },
    ),
    Download.updateOne({ userId, productId }, { collectionId: collection._id }),
  ]);

  return toCollectionDto(collection);
}

// ─── Remove Product from Collection ──────────────────────────────────────────

export async function removeFromCollection(
  userId: string,
  collectionId: string,
  productId: string,
): Promise<CollectionDto> {
  const collection = await Collection.findOne({ _id: collectionId, userId });
  if (!collection) throw new ErrorHandler('Collection not found', 404);

  const idx = collection.items.findIndex((i) => i.productId.toString() === productId);
  if (idx === -1) throw new ErrorHandler('Product is not in this collection', 404);

  collection.items.splice(idx, 1);
  await collection.save();

  if (collection.name !== UNCATEGORIZED) {
    let uncategorized = await Collection.findOne({ userId, name: UNCATEGORIZED });
    if (!uncategorized) {
      uncategorized = await Collection.create({ userId, name: UNCATEGORIZED, items: [] });
    }

    const alreadyUncategorized = uncategorized.items.some(
      (i) => i.productId.toString() === productId,
    );
    if (!alreadyUncategorized) {
      uncategorized.items.push({ productId, enrolledAt: new Date() } as any);
      await uncategorized.save();
    }

    await Download.updateOne({ userId, productId }, { collectionId: uncategorized._id });
  } else {
    await Download.updateOne({ userId, productId }, { collectionId: null });
  }

  return toCollectionDto(collection);
}

// ─── Cleanup on product deletion ─────────────────────────────────────────────

export async function removeProductFromAllCollections(productId: string): Promise<void> {
  await Collection.updateMany(
    { 'items.productId': productId },
    { $pull: { items: { productId } } },
  );
}
