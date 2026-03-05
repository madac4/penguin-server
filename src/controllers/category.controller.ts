import type { Request, Response } from 'express'
import { CatchAsyncErrors } from '../middlewares/error.middleware'
import * as categoryService from '../services/category.service'
import { success } from '../utils/response.util'
import type {
	CreateCategoryInput,
	ListCategoriesInput,
	UpdateCategoryInput,
} from '../validators/category.validator'

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.createCategory(req.body as CreateCategoryInput);
  success(res, category, 201, category.parent ? 'Subcategory created successfully' : 'Category created successfully');
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.getCategoryById(req.params.id);
  success(res, category);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const result = await categoryService.listCategories(req.query as unknown as ListCategoriesInput);
  success(res, result);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body as UpdateCategoryInput,
  );
  success(res, category, 200, 'Category updated successfully');
});

export const updateSortOrder = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.updateCategorySortOrder(req.params.id, req.body.sortOrder);
  success(res, category, 200, 'Category sort order updated successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await categoryService.deleteCategory(req.params.id);
  success(res, null, 200, 'Category deleted successfully');
});

export const getTree = CatchAsyncErrors(async (_req: Request, res: Response): Promise<void> => {
  const tree = await categoryService.getCategoryTree();
  success(res, tree);
});
