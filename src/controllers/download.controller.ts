import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as downloadService from '../services/download.service';
import { success } from '../utils/response.util';

// ─── GET /downloads ───────────────────────────────────────────────────────────

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const data = await downloadService.getUserDownloads(req.user!._id.toString(), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  success(res, data);
});

// ─── GET /downloads/:productId/files ─────────────────────────────────────────

export const getFiles = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const data = await downloadService.getProductFiles(
    req.user!._id.toString(),
    req.params.productId,
  );
  success(res, data);
});
