import type { PaginatedDto } from '@/dtos/common.dto';
import { toMediaDto, type MediaDto } from '@/dtos/media.dto';
import { UploadFolder } from '@/utils/enums';
import { paginatedResult, parsePagination } from '@/utils/pagination.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Media, type IMediaDocument } from '../models/media.model';
import { getMediaType } from '../utils/file.util';
import type { ListMediaInput, UpdateMediaInput } from '../validators/media.validator';
import * as uploadService from './upload.service';

// ─── Upload Single ───────────────────────────────────────────────────────────

export async function uploadMedia(
  file: Express.Multer.File,
  folder: string,
  uploadedBy: string,
  alt = '',
): Promise<MediaDto> {
  const mediaType = getMediaType(file.mimetype, file.originalname);

  if (!mediaType) {
    throw new ErrorHandler('Unsupported file type', 400);
  }

  const url = await uploadService.uploadFile(file, folder);
  const key = uploadService.extractKeyFromUrl(url);

  const media = await Media.create({
    filename: file.originalname,
    url,
    key,
    mimeType: file.mimetype,
    size: file.size,
    type: mediaType,
    folder,
    uploadedBy,
    alt,
  });

  return toMediaDto(media);
}

// ─── Upload Multiple ─────────────────────────────────────────────────────────

export async function uploadMultipleMedia(
  files: Express.Multer.File[],
  folder: string,
  uploadedBy: string,
): Promise<MediaDto[]> {
  return Promise.all(files.map((file) => uploadMedia(file, folder, uploadedBy)));
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getMediaById(id: string): Promise<MediaDto> {
  const media = await Media.findById(id);
  if (!media) throw new ErrorHandler('Media not found', 404);
  return toMediaDto(media);
}

// ─── List (paginated, filterable) ────────────────────────────────────────────

export async function listMedia(query: ListMediaInput): Promise<PaginatedDto<MediaDto>> {
  const { page, limit, skip } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.folder !== UploadFolder.All) filter.folder = query.folder;
  if (query.type) filter.type = query.type;

  if (query.dateFrom || query.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (query.dateFrom) dateFilter.$gte = query.dateFrom;
    if (query.dateTo) dateFilter.$lte = query.dateTo;
    filter.createdAt = dateFilter;
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Media.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((item) => toMediaDto(item as unknown as IMediaDocument)),
    total,
    page,
    limit,
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateMedia(id: string, input: UpdateMediaInput): Promise<MediaDto> {
  const media = await Media.findById(id);
  if (!media) throw new ErrorHandler('Media not found', 404);

  if (input.alt !== undefined) media.alt = input.alt;
  if (input.filename !== undefined) media.filename = input.filename;

  await media.save();
  return toMediaDto(media);
}

// ─── Delete Single ───────────────────────────────────────────────────────────

export async function deleteMedia(id: string): Promise<void> {
  const media = await Media.findById(id);
  if (!media) throw new ErrorHandler('Media not found', 404);

  await uploadService.deleteFile(media.url).catch(() => {});
  await Media.findByIdAndDelete(id);
}

// ─── Delete Multiple ─────────────────────────────────────────────────────────

export async function deleteMultipleMedia(ids: string[]): Promise<number> {
  const mediaItems = await Media.find({ _id: { $in: ids } });

  if (mediaItems.length === 0) return 0;

  const urls = mediaItems.map((m) => m.url);
  await uploadService.deleteFiles(urls).catch(() => {});
  await Media.deleteMany({ _id: { $in: ids } });

  return mediaItems.length;
}
