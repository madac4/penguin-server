import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as planService from '../services/subscription-plan.service';
import { success } from '../utils/response.util';

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plan = await planService.registerPlan(req.body);
  success(res, plan, 201);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plans = await planService.listPlans();
  success(res, plans);
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plan = await planService.getPlanById(req.params.id);
  success(res, plan);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  success(res, plan);
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await planService.deletePlan(req.params.id);
  success(res, null, 204);
});
