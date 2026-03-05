import type { Request, Response } from 'express'
import { CatchAsyncErrors, ErrorHandler } from '../middlewares/error.middleware'
import * as uploadService from '../services/upload.service'
import { UploadFolder } from '../utils/enums'
import { success } from '../utils/response.util'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validateFolder(req: Request): UploadFolder {
  const folder = req.query.folder as string

  if (!folder) {
    throw new ErrorHandler('Query parameter "folder" is required', 400)
  }

  if (!Object.values(UploadFolder).includes(folder as UploadFolder)) {
    const allowed = Object.values(UploadFolder).join(', ')
    throw new ErrorHandler(`Invalid folder. Allowed: ${allowed}`, 400)
  }

  return folder as UploadFolder
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export const uploadImage = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ErrorHandler('No file provided', 400)

  const folder = validateFolder(req)
  const oldUrl = req.query.oldUrl as string | undefined
  const url = await uploadService.uploadFile(req.file, folder, oldUrl)

  success(res, { url }, 200, 'Image uploaded successfully')
})

export const uploadImages = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) throw new ErrorHandler('No files provided', 400)

  const folder = validateFolder(req)
  const oldUrls = req.body.oldUrls as string[] | undefined
  const urls = await uploadService.uploadFiles(files, folder, oldUrls)

  success(res, { urls }, 200, `${urls.length} image(s) uploaded successfully`)
})

export const uploadDocument = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ErrorHandler('No file provided', 400)

  const folder = validateFolder(req)
  const oldUrl = req.query.oldUrl as string | undefined
  const url = await uploadService.uploadFile(req.file, folder, oldUrl)

  success(res, { url }, 200, 'Document uploaded successfully')
})

export const uploadModel = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ErrorHandler('No file provided', 400)

  const folder = validateFolder(req)
  const oldUrl = req.query.oldUrl as string | undefined
  const url = await uploadService.uploadFile(req.file, folder, oldUrl)

  success(res, { url }, 200, '3D model uploaded successfully')
})

export const deleteFile = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body as { url: string }
  if (!url) throw new ErrorHandler('File URL is required', 400)

  await uploadService.deleteFile(url)

  success(res, null, 200, 'File deleted successfully')
})
