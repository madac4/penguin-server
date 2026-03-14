import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

// ─── Product Properties (embedded) ───────────────────────────────────────────

export interface IProductProperties {
  size: string | null;
  material: string | null;
  color: string | null;
  weight: string | null;
}

const productPropertiesSchema = new Schema<IProductProperties>(
  {
    size: { type: String, default: null },
    material: { type: String, default: null },
    color: { type: String, default: null },
    weight: { type: String, default: null },
  },
  { _id: false },
);

// ─── Product ──────────────────────────────────────────────────────────────────

export interface IProduct {
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  images: string[];
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  price: number;
  viewCount: number;
  likeCount: number;
  properties: IProductProperties;
  fileFormats: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: translatedFieldSchema, required: true },
    description: { type: translatedFieldSchema, default: { en: '', ru: '' } },
    slug: { type: translatedFieldSchema, required: true },
    images: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    price: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    properties: {
      type: productPropertiesSchema,
      default: () => ({ size: null, material: null, color: null, weight: null }),
    },
    fileFormats: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index(
  { 'name.en': 'text', 'name.ru': 'text', 'description.en': 'text', 'description.ru': 'text' },
  { name: 'product_text_search' },
);

productSchema.index({ 'slug.en': 1 }, { unique: true });
productSchema.index({ 'slug.ru': 1 }, { unique: true });

productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

export const Product: Model<IProductDocument> =
  mongoose.models.Product ?? model<IProductDocument>('Product', productSchema);
