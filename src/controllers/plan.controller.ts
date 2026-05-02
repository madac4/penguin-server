import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as planService from '../services/plan.service';
import { success } from '../utils/response.util';
import type {
  CreatePlanInput,
  ListPlansInput,
  UpdatePlanInput,
} from '../validators/plan.validator';

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plan = await planService.createPlan(req.body as CreatePlanInput);
  success(res, plan, 201, 'Plan created successfully');
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plan = await planService.getPlanById(req.params.id);
  success(res, plan);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const result = await planService.listPlans(req.query as unknown as ListPlansInput);
  success(res, result);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const plan = await planService.updatePlan(req.params.id, req.body as UpdatePlanInput);
  success(res, plan, 200, 'Plan updated successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await planService.deletePlan(req.params.id);
  success(res, null, 200, 'Plan deleted successfully');
});
