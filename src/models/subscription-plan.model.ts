import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

export interface ISubscriptionPlan {
  lsVariantId: string;
  downloadsPerPeriod: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlanDocument extends ISubscriptionPlan, Document {}

const subscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>(
  {
    lsVariantId: { type: String, required: true, unique: true },
    downloadsPerPeriod: { type: Number, required: true, min: 1 },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SubscriptionPlan: Model<ISubscriptionPlanDocument> =
  mongoose.models.SubscriptionPlan ??
  model<ISubscriptionPlanDocument>('SubscriptionPlan', subscriptionPlanSchema);
