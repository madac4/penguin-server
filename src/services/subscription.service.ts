import { ErrorHandler } from '../middlewares/error.middleware';
import {
  SubscriptionPayment,
  type SubscriptionPaymentStatus,
} from '../models/subscription-payment.model';
import { SubscriptionPlan } from '../models/subscription-plan.model';
import { Subscription, type SubscriptionStatus } from '../models/subscription.model';
import type { SubscriptionPlanDto } from './subscription-plan.service';
import { getPlanByVariantId, getPlanById } from './subscription-plan.service';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface SubscriptionDto {
  id: string;
  userId: string;
  plan: SubscriptionPlanDto;
  lsSubscriptionId: string;
  status: SubscriptionStatus;
  downloadsUsed: number;
  downloadsRemaining: number;
  renewsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface BillingHistoryDto {
  id: string;
  userId: string;
  subscriptionId: string | null;
  lsSubscriptionId: string;
  lsPaymentId: string;
  status: SubscriptionPaymentStatus;
  total: number | null;
  currency: string | null;
  receiptUrl: string | null;
  paidAt: string;
  createdAt: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function toDto(
  sub: NonNullable<Awaited<ReturnType<typeof Subscription.findOne>>>,
): Promise<SubscriptionDto> {
  const plan = await getPlanById(sub.planId.toString());
  return {
    id: sub._id.toString(),
    userId: sub.userId.toString(),
    plan,
    lsSubscriptionId: sub.lsSubscriptionId,
    status: sub.status,
    downloadsUsed: sub.downloadsUsed,
    downloadsRemaining: Math.max(0, plan.downloadsPerPeriod - sub.downloadsUsed),
    renewsAt: sub.renewsAt ? sub.renewsAt.toISOString() : null,
    cancelledAt: sub.cancelledAt ? sub.cancelledAt.toISOString() : null,
    createdAt: sub.createdAt.toISOString(),
  };
}

// ─── Download quota ───────────────────────────────────────────────────────────

function isEffectivelyActive(sub: { status: string; renewsAt: Date | null }): boolean {
  if (sub.status === 'active') return true;
  // Cancelled but still within the paid period
  if (sub.status === 'cancelled' && sub.renewsAt && sub.renewsAt > new Date()) return true;
  return false;
}

export async function hasDownloadQuota(userId: string): Promise<boolean> {
  // Not lean — keeps _id as a typed ObjectId for consistent query behaviour
  const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
  if (!sub || !isEffectivelyActive(sub)) return false;
  const plan = await SubscriptionPlan.findById(sub.planId).lean();
  if (!plan) return false;
  return sub.downloadsUsed < plan.downloadsPerPeriod;
}

export interface ConsumedDownloadQuota {
  subscriptionId: string;
  subscriptionPlanId: string;
}

export async function consumeDownload(userId: string): Promise<ConsumedDownloadQuota> {
  // Not lean — a lean _id comes back typed as `unknown` in Mongoose's generic
  // inference, causing updateOne({ _id }) to silently match nothing.
  const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });

  if (!sub) throw new ErrorHandler('No active subscription found', 403);

  if (sub.status === 'expired') throw new ErrorHandler('Your subscription has expired', 403);

  if (sub.status === 'past_due')
    throw new ErrorHandler('Your subscription payment is past due', 403);

  if (sub.status === 'cancelled') {
    if (!sub.renewsAt || sub.renewsAt <= new Date())
      throw new ErrorHandler('Your subscription has been cancelled', 403);
    // renewsAt is still in the future — grace period, allow
  }

  const plan = await SubscriptionPlan.findById(sub.planId).lean();
  if (!plan) throw new ErrorHandler('Subscription plan not found', 500);

  if (sub.downloadsUsed >= plan.downloadsPerPeriod)
    throw new ErrorHandler('Download quota exceeded for this billing period', 403);

  await Subscription.updateOne({ _id: sub._id }, { $inc: { downloadsUsed: 1 } });

  return {
    subscriptionId: sub._id.toString(),
    subscriptionPlanId: sub.planId.toString(),
  };
}

// ─── User-facing queries ──────────────────────────────────────────────────────

export async function getUserSubscription(userId: string): Promise<SubscriptionDto | null> {
  const sub = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'cancelled', 'past_due'] },
  }).sort({ createdAt: -1 });
  if (!sub) return null;
  return toDto(sub);
}

