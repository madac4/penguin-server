import crypto from 'crypto'
import path from 'path'

// ─── Allowed MIME Types ──────────────────────────────────────────────────────

export const IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]

export const DOCUMENT_MIMES = [
  'application/pdf',
]

export const MODEL_MIMES = [
  'model/gltf-binary',       // .glb
  'model/gltf+json',         // .gltf
  'application/octet-stream', // fallback for .glb/.obj/.fbx
]

// Extensions accepted for 3D model files (used as fallback when MIME is octet-stream)
export const MODEL_EXTENSIONS = ['.glb', '.gltf', '.obj', '.fbx']

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

/**
 * Generate a unique storage key: `{folder}/{uuid}{ext}`
 * Example: `categories/a1b2c3d4-e5f6-7890.webp`
 */
export function generateFileKey(folder: string, originalName: string): string {
  const ext = getFileExtension(originalName)
  const uuid = crypto.randomUUID()
  return `${folder}/${uuid}${ext}`
}

/**
 * Check if a file is an allowed image type.
 */
export function isImageFile(mimetype: string): boolean {
  return IMAGE_MIMES.includes(mimetype)
}

/**
 * Check if a file is an allowed document type.
 */
export function isDocumentFile(mimetype: string): boolean {
  return DOCUMENT_MIMES.includes(mimetype)
}

/**
 * Check if a file is an allowed 3D model type.
 * Falls back to extension check for octet-stream MIME.
 */
export function isModelFile(mimetype: string, filename: string): boolean {
  if (mimetype !== 'application/octet-stream') {
    return MODEL_MIMES.includes(mimetype)
  }
  return MODEL_EXTENSIONS.includes(getFileExtension(filename))
}
