import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

// ─── Product File (embedded uploaded 3D model file) ──────────────────────────

export interface IProductFile {
  /** R2 object key/path. Signed URLs are generated only at download time. */
  url: string;
  filename: string;
  /** Optional product variant label, e.g. ring size or model size. */
  label: string;
  format: string;
  size: number;
}

const productFileSchema = new Schema<IProductFile>(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    label: { type: String, default: '', trim: true },
    format: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

// ─── Product Property (embedded value referencing a definition) ──────────────

export interface IProductProperty {
  definition: Types.ObjectId;
  /** Legacy single-value field kept for backward compatibility. */
  value: string;
  values: string[];
  isActive: boolean;
}

const productPropertySchema = new Schema<IProductProperty>(
  {
    definition: { type: Schema.Types.ObjectId, ref: 'PropertyDefinition', required: true },
    value: { type: String, default: '', trim: true },
    values: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

// ─── Product ──────────────────────────────────────────────────────────────────

export interface IProduct {
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  thumbnail: string;
  images: string[];
  files: IProductFile[];
  category: Types.ObjectId;
  tags: Types.ObjectId[];
  isFree: boolean;
  viewCount: number;
  likeCount: number;
  properties: IProductProperty[];
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
    thumbnail: { type: String, default: '' },
    images: { type: [String], default: [] },
    files: { type: [productFileSchema], default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    isFree: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    properties: { type: [productPropertySchema], default: [] },
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
