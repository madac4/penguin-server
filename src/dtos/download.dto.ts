import type { IDownloadDocument } from '../models/download.model';

export interface DownloadDto {
  id: string;
  userId: string;
  productId: string;
  collectionId: string | null;
  downloadedAt: string;
}

export function toDownloadDto(doc: IDownloadDocument): DownloadDto {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    productId: doc.productId.toString(),
    collectionId: doc.collectionId ? doc.collectionId.toString() : null,
    downloadedAt: doc.downloadedAt.toISOString(),
  };
}
