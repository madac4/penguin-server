import type { ICategoryFilterDocument } from '../models/category-filter.model';
import type { ITranslatedField } from '../models/shared.schema';

export interface CategoryFilterDto {
  id: string;
  category: string;
  name: ITranslatedField;
  slug: ITranslatedField;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toCategoryFilterDto(doc: ICategoryFilterDocument): CategoryFilterDto {
  return {
    id: doc._id.toString(),
    category: doc.category.toString(),
    name: doc.name,
    slug: doc.slug,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
