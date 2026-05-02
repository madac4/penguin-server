import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as subscriptionService from '../services/subscription.service';
import { success } from '../utils/response.util';
import type { GrantSubscriptionInput } from '../validators/subscription.validator';

export const getMine = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const sub = await subscriptionService.getActiveForUser(req.user!._id.toString());
  success(res, sub);
});

export const listForUser = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const subs = await subscriptionService.listForUser(req.params.userId);
  success(res, subs);
});

export const grant = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { planId } = req.body as GrantSubscriptionInput;
  const sub = await subscriptionService.grant(req.params.userId, planId);
  success(res, sub, 201, 'Subscription granted');
});

export const cancel = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const sub = await subscriptionService.cancel(req.params.id);
  success(res, sub, 200, 'Subscription cancelled');
});
