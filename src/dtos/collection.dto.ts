import type { ICollectionDocument } from '../models/collection.model';

export interface CollectionItemDto {
  productId: string;
  enrolledAt: string;
}

export interface CollectionDto {
  id: string;
  userId: string;
  name: string;
  items: CollectionItemDto[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionSummaryDto {
  id: string;
  userId: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toCollectionDto(doc: ICollectionDocument): CollectionDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    items: doc.items.map((item) => ({
      productId: item.productId.toString(),
      enrolledAt: item.enrolledAt.toISOString(),
    })),
    itemCount: doc.items.length,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toCollectionSummaryDto(doc: ICollectionDocument): CollectionSummaryDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    itemCount: doc.items.length,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
