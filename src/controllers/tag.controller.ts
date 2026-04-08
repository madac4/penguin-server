import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as tagService from '../services/tag.service';
import { success } from '../utils/response.util';
import type { CreateTagInput, ListTagsInput, UpdateTagInput } from '../validators/tag.validator';

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const tag = await tagService.createTag(req.body as CreateTagInput);
  success(res, tag, 201, 'Tag created successfully');
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const tag = await tagService.getTagById(req.params.id);
  success(res, tag);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const result = await tagService.listTags(req.query as unknown as ListTagsInput);
  success(res, result);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const tag = await tagService.updateTag(req.params.id, req.body as UpdateTagInput);
  success(res, tag, 200, 'Tag updated successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await tagService.deleteTag(req.params.id);
  success(res, null, 200, 'Tag deleted successfully');
});
