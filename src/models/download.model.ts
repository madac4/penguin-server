import { type Document, model, Schema, type Types } from 'mongoose';

export interface IDownload {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  collectionId: Types.ObjectId | null;
  downloadedAt: Date;
}

export type IDownloadDocument = IDownload & Document;

const downloadSchema = new Schema<IDownloadDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', default: null },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

downloadSchema.index({ userId: 1, productId: 1 }, { unique: true });
downloadSchema.index({ productId: 1 });

export const Download = model<IDownloadDocument>('Download', downloadSchema);
