import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose'

// ─── i18n Translated Field ───────────────────────────────────────────────────

export interface ITranslatedField {
  en: string;
  ru: string;
}

const translatedFieldSchema = new Schema<ITranslatedField>(
  {
    en: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false },
);

// ─── Category ─────────────────────────────────────────────────────────────────

export interface ICategory {
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  parent: Types.ObjectId | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends ICategory, Document {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: translatedFieldSchema, required: true },
    description: { type: translatedFieldSchema, default: { en: '', ru: '' } },
    slug: { type: translatedFieldSchema, required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Text index for bilingual full-text search
categorySchema.index(
  { 'name.en': 'text', 'name.ru': 'text', 'description.en': 'text', 'description.ru': 'text' },
  { name: 'category_text_search' },
);

// Unique slug per language
categorySchema.index({ 'slug.en': 1 }, { unique: true });
categorySchema.index({ 'slug.ru': 1 }, { unique: true });

// Parent lookup
categorySchema.index({ parent: 1 });

// Sort order
categorySchema.index({ sortOrder: 1 });

export const Category: Model<ICategoryDocument> =
  mongoose.models.Category ?? model<ICategoryDocument>('Category', categorySchema);
