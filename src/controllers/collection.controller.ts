import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as collectionService from '../services/collection.service';
import { success } from '../utils/response.util';

// ─── POST /collections ────────────────────────────────────────────────────────

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  const data = await collectionService.createCollection(req.user!._id.toString(), name);
  success(res, data, 201, 'Collection created');
});

// ─── GET /collections ─────────────────────────────────────────────────────────

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const data = await collectionService.getUserCollections(req.user!._id.toString(), {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  success(res, data);
});

// ─── GET /collections/:id ─────────────────────────────────────────────────────

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const data = await collectionService.getCollectionById(
    req.user!._id.toString(),
    req.params.id,
  );
  success(res, data);
});

// ─── PATCH /collections/:id ───────────────────────────────────────────────────

export const rename = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  const data = await collectionService.renameCollection(
    req.user!._id.toString(),
    req.params.id,
    name,
  );
  success(res, data);
});

// ─── DELETE /collections/:id ──────────────────────────────────────────────────

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await collectionService.deleteCollection(req.user!._id.toString(), req.params.id);
  success(res, null, 200, 'Collection deleted');
});

// ─── POST /collections/:id/items/:productId ───────────────────────────────────

export const addItem = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const data = await collectionService.addToCollection(
    req.user!._id.toString(),
    req.params.id,
    req.params.productId,
  );
  success(res, data, 201, 'Product added to collection');
});

// ─── DELETE /collections/:id/items/:productId ─────────────────────────────────

export const removeItem = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const data = await collectionService.removeFromCollection(
    req.user!._id.toString(),
    req.params.id,
    req.params.productId,
  );
  success(res, data, 200, 'Product removed from collection');
});
