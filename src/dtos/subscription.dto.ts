import type { IPlanDocument } from '../models/plan.model';
import type { ISubscriptionDocument } from '../models/subscription.model';
import type { SubscriptionStatus } from '../utils/enums';
import { toPlanDto, type PlanDto } from './plan.dto';

export interface SubscriptionDto {
  id: string;
  user: string;
  plan: string | PlanDto;
  status: SubscriptionStatus;
  downloadsRemaining: number;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export function toSubscriptionDto(doc: ISubscriptionDocument): SubscriptionDto {
  const planRef = doc.plan as unknown;
  const plan =
    planRef && typeof planRef === 'object' && 'name' in (planRef as IPlanDocument)
      ? toPlanDto(planRef as IPlanDocument)
      : (planRef as { toString(): string }).toString();

  return {
    id: doc._id.toString(),
    user: doc.user.toString(),
    plan,
    status: doc.status,
    downloadsRemaining: doc.downloadsRemaining,
    startedAt: doc.startedAt.toISOString(),
    expiresAt: doc.expiresAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
