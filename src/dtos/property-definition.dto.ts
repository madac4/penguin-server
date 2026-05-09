import type { IPropertyDefinitionDocument } from '../models/property-definition.model';
import type { ITranslatedField } from '../models/shared.schema';

export interface PropertyDefinitionDto {
  id: string;
  name: ITranslatedField;
  slug: ITranslatedField;
  categories: string[];
  values: string[];
  isActive: boolean;
  showInListing: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toPropertyDefinitionDto(doc: IPropertyDefinitionDocument): PropertyDefinitionDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    categories: doc.categories?.map((category) => category.toString()) ?? [],
    values: doc.values ?? [],
    isActive: doc.isActive,
    showInListing: doc.showInListing,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
