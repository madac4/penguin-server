import mongoose, { Schema, model, type Document, type Model, type Types } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

export interface IPropertyDefinition {
  name: ITranslatedField;
  slug: ITranslatedField;
  categories: Types.ObjectId[];
  values: string[];
  isActive: boolean;
  showInListing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyDefinitionDocument extends IPropertyDefinition, Document {}

const propertyDefinitionSchema = new Schema<IPropertyDefinitionDocument>(
  {
    name: { type: translatedFieldSchema, required: true },
    slug: { type: translatedFieldSchema, required: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', required: true }],
    values: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    showInListing: { type: Boolean, default: false },
  },
  { timestamps: true },
);

propertyDefinitionSchema.index(
  { 'name.en': 'text', 'name.ru': 'text' },
  { name: 'prop_def_text_search' },
);

propertyDefinitionSchema.index({ 'slug.en': 1 }, { unique: true });
propertyDefinitionSchema.index({ 'slug.ru': 1 }, { unique: true });
propertyDefinitionSchema.index({ categories: 1 });
propertyDefinitionSchema.index({ isActive: 1 });

export const PropertyDefinition: Model<IPropertyDefinitionDocument> =
  mongoose.models.PropertyDefinition ??
  model<IPropertyDefinitionDocument>('PropertyDefinition', propertyDefinitionSchema);
