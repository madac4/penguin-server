import type { RequestHandler } from 'express'
import multer from 'multer'
import {
	DOCUMENT_MIMES,
	IMAGE_MIMES,
	isDocumentFile,
	isImageFile,
	isModelFile,
} from '../utils/file.util'

// ─── Memory storage (buffers → streamed to R2) ──────────────────────────────

const storage = multer.memoryStorage()

// ─── File Filters ────────────────────────────────────────────────────────────
// Note: multer v2 bundles its own @types/express which conflicts with the
// project's @types/express. We use `unknown` casts to bridge the type gap.
// This is safe because multer's runtime behavior is identical regardless.

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (isImageFile(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid image type. Allowed: ${IMAGE_MIMES.join(', ')}`))
  }
}

const documentFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (isDocumentFile(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid document type. Allowed: ${DOCUMENT_MIMES.join(', ')}`))
  }
}

const modelFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (isModelFile(file.mimetype, file.originalname)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid 3D model type. Allowed: .glb, .gltf, .obj, .fbx'))
  }
}

// ─── Preset Middlewares ──────────────────────────────────────────────────────

/** Single image upload — max 10 MB */
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file') as unknown as RequestHandler

/** Multiple image upload (up to 10) — max 10 MB each */
export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('files', 10) as unknown as RequestHandler

/** Single PDF upload — max 25 MB */
export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
}).single('file') as unknown as RequestHandler

/** Single 3D model file — max 100 MB */
export const uploadModel = multer({
  storage,
  fileFilter: modelFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('file') as unknown as RequestHandler
