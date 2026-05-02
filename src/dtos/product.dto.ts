import { ICategoryDocument } from '@/models/category.model';
import { IPropertyDefinitionDocument } from '@/models/property-definition.model';
import { ITagDocument } from '@/models/tag.model';
import type { IProductDocument } from '../models/product.model';
import type { ITranslatedField } from '../models/shared.schema';
import { toCategoryDto, type CategoryDto } from './category.dto';
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
  category: string;
  tags: string[];
  price: number;
  viewCount: number;
  likeCount: number;
  properties: ProductPropertyDto[];
  fileFormats: string[];
  weight: string;
  size: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto extends Omit<ProductDto, 'category' | 'tags' | 'properties'> {
  category: CategoryDto | null;
  tags: TagDto[];
  properties: ProductPropertyDetailDto[];
}

export function toProductDto(doc: IProductDocument): ProductDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    thumbnail: doc.thumbnail,
    images: doc.images,
    category: doc.category?.toString() ?? '',
    tags: doc.tags?.map((t) => t.toString()) ?? [],
    price: doc.price,
    viewCount: doc.viewCount,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: p.definition?.toString() ?? '',
      value: p.value,
    })),
    fileFormats: doc.fileFormats,
    weight: doc.weight ?? '',
    size: doc.size ?? '',
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
    category: doc.category ? toCategoryDto(doc.category as unknown as ICategoryDocument) : null,
    tags: doc.tags?.map((t) => toTagDto(t as unknown as ITagDocument)) ?? [],
    price: doc.price,
    viewCount: doc.viewCount + 1,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: toPropertyDefinitionDto(p.definition as unknown as IPropertyDefinitionDocument),
      value: p.value,
    })),
    fileFormats: doc.fileFormats,
    weight: doc.weight ?? '',
    size: doc.size ?? '',
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
