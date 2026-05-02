import { toSubscriptionDto, type SubscriptionDto } from '@/dtos/subscription.dto';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Plan } from '../models/plan.model';
import { Subscription, type ISubscriptionDocument } from '../models/subscription.model';
import { User } from '../models/user.model';
import { SubscriptionStatus } from '../utils/enums';

/**
 * Returns the user's currently active subscription, or null. Lazily expires
 * subscriptions whose expiresAt has passed.
 */
export async function getActiveForUser(userId: string): Promise<SubscriptionDto | null> {
  const sub = await Subscription.findOne({ user: userId, status: SubscriptionStatus.Active })
    .populate('plan')
    .sort({ expiresAt: -1 });

  if (!sub) return null;

  if (sub.expiresAt.getTime() <= Date.now()) {
    sub.status = SubscriptionStatus.Expired;
    await sub.save();
    await User.findByIdAndUpdate(userId, { activeSubscription: null });
    return null;
  }

  return toSubscriptionDto(sub);
}

/**
 * Atomically decrement the active subscription's download credit.
 * Returns the updated subscription, or null if no active sub with credits.
 */
export async function consumeCredit(userId: string): Promise<ISubscriptionDocument | null> {
  return Subscription.findOneAndUpdate(
    {
      user: userId,
      status: SubscriptionStatus.Active,
      downloadsRemaining: { $gt: 0 },
      expiresAt: { $gt: new Date() },
    },
    { $inc: { downloadsRemaining: -1 } },
    { new: true },
  );
}

/**
 * Admin grant: expire any prior Active sub, create a fresh Active sub for the
 * given plan, point user.activeSubscription at it.
 */
export async function grant(userId: string, planId: string): Promise<SubscriptionDto> {
  const user = await User.findById(userId);
  if (!user) throw new ErrorHandler('User not found', 404);

  const plan = await Plan.findById(planId);
  if (!plan) throw new ErrorHandler('Plan not found', 404);
  if (!plan.isActive) throw new ErrorHandler('Plan is not active', 400);

  await Subscription.updateMany(
    { user: userId, status: SubscriptionStatus.Active },
    { status: SubscriptionStatus.Cancelled },
  );

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const sub = await Subscription.create({
    user: userId,
    plan: plan._id,
    status: SubscriptionStatus.Active,
    downloadsRemaining: plan.downloadCredits,
    startedAt,
    expiresAt,
  });

  user.activeSubscription = sub._id as typeof user.activeSubscription;
  await user.save();

  await sub.populate('plan');
  return toSubscriptionDto(sub);
}

/**
 * Admin cancel: flip a subscription to Cancelled. If it was the user's
 * activeSubscription pointer, clear that too.
 */
export async function cancel(subscriptionId: string): Promise<SubscriptionDto> {
  const sub = await Subscription.findById(subscriptionId);
  if (!sub) throw new ErrorHandler('Subscription not found', 404);

  sub.status = SubscriptionStatus.Cancelled;
  await sub.save();

  await User.updateOne(
    { _id: sub.user, activeSubscription: sub._id },
    { activeSubscription: null },
  );

  await sub.populate('plan');
  return toSubscriptionDto(sub);
}

export async function listForUser(userId: string): Promise<SubscriptionDto[]> {
  const subs = await Subscription.find({ user: userId })
    .populate('plan')
    .sort({ createdAt: -1 });
  return subs.map((s) => toSubscriptionDto(s));
}
