import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2.client';
import { storageConfig } from '../config/storage.config';
import { ErrorHandler } from '../middlewares/error.middleware';
import { UploadFolder } from '../utils/enums';
import { generateFileKey } from '../utils/file.util';

const VALID_FOLDERS = new Set<string>(Object.values(UploadFolder));

export function isProtectedFolder(folder: string): boolean {
  return folder.startsWith('protected/');
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a multer file buffer to R2.
 * If `oldRef` is provided (URL or key), the old object is deleted first.
 *
 * Public folders return a public URL; protected folders return the bare R2 key
 * (no domain) so the value cannot be fetched directly even if the bucket leaks.
 */
export async function uploadFile(
  file: Express.Multer.File,
  folder: string,
  oldRef?: string,
): Promise<string> {
  if (!VALID_FOLDERS.has(folder)) {
    throw new ErrorHandler(
      `Invalid upload folder "${folder}". Allowed: ${[...VALID_FOLDERS].join(', ')}`,
      400,
    );
  }

  if (oldRef) {
    await deleteFile(oldRef).catch(() => {});
  }

  const key = generateFileKey(folder, file.originalname);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  if (isProtectedFolder(folder)) return key;
  return `${storageConfig.publicUrl}/${key}`;
}

/**
 * Resolve the R2 object key from either a public URL or a bare key.
 */
export function extractKeyFromUrl(fileRef: string): string {
  const publicUrl = storageConfig.publicUrl.replace(/\/+$/, '');
  if (publicUrl && fileRef.startsWith(publicUrl)) {
    return fileRef.slice(publicUrl.length + 1);
  }
  if (fileRef.includes('://')) {
    throw new ErrorHandler('Invalid file URL — does not match storage domain', 400);
  }
  return fileRef.replace(/^\/+/, '');
}

/**
 * Delete a single file from R2 by its public URL.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const key = extractKeyFromUrl(fileUrl);

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: storageConfig.bucket,
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
 * Generate a short-lived presigned download URL for a private R2 object.
 *
 * @param key       The R2 object key (e.g. `protected/products/abc.stl`)
 * @param expiresIn TTL in seconds (default 300)
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: storageConfig.bucket, Key: key }),
    { expiresIn },
  );
}

/**
 * Delete all objects under a given R2 prefix.
 */
export async function deleteByPrefix(prefix: string): Promise<void> {
  const listResponse = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: storageConfig.bucket,
      Prefix: prefix,
    }),
  );

  const objects = listResponse.Contents;
  if (!objects || objects.length === 0) return;

  await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: storageConfig.bucket,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key })),
        Quiet: true,
      },
    }),
  );
}
