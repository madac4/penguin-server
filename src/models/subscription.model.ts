import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface ISubscription {
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  downloadsLimit: number; // snapshot from plan at subscription time
  downloadsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDocument extends ISubscription, Document {}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    downloadsLimit: { type: Number, required: true },
    downloadsUsed: { type: Number, default: 0 },
  },
  { timestamps: true },
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 }); // for expiry jobs

export const Subscription: Model<ISubscriptionDocument> =
  mongoose.models.Subscription ??
  model<ISubscriptionDocument>('Subscription', subscriptionSchema);
