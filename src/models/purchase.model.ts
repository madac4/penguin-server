import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';

export interface IPurchase {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseDocument extends IPurchase, Document {}

const purchaseSchema = new Schema<IPurchaseDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { timestamps: true },
);

purchaseSchema.index({ userId: 1, productId: 1 }, { unique: true });
purchaseSchema.index({ userId: 1 });
purchaseSchema.index({ productId: 1 });

export const Purchase: Model<IPurchaseDocument> =
  mongoose.models.Purchase ?? model<IPurchaseDocument>('Purchase', purchaseSchema);
