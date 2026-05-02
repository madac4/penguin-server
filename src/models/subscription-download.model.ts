import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface ISubscriptionDownload {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDownloadDocument extends ISubscriptionDownload, Document {}

const subscriptionDownloadSchema = new Schema<ISubscriptionDownloadDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
  },
  { timestamps: true },
);

// One credit per product per user — prevents double-spending
subscriptionDownloadSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const SubscriptionDownload: Model<ISubscriptionDownloadDocument> =
  mongoose.models.SubscriptionDownload ??
  model<ISubscriptionDownloadDocument>('SubscriptionDownload', subscriptionDownloadSchema);
