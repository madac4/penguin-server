import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2.client';
import { storageConfig, validateStorageConfig } from '../config/storage.config';
import { ErrorHandler } from '../middlewares/error.middleware';
import { UploadFolder } from '../utils/enums';
import { generateFileKey } from '../utils/file.util';

const VALID_FOLDERS = new Set<string>(Object.values(UploadFolder));
const PRIVATE_FOLDERS = new Set<string>([UploadFolder.Models]);
const DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS = 60;

function isPrivateKey(key: string): boolean {
  return [...PRIVATE_FOLDERS].some((folder) => key === folder || key.startsWith(`${folder}/`));
}

function getBucketForKey(key: string): string {
  return isPrivateKey(key) ? storageConfig.privateBucket : storageConfig.publicBucket;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a multer file buffer to R2.
 * If `oldUrl` is provided, the old file is deleted before uploading the new one.
 *
 * @param file   The multer file object
 * @param folder The R2 folder/prefix (e.g. 'categories')
 * @param oldUrl Optional URL of the file being replaced — will be deleted
 * @returns      The public URL for public files, or the R2 object key for private files
 */
export async function uploadFile(
  file: Express.Multer.File,
  folder: string,
  oldUrl?: string,
): Promise<string> {
  if (!VALID_FOLDERS.has(folder)) {
    throw new ErrorHandler(
      `Invalid upload folder "${folder}". Allowed: ${[...VALID_FOLDERS].join(', ')}`,
      400,
    );
  }

  if (oldUrl) {
    await deleteFile(oldUrl).catch(() => {
      // Silently ignore if old file is already gone
    });
  }

  const key = generateFileKey(folder, file.originalname);

  const isPrivateFolder = PRIVATE_FOLDERS.has(folder);

  validateStorageConfig({ requirePublicUrl: !isPrivateFolder });

  await r2Client.send(
    new PutObjectCommand({
      Bucket: isPrivateFolder ? storageConfig.privateBucket : storageConfig.publicBucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  if (isPrivateFolder) {
    return key;
  }

  return `${storageConfig.publicUrl}/${key}`;
}

/**
 * Extract the R2 object key from a public URL.
 */
export function extractKeyFromUrl(fileUrl: string): string {
  const publicUrl = storageConfig.publicUrl.replace(/\/+$/, '');

  if (!fileUrl.includes('://')) {
    return fileUrl.replace(/^\/+/, '');
  }

  if (publicUrl && fileUrl.startsWith(publicUrl)) {
    return fileUrl.slice(publicUrl.length + 1);
  }

  try {
    const parsedUrl = new URL(fileUrl);
    return decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
  } catch {
    throw new ErrorHandler('Invalid file URL', 400);
  }
}

/**
 * Generate a short-lived private R2 download URL from an object key.
 */
export async function createSignedDownloadUrl(
  fileUrlOrKey: string,
  expiresIn = DEFAULT_SIGNED_URL_EXPIRES_IN_SECONDS,
): Promise<string> {
  validateStorageConfig();

  const key = extractKeyFromUrl(fileUrlOrKey);

  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: storageConfig.privateBucket,
      Key: key,
    }),
    { expiresIn },
  );
}

/**
 * Delete a single file from R2 by its public URL.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  validateStorageConfig();

  const key = extractKeyFromUrl(fileUrl);

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: getBucketForKey(key),
      Key: key,
    }),
  );
}

/**
 * Delete multiple files from R2 by their public URLs.
 */
export async function deleteFiles(fileUrls: string[]): Promise<void> {
  await Promise.all(fileUrls.map((url) => deleteFile(url)));
}

/**
 * Delete all objects under a given R2 prefix.
 */
export async function deleteByPrefix(prefix: string): Promise<void> {
  validateStorageConfig();

  const listResponse = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: getBucketForKey(prefix),
      Prefix: prefix,
    }),
  );

  const objects = listResponse.Contents;
  if (!objects || objects.length === 0) return;

  await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: getBucketForKey(prefix),
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key })),
        Quiet: true,
      },
    }),
  );
}
