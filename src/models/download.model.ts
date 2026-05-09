import { type Document, model, Schema, type Types } from 'mongoose';

export type AcquisitionSource = 'subscription_quota' | 'admin_grant' | 'migration';

export interface IDownload {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  collectionId: Types.ObjectId | null;
  acquisitionSource: AcquisitionSource;
  subscriptionId: Types.ObjectId | null;
  subscriptionPlanId: Types.ObjectId | null;
  quotaConsumed: boolean;
  acquiredAt: Date;
  downloadedAt: Date;
}

export type IDownloadDocument = IDownload & Document;

const downloadSchema = new Schema<IDownloadDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', default: null },
    acquisitionSource: {
      type: String,
      enum: ['subscription_quota', 'admin_grant', 'migration'],
      default: 'subscription_quota',
    },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', default: null },
    subscriptionPlanId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    quotaConsumed: { type: Boolean, default: true },
    acquiredAt: { type: Date, default: Date.now },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

downloadSchema.index({ userId: 1, productId: 1 }, { unique: true });
downloadSchema.index({ productId: 1 });
downloadSchema.index({ acquiredAt: -1 });

export const Download = model<IDownloadDocument>('Download', downloadSchema);
