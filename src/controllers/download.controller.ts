import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as downloadService from '../services/download.service';
import { success } from '../utils/response.util';

// ─── GET /acquisitions ────────────────────────────────────────────────────────

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const data = await downloadService.getUserDownloads(req.user!._id.toString(), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  success(res, data);
});

// ─── Admin: GET /acquisitions/admin ──────────────────────────────────────────

export const adminList = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, userId, productId, collectionId } = req.query as {
    page?: string;
    limit?: string;
    userId?: string;
    productId?: string;
    collectionId?: string;
  };
  const data = await downloadService.listAllDownloads({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    userId,
    productId,
    collectionId,
  });
  success(res, data);
});

// ─── GET /acquisitions/:productId/files ──────────────────────────────────────

export const getFiles = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const data = await downloadService.getProductFiles(
    req.user!._id.toString(),
    req.params.productId,
  );
  success(res, data);
});
