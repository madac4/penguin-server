import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as service from '../services/category-filter.service';
import { success } from '../utils/response.util';
import type {
  CreateCategoryFilterInput,
  ListCategoryFiltersInput,
  UpdateCategoryFilterInput,
} from '../validators/category-filter.validator';

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const filter = await service.createCategoryFilter(
    req.params.id,
    req.body as CreateCategoryFilterInput,
  );
  success(res, filter, 201, 'Category filter created successfully');
});

export const listByCategory = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const items = await service.listCategoryFilters(
    req.params.id,
    req.query as unknown as ListCategoryFiltersInput,
  );
  success(res, items);
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const filter = await service.getCategoryFilterById(req.params.filterId);
  success(res, filter);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const filter = await service.updateCategoryFilter(
    req.params.filterId,
    req.body as UpdateCategoryFilterInput,
  );
  success(res, filter, 200, 'Category filter updated successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await service.deleteCategoryFilter(req.params.filterId);
  success(res, null, 200, 'Category filter deleted successfully');
});
