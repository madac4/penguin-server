import mongoose, { Schema, model, type Document, type Model } from 'mongoose';
import { translatedFieldSchema, type ITranslatedField } from './shared.schema';

export interface IPropertyDefinition {
  name: ITranslatedField;
  slug: ITranslatedField;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyDefinitionDocument extends IPropertyDefinition, Document {}

const propertyDefinitionSchema = new Schema<IPropertyDefinitionDocument>(
  {
    name: { type: translatedFieldSchema, required: true },
    slug: { type: translatedFieldSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

propertyDefinitionSchema.index(
  { 'name.en': 'text', 'name.ru': 'text' },
  { name: 'prop_def_text_search' },
);

propertyDefinitionSchema.index({ 'slug.en': 1 }, { unique: true });
propertyDefinitionSchema.index({ 'slug.ru': 1 }, { unique: true });

export const PropertyDefinition: Model<IPropertyDefinitionDocument> =
  mongoose.models.PropertyDefinition ??
  model<IPropertyDefinitionDocument>('PropertyDefinition', propertyDefinitionSchema);
