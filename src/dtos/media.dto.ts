import type { IMediaDocument } from '../models/media.model';
import type { MediaType, UploadFolder } from '../utils/enums';

export interface MediaDto {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  folder: UploadFolder;
  uploadedBy: string;
  alt: string;
  createdAt: string;
  updatedAt: string;
}

export function toMediaDto(doc: IMediaDocument): MediaDto {
  return {
    id: doc._id.toString(),
    filename: doc.filename,
    url: doc.url,
    mimeType: doc.mimeType,
    size: doc.size,
    type: doc.type,
    folder: doc.folder,
    uploadedBy: doc.uploadedBy.toString(),
    alt: doc.alt,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
