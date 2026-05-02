import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

export interface ICategoryFilter {
  category: Types.ObjectId;
  name: ITranslatedField;
  slug: ITranslatedField;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryFilterDocument extends ICategoryFilter, Document {}

const categoryFilterSchema = new Schema<ICategoryFilterDocument>(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: translatedFieldSchema, required: true },
    slug: { type: translatedFieldSchema, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categoryFilterSchema.index({ category: 1, 'slug.en': 1 }, { unique: true });
categoryFilterSchema.index({ category: 1, 'slug.ru': 1 }, { unique: true });

export const CategoryFilter: Model<ICategoryFilterDocument> =
  mongoose.models.CategoryFilter ??
  model<ICategoryFilterDocument>('CategoryFilter', categoryFilterSchema);
