import type { IPropertyDefinitionDocument } from '../models/property-definition.model';
import type { ITranslatedField } from '../models/shared.schema';

export interface PropertyDefinitionDto {
  id: string;
  name: ITranslatedField;
  slug: ITranslatedField;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPropertyDefinitionDto(doc: IPropertyDefinitionDocument): PropertyDefinitionDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
