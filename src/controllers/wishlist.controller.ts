import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as wishlistService from '../services/wishlist.service';
import { success } from '../utils/response.util';
import type { ListWishlistInput } from '../validators/wishlist.validator';

export const add = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const result = await wishlistService.addToWishlist(userId, req.params.productId);
  success(res, result, 201, 'Product added to wishlist');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const result = await wishlistService.removeFromWishlist(userId, req.params.productId);
  success(res, result, 200, 'Product removed from wishlist');
});

export const toggle = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const result = await wishlistService.toggleWishlist(userId, req.params.productId);
  success(
    res,
    result,
    200,
    result.added ? 'Product added to wishlist' : 'Product removed from wishlist',
  );
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const result = await wishlistService.getUserWishlist(
    userId,
    req.query as unknown as ListWishlistInput,
  );
  success(res, result);
});

export const count = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  const total = await wishlistService.getWishlistCount(userId);
  success(res, { total });
});

export const clean = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();
  await wishlistService.cleanWishlist(userId);
  success(res, null, 200, 'Wishlist cleaned');
});
