import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { SubscriptionStatus } from '../utils/enums';

export interface ISubscription {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: SubscriptionStatus;
  downloadsRemaining: number;
  startedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDocument extends ISubscription, Document {}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.Active,
      required: true,
    },
    downloadsRemaining: { type: Number, required: true, min: 0 },
    startedAt: { type: Date, required: true, default: () => new Date() },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

subscriptionSchema.index({ user: 1, status: 1 });

export const Subscription: Model<ISubscriptionDocument> =
  mongoose.models.Subscription ??
  model<ISubscriptionDocument>('Subscription', subscriptionSchema);
