import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from '@aws-sdk/client-s3'
import { r2Client } from '../config/r2.client'
import { storageConfig } from '../config/storage.config'
import { ErrorHandler } from '../middlewares/error.middleware'
import { generateFileKey } from '../utils/file.util'

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a multer file buffer to R2.
 * If `oldUrl` is provided, the old file is deleted before uploading the new one.
 *
 * @param file   The multer file object
 * @param folder The R2 folder/prefix (e.g. 'categories')
 * @param oldUrl Optional URL of the file being replaced — will be deleted
 * @returns      The public URL of the uploaded file
 */
export async function uploadFile(
  file: Express.Multer.File,
  folder: string,
  oldUrl?: string,
): Promise<string> {
  // Delete the old file if replacing
  if (oldUrl) {
    await deleteFile(oldUrl).catch(() => {
      // Silently ignore if old file is already gone
    })
  }

  const key = generateFileKey(folder, file.originalname)

  await r2Client.send(
    new PutObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  )

  return `${storageConfig.publicUrl}/${key}`
}

/**
 * Upload multiple multer files to R2.
 * If `oldUrls` are provided, those files are deleted first.
 */
export async function uploadFiles(
  files: Express.Multer.File[],
  folder: string,
  oldUrls?: string[],
): Promise<string[]> {
  // Delete old files if replacing
  if (oldUrls && oldUrls.length > 0) {
    await deleteFiles(oldUrls).catch(() => {})
  }

  return Promise.all(files.map((file) => uploadFile(file, folder)))
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Extract the R2 object key from a public URL.
 */
function extractKeyFromUrl(fileUrl: string): string {
  const publicUrl = storageConfig.publicUrl.replace(/\/+$/, '')
  if (!fileUrl.startsWith(publicUrl)) {
    throw new ErrorHandler('Invalid file URL — does not match storage domain', 400)
  }
  return fileUrl.slice(publicUrl.length + 1)
}

/**
 * Delete a single file from R2 by its public URL.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const key = extractKeyFromUrl(fileUrl)

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key,
    }),
  )
}

/**
 * Delete multiple files from R2 by their public URLs.
 */
export async function deleteFiles(fileUrls: string[]): Promise<void> {
  await Promise.all(fileUrls.map((url) => deleteFile(url)))
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
  )

  const objects = listResponse.Contents
  if (!objects || objects.length === 0) return

  await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: storageConfig.bucket,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key })),
        Quiet: true,
      },
    }),
  )
}
