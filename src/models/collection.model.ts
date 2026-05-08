import { type Document, model, Schema, type Types } from 'mongoose';

export interface ICollectionItem {
  productId: Types.ObjectId;
  enrolledAt: Date;
}

export interface ICollection {
  userId: Types.ObjectId;
  name: string;
  items: ICollectionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type ICollectionDocument = ICollection & Document;

const collectionItemSchema = new Schema<ICollectionItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    enrolledAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const collectionSchema = new Schema<ICollectionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    items: [collectionItemSchema],
  },
  { timestamps: true },
);

collectionSchema.index({ userId: 1, name: 1 }, { unique: true });
collectionSchema.index({ 'items.productId': 1 });

export const Collection = model<ICollectionDocument>('Collection', collectionSchema);
