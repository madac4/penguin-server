import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type OrderStatus = 'paid' | 'refunded';

export interface IOrder {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  lsOrderId: string;
  total: number; // in cents
  currency: string;
  receiptUrl: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}

const orderSchema = new Schema<IOrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
    lsOrderId: { type: String, required: true, unique: true },
    total: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    receiptUrl: { type: String, required: true },
    status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  },
  { timestamps: true },
);

// Fast lookup: "has user purchased this product?"
orderSchema.index({ userId: 1, productIds: 1 });

export const Order: Model<IOrderDocument> =
  mongoose.models.Order ?? model<IOrderDocument>('Order', orderSchema);
