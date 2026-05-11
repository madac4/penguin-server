import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type SubscriptionPaymentStatus = 'paid' | 'failed';

export interface ISubscriptionPayment {
  userId: Types.ObjectId;
  subscriptionId: Types.ObjectId | null;
  lsSubscriptionId: string;
  lsPaymentId: string;
  status: SubscriptionPaymentStatus;
  total: number | null;
  currency: string | null;
  receiptUrl: string | null;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPaymentDocument extends ISubscriptionPayment, Document {}

const subscriptionPaymentSchema = new Schema<ISubscriptionPaymentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', default: null },
    lsSubscriptionId: { type: String, required: true, index: true },
    lsPaymentId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['paid', 'failed'], required: true },
    total: { type: Number, default: null },
    currency: { type: String, default: null },
    receiptUrl: { type: String, default: null },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

subscriptionPaymentSchema.index({ userId: 1, paidAt: -1 });

export const SubscriptionPayment: Model<ISubscriptionPaymentDocument> =
  mongoose.models.SubscriptionPayment ??
  model<ISubscriptionPaymentDocument>('SubscriptionPayment', subscriptionPaymentSchema);
