import { ErrorHandler } from '../middlewares/error.middleware';
import {
  SubscriptionPlan,
  type ISubscriptionPlan,
} from '../models/subscription-plan.model';
import { getLsVariant } from './lemonsqueezy.service';

const LS_DASHBOARD = 'https://app.lemonsqueezy.com';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface SubscriptionPlanDto {
  id: string;
  lsVariantId: string;
  name: string;
  description: string | null;
  price: number; // in dollars, from LS
  interval: 'month' | 'year' | null; // from LS
  downloadsPerPeriod: number;
  imageUrl: string;
  isActive: boolean;
  lsEditUrl: string;
  createdAt: string;
}

// ─── Register a variant ───────────────────────────────────────────────────────

export interface RegisterPlanInput {
  lsVariantId: string;
  downloadsPerPeriod: number;
  imageUrl?: string;
}

export async function registerPlan(input: RegisterPlanInput): Promise<SubscriptionPlanDto> {
  const existing = await SubscriptionPlan.findOne({ lsVariantId: input.lsVariantId });
  if (existing) throw new ErrorHandler('This variant is already registered', 409);

  const variant = await getLsVariant(input.lsVariantId);
  if (!variant) throw new ErrorHandler('Variant not found in Lemon Squeezy', 404);

  const plan = await SubscriptionPlan.create(input);
  return mergeWithVariant(plan.toObject(), variant);
}

// ─── List all registered plans (merged with LS data) ─────────────────────────

export async function listPlans(): Promise<SubscriptionPlanDto[]> {
  const plans = await SubscriptionPlan.find().sort({ createdAt: 1 }).lean();
  if (plans.length === 0) return [];

  const variants = await Promise.all(plans.map((p) => getLsVariant(p.lsVariantId)));

  return plans
    .map((plan, i) => {
      const variant = variants[i];
      if (!variant) return null;
      return mergeWithVariant(plan, variant);
    })
    .filter((p): p is SubscriptionPlanDto => p !== null);
}

// ─── Get single plan ──────────────────────────────────────────────────────────

export async function getPlanById(id: string): Promise<SubscriptionPlanDto> {
  const plan = await SubscriptionPlan.findById(id).lean();
  if (!plan) throw new ErrorHandler('Subscription plan not found', 404);

  const variant = await getLsVariant(plan.lsVariantId);
  if (!variant) throw new ErrorHandler('Variant not found in Lemon Squeezy', 404);

  return mergeWithVariant(plan, variant);
}

export async function getPlanByVariantId(lsVariantId: string) {
  return SubscriptionPlan.findOne({ lsVariantId }).lean();
}

// ─── Update local config only ─────────────────────────────────────────────────

export interface UpdatePlanInput {
  lsVariantId?: string;
  downloadsPerPeriod?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<SubscriptionPlanDto> {
  if (input.lsVariantId) {
    const conflict = await SubscriptionPlan.findOne({ lsVariantId: input.lsVariantId, _id: { $ne: id } });
    if (conflict) throw new ErrorHandler('This variant ID is already used by another plan', 409);
  }

  const plan = await SubscriptionPlan.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).lean();
  if (!plan) throw new ErrorHandler('Subscription plan not found', 404);

  const variant = await getLsVariant(plan.lsVariantId);
  if (!variant) throw new ErrorHandler('Variant not found in Lemon Squeezy', 404);

  return mergeWithVariant(plan, variant);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePlan(id: string): Promise<void> {
  const plan = await SubscriptionPlan.findByIdAndDelete(id);
  if (!plan) throw new ErrorHandler('Subscription plan not found', 404);
}

// ─── Internal helper ──────────────────────────────────────────────────────────

import type { LsVariant } from './lemonsqueezy.service';

function mergeWithVariant(
  plan: ISubscriptionPlan & { _id: { toString(): string }; createdAt: Date },
  variant: LsVariant,
): SubscriptionPlanDto {
  return {
    id: plan._id.toString(),
    lsVariantId: plan.lsVariantId,
    name: variant.name,
    description: variant.description,
    price: variant.price,
    interval: variant.interval,
    downloadsPerPeriod: plan.downloadsPerPeriod,
    imageUrl: plan.imageUrl,
    isActive: plan.isActive,
    lsEditUrl: `${LS_DASHBOARD}/products/${variant.productId}/variants/${variant.id}/edit`,
    createdAt: plan.createdAt.toISOString(),
  };
}
