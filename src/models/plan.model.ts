import mongoose, { Schema, model, type Document, type Model } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

export interface IPlan {
  name: ITranslatedField;
  slug: string;
  downloadCredits: number;
  durationDays: number;
  priceCents: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanDocument extends IPlan, Document {}

const planSchema = new Schema<IPlanDocument>(
  {
    name: { type: translatedFieldSchema, required: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    downloadCredits: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1 },
    priceCents: { type: Number, required: true, min: 0 },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

planSchema.index({ isActive: 1, sortOrder: 1 });

export const Plan: Model<IPlanDocument> =
  mongoose.models.Plan ?? model<IPlanDocument>('Plan', planSchema);
