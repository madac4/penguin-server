import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as downloadService from '../services/download.service';
import * as productService from '../services/product.service';
import { success } from '../utils/response.util';
import type {
  AddProductFilesInput,
  CreateProductInput,
  ListProductsInput,
  UpdateProductInput,
} from '../validators/product.validator';

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.createProduct(req.body as CreateProductInput);
  success(res, product, 201, 'Product created successfully');
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const requestingUser = req.user
    ? { id: req.user._id.toString(), role: req.user.role }
    : undefined;
  const product = await productService.getProductById(req.params.id, requestingUser);
  success(res, product);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const result = await productService.listProducts(req.query as unknown as ListProductsInput);
  success(res, result);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.updateProduct(req.params.id, req.body as UpdateProductInput);
  success(res, product, 200, 'Product updated successfully');
});

export const addFiles = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const product = await productService.addProductFiles(
    req.params.id,
    req.body as AddProductFilesInput,
  );
  success(res, product, 200, 'Product files added successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await productService.deleteProduct(req.params.id);
  success(res, null, 200, 'Product deleted successfully');
});

export const filters = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.query.category as string | undefined;
  const result = await productService.getProductFilters(categoryId);
  success(res, result);
});

export const acquire = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { collectionId } = req.body as { collectionId?: string };
  const data = await downloadService.acquireProduct(
    req.user!._id.toString(),
    req.params.id,
    collectionId,
  );
  success(res, data, 201, 'Product acquired');
});
