import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface ISubscription {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  lsSubscriptionId: string;
  status: SubscriptionStatus;
  downloadsUsed: number;
  renewsAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDocument extends ISubscription, Document {}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    lsSubscriptionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due'],
      default: 'active',
    },
    downloadsUsed: { type: Number, default: 0 },
    renewsAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One active subscription per user
subscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription: Model<ISubscriptionDocument> =
  mongoose.models.Subscription ??
  model<ISubscriptionDocument>('Subscription', subscriptionSchema);
