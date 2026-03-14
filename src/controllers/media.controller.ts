import type { Request, Response } from 'express'
import { CatchAsyncErrors, ErrorHandler } from '../middlewares/error.middleware'
import * as mediaService from '../services/media.service'
import { success } from '../utils/response.util'
import type {
  BatchDeleteMediaInput,
  ListMediaInput,
  UpdateMediaInput,
  UploadMediaInput,
} from '../validators/media.validator'

export const upload = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) throw new ErrorHandler('No file provided', 400);

  const { folder, alt } = req.body as UploadMediaInput;
  const uploadedBy = req.user!._id.toString();
  const media = await mediaService.uploadMedia(req.file, folder, uploadedBy, alt);

  success(res, media, 201, 'File uploaded successfully');
});

export const uploadBatch = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) throw new ErrorHandler('No files provided', 400);

  const { folder } = req.body as UploadMediaInput;
  const uploadedBy = req.user!._id.toString();
  const mediaItems = await mediaService.uploadMultipleMedia(files, folder, uploadedBy);

  success(res, mediaItems, 201, `${mediaItems.length} file(s) uploaded successfully`);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const result = await mediaService.listMedia(req.query as unknown as ListMediaInput);
  success(res, result);
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const media = await mediaService.getMediaById(req.params.id);
  success(res, media);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const media = await mediaService.updateMedia(req.params.id, req.body as UpdateMediaInput);
  success(res, media, 200, 'Media updated successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await mediaService.deleteMedia(req.params.id);
  success(res, null, 200, 'File deleted successfully');
});

export const removeBatch = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { ids } = req.body as BatchDeleteMediaInput;
  const count = await mediaService.deleteMultipleMedia(ids);
  success(res, { deleted: count }, 200, `${count} file(s) deleted successfully`);
});
