import type { ICategoryDocument } from '../models/category.model';
import type { ITranslatedField } from '../models/shared.schema';

export interface CategoryDto {
  id: string;
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  parent: string | null;
  image: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeDto extends CategoryDto {
  children: CategoryTreeDto[];
}

export function toCategoryDto(doc: ICategoryDocument): CategoryDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    parent: doc.parent?.toString() ?? null,
    image: doc.image,
    icon: doc.icon,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
