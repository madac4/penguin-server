import { ICategoryDocument } from '@/models/category.model';
import type { ICategoryFilterDocument } from '@/models/category-filter.model';
import { IPropertyDefinitionDocument } from '@/models/property-definition.model';
import { ITagDocument } from '@/models/tag.model';
import type { IProductDocument } from '../models/product.model';
import type { ITranslatedField } from '../models/shared.schema';
import { toCategoryDto, type CategoryDto } from './category.dto';
import { toCategoryFilterDto, type CategoryFilterDto } from './category-filter.dto';
import { toPropertyDefinitionDto, type PropertyDefinitionDto } from './property-definition.dto';
import { toTagDto, type TagDto } from './tag.dto';

export interface ProductPropertyDto {
  definition: string;
  value: string;
}

export interface ProductPropertyDetailDto {
  definition: PropertyDefinitionDto;
  value: string;
}

export interface ProductDto {
  id: string;
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  thumbnail: string;
  images: string[];
  fileUrl: string;
  category: string;
  tags: string[];
  isFree: boolean;
  viewCount: number;
  likeCount: number;
  properties: ProductPropertyDto[];
  filters: string[];
  size: string;
  weight: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto
  extends Omit<ProductDto, 'category' | 'tags' | 'properties' | 'filters'> {
  category: CategoryDto | null;
  tags: TagDto[];
  properties: ProductPropertyDetailDto[];
  filters: CategoryFilterDto[];
}

export function toProductDto(doc: IProductDocument): ProductDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    thumbnail: doc.thumbnail,
    images: doc.images,
    fileUrl: doc.fileUrl ?? '',
    category: doc.category?.toString() ?? '',
    tags: doc.tags?.map((t) => t.toString()) ?? [],
    isFree: doc.isFree,
    viewCount: doc.viewCount,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: p.definition?.toString() ?? '',
      value: p.value,
    })),
    filters: (doc.filters ?? []).map((f) => f.toString()),
    size: doc.size ?? '',
    weight: doc.weight ?? '',
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toProductDetailDto(doc: IProductDocument): ProductDetailDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    thumbnail: doc.thumbnail,
    images: doc.images,
    fileUrl: doc.fileUrl ?? '',
    category: doc.category ? toCategoryDto(doc.category as unknown as ICategoryDocument) : null,
    tags: doc.tags?.map((t) => toTagDto(t as unknown as ITagDocument)) ?? [],
    isFree: doc.isFree,
    viewCount: doc.viewCount + 1,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: toPropertyDefinitionDto(p.definition as unknown as IPropertyDefinitionDocument),
      value: p.value,
    })),
    filters: (doc.filters ?? []).map((f) =>
      toCategoryFilterDto(f as unknown as ICategoryFilterDocument),
    ),
    size: doc.size ?? '',
    weight: doc.weight ?? '',
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
