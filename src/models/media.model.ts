import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { MediaType, UploadFolder } from '../utils/enums';

// ─── Media ───────────────────────────────────────────────────────────────────

export interface IMedia {
  filename: string;
  url: string;
  key: string;
  mimeType: string;
  size: number;
  type: MediaType;
  folder: UploadFolder;
  uploadedBy: Types.ObjectId;
  alt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaDocument extends IMedia, Document {}

const mediaSchema = new Schema<IMediaDocument>(
  {
    filename: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    key: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(MediaType),
      required: true,
    },
    folder: {
      type: String,
      enum: Object.values(UploadFolder),
      required: true,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    alt: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

mediaSchema.index({ folder: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ filename: 'text', alt: 'text' }, { name: 'media_text_search' });

export const Media: Model<IMediaDocument> =
  mongoose.models.Media ?? model<IMediaDocument>('Media', mediaSchema);
