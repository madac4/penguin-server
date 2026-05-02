import { ErrorHandler } from '../middlewares/error.middleware';
import { Subscription } from '../models/subscription.model';
import { SubscriptionDownload } from '../models/subscription-download.model';
import type { ISubscriptionDocument } from '../models/subscription.model';

// ─── Active subscription ──────────────────────────────────────────────────────

export async function getActiveSubscription(
  userId: string,
): Promise<ISubscriptionDocument | null> {
  return Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: new Date() },
  });
}

// ─── Remaining downloads ──────────────────────────────────────────────────────

export function remainingDownloads(subscription: ISubscriptionDocument): number {
  return Math.max(0, subscription.downloadsLimit - subscription.downloadsUsed);
}

// ─── Check if user already unlocked a product via subscription ────────────────

export async function hasUnlockedViaSubscription(
  userId: string,
  productId: string,
): Promise<boolean> {
  return !!(await SubscriptionDownload.exists({ userId, productId }));
}

// ─── Consume one download credit and record the unlock ───────────────────────

export async function consumeDownloadCredit(
  subscription: ISubscriptionDocument,
  userId: string,
  productId: string,
): Promise<void> {
  if (remainingDownloads(subscription) <= 0) {
    throw new ErrorHandler('No download credits remaining in your subscription', 403);
  }

  // Atomic increment to prevent race conditions
  const updated = await Subscription.findOneAndUpdate(
    {
      _id: subscription._id,
      // Re-check that downloads still available at write time
      $expr: { $lt: ['$downloadsUsed', '$downloadsLimit'] },
    },
    { $inc: { downloadsUsed: 1 } },
  );

  if (!updated) {
    throw new ErrorHandler('No download credits remaining in your subscription', 403);
  }

  await SubscriptionDownload.create({
    userId,
    productId,
    subscriptionId: subscription._id,
  });
}
