import type { IDownloadDocument } from '../models/download.model';

export interface DownloadDto {
  id: string;
  userId: string;
  productId: string;
  collectionId: string | null;
  acquisitionSource: string;
  subscriptionId: string | null;
  subscriptionPlanId: string | null;
  quotaConsumed: boolean;
  acquiredAt: string;
  downloadedAt: string;
}

export function toDownloadDto(doc: IDownloadDocument): DownloadDto {
  const acquiredAt = doc.acquiredAt ?? doc.downloadedAt;
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    productId: doc.productId.toString(),
    collectionId: doc.collectionId ? doc.collectionId.toString() : null,
    acquisitionSource: doc.acquisitionSource ?? 'migration',
    subscriptionId: doc.subscriptionId ? doc.subscriptionId.toString() : null,
    subscriptionPlanId: doc.subscriptionPlanId ? doc.subscriptionPlanId.toString() : null,
    quotaConsumed: doc.quotaConsumed ?? true,
    acquiredAt: acquiredAt.toISOString(),
    downloadedAt: doc.downloadedAt.toISOString(),
  };
}
