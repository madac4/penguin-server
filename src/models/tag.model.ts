import mongoose, { Schema, model, type Document, type Model } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

// ─── Tag ──────────────────────────────────────────────────────────────────────

export interface ITag {
  name: ITranslatedField;
  slug: ITranslatedField;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagDocument extends ITag, Document {}

const tagSchema = new Schema<ITagDocument>(
  {
    name: { type: translatedFieldSchema, required: true },
    slug: { type: translatedFieldSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

tagSchema.index({ 'name.en': 'text', 'name.ru': 'text' }, { name: 'tag_text_search' });

tagSchema.index({ 'slug.en': 1 }, { unique: true });
tagSchema.index({ 'slug.ru': 1 }, { unique: true });

export const Tag: Model<ITagDocument> =
  mongoose.models.Tag ?? model<ITagDocument>('Tag', tagSchema);
