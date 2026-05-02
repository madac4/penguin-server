import mongoose, { Schema, model, type Document, type Model } from 'mongoose';

export interface ISubscriptionPlan {
  name: string;
  slug: string;
  downloadLimit: number; // files per subscription period
  durationDays: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlanDocument extends ISubscriptionPlan, Document {}

const subscriptionPlanSchema = new Schema<ISubscriptionPlanDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    downloadLimit: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SubscriptionPlan: Model<ISubscriptionPlanDocument> =
  mongoose.models.SubscriptionPlan ??
  model<ISubscriptionPlanDocument>('SubscriptionPlan', subscriptionPlanSchema);