function toBillingHistoryDto(
  payment: NonNullable<Awaited<ReturnType<typeof SubscriptionPayment.findOne>>>,
): BillingHistoryDto {
  return {
    id: payment._id.toString(),
    userId: payment.userId.toString(),
    subscriptionId: payment.subscriptionId ? payment.subscriptionId.toString() : null,
    lsSubscriptionId: payment.lsSubscriptionId,
    lsPaymentId: payment.lsPaymentId,
    status: payment.status,
    total: payment.total,
    currency: payment.currency,
    receiptUrl: payment.receiptUrl,
    paidAt: payment.paidAt.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function getUserBillingHistory(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<PaginatedDto<BillingHistoryDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    SubscriptionPayment.find({ userId }).sort({ paidAt: -1 }).skip(skip).limit(limit),
    SubscriptionPayment.countDocuments({ userId }),
  ]);

  return paginatedResult(payments.map(toBillingHistoryDto), total, page, limit);
}

// ─── Webhook handlers ─────────────────────────────────────────────────────────

export interface SubscriptionCreatedInput {
  lsSubscriptionId: string;
  lsVariantId: string;
  userId: string;
  renewsAt: string | null;
}

export async function handleSubscriptionCreated(input: SubscriptionCreatedInput): Promise<void> {
  const plan = await getPlanByVariantId(input.lsVariantId);
  if (!plan) return; // unknown variant — skip silently

  await Subscription.updateOne(
    { lsSubscriptionId: input.lsSubscriptionId },
    {
      $setOnInsert: {
        userId: input.userId,
        planId: plan._id,
        lsSubscriptionId: input.lsSubscriptionId,
        status: 'active',
        downloadsUsed: 0,
        renewsAt: input.renewsAt ? new Date(input.renewsAt) : null,
        cancelledAt: null,
      },
    },
    { upsert: true },
  );
}

export async function handleSubscriptionRenewed(
  lsSubscriptionId: string,
  renewsAt: string | null,
): Promise<void> {
  await Subscription.updateOne(
    { lsSubscriptionId },
    {
      status: 'active',
      downloadsUsed: 0,
      renewsAt: renewsAt ? new Date(renewsAt) : null,
    },
  );
}

export interface SubscriptionPaymentInput {
  lsSubscriptionId: string;
  lsPaymentId: string;
  status: SubscriptionPaymentStatus;
  total?: number | null;
  currency?: string | null;
  receiptUrl?: string | null;
  paidAt?: string | null;
}

export async function recordSubscriptionPayment(input: SubscriptionPaymentInput): Promise<void> {
  const subscription = await Subscription.findOne({ lsSubscriptionId: input.lsSubscriptionId });
  if (!subscription) return;

  await SubscriptionPayment.updateOne(
    { lsPaymentId: input.lsPaymentId },
    {
      $setOnInsert: {
        userId: subscription.userId,
        subscriptionId: subscription._id,
        lsSubscriptionId: input.lsSubscriptionId,
        lsPaymentId: input.lsPaymentId,
        status: input.status,
        total: input.total ?? null,
        currency: input.currency ?? null,
        receiptUrl: input.receiptUrl ?? null,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      },
    },
    { upsert: true },
  );
}

export async function handleSubscriptionCancelled(lsSubscriptionId: string): Promise<void> {
  await Subscription.updateOne(
    { lsSubscriptionId },
    { status: 'cancelled', cancelledAt: new Date() },
  );
}

export async function handleSubscriptionExpired(lsSubscriptionId: string): Promise<void> {
  await Subscription.updateOne({ lsSubscriptionId }, { status: 'expired' });
}

export async function handleSubscriptionPastDue(lsSubscriptionId: string): Promise<void> {
  await Subscription.updateOne({ lsSubscriptionId }, { status: 'past_due' });
}

// ─── Admin: list all subscriptions ───────────────────────────────────────────

import type { PaginatedDto } from '@/dtos/common.dto';
import { paginatedResult } from '@/utils/pagination.util';

export interface ListSubscriptionsQuery {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  userId?: string;
}

export async function listAllSubscriptions(
  query: ListSubscriptionsQuery,
): Promise<PaginatedDto<SubscriptionDto>> {
  const page = Math.max(query.page ?? 1, 1);
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.userId) filter.userId = query.userId;

  const [subs, total] = await Promise.all([
    Subscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Subscription.countDocuments(filter),
  ]);

  const items = await Promise.all(subs.map(toDto));
  return paginatedResult(items, total, page, limit);
}
