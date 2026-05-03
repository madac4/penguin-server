import type { Request, Response } from 'express';
import { CatchAsyncErrors, ErrorHandler } from '../middlewares/error.middleware';
import * as lsService from '../services/lemonsqueezy.service';
import * as planService from '../services/subscription-plan.service';
import * as subscriptionService from '../services/subscription.service';
import { success } from '../utils/response.util';

// ─── POST /subscriptions/checkout ────────────────────────────────────────────

export const checkout = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { planId } = req.body as { planId: string };
  const userId = req.user!._id.toString();

  if (!planId) throw new ErrorHandler('planId is required', 400);

  const plan = await planService.getPlanById(planId);
  if (!plan.isActive) throw new ErrorHandler('This plan is no longer available', 400);

  const existing = await subscriptionService.getUserSubscription(userId);
  if (existing?.status === 'active') {
    throw new ErrorHandler('You already have an active subscription', 400);
  }

  const checkoutUrl = await lsService.createSubscriptionCheckout({
    userId,
    lsVariantId: plan.lsVariantId,
    planName: plan.name,
    planDescription: plan.description ?? undefined,
  });

  success(res, { checkoutUrl });
});

// ─── DELETE /subscriptions/me ─────────────────────────────────────────────────

export const cancel = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!._id.toString();

  const sub = await subscriptionService.getUserSubscription(userId);
  if (!sub) throw new ErrorHandler('No active subscription found', 404);
  if (sub.status !== 'active') throw new ErrorHandler('Subscription is not active', 400);

  await lsService.cancelLsSubscription(sub.lsSubscriptionId);
  // Status will be updated to 'cancelled' via the webhook
  success(res, null, 204);
});

// ─── GET /subscriptions/me ────────────────────────────────────────────────────

export const getMySubscription = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const sub = await subscriptionService.getUserSubscription(req.user!._id.toString());
    success(res, sub);
  },
);

// ─── POST /subscriptions/webhook ─────────────────────────────────────────────

export const webhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-signature'] as string | undefined;

  if (!signature || !req.rawBody) {
    res.status(400).json({ error: 'Missing signature or body' });
    return;
  }

  if (!lsService.verifySubscriptionWebhookSignature(req.rawBody, signature)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = req.body as lsService.LsWebhookPayload;
  const { event_name, custom_data } = payload.meta;

  try {
    if (event_name === 'subscription_created' && custom_data?.user_id) {
      await subscriptionService.handleSubscriptionCreated({
        lsSubscriptionId: payload.data.id,
        lsVariantId: String(payload.data.attributes.variant_id),
        userId: custom_data.user_id,
        renewsAt: payload.data.attributes.renews_at ?? null,
      });
    }

    if (event_name === 'subscription_payment_success') {
      await subscriptionService.handleSubscriptionRenewed(
        payload.data.id,
        payload.data.attributes.renews_at ?? null,
      );
    }

    if (event_name === 'subscription_cancelled') {
      await subscriptionService.handleSubscriptionCancelled(payload.data.id);
    }

    if (event_name === 'subscription_expired') {
      await subscriptionService.handleSubscriptionExpired(payload.data.id);
    }

    if (event_name === 'subscription_payment_failed') {
      await subscriptionService.handleSubscriptionPastDue(payload.data.id);
    }
  } catch {
    // Return 200 so LS doesn't retry on business-logic errors
  }

  res.status(200).json({ received: true });
};

// ─── Admin: GET /subscriptions ────────────────────────────────────────────────

export const adminList = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, status, userId } = req.query as {
    page?: string;
    limit?: string;
    status?: string;
    userId?: string;
  };

  const result = await subscriptionService.listAllSubscriptions({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status: status as Parameters<typeof subscriptionService.listAllSubscriptions>[0]['status'],
    userId,
  });

  success(res, result);
});
