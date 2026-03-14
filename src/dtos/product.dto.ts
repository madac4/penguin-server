import { ICategoryDocument } from '@/models/category.model';
import { ITagDocument } from '@/models/tag.model';
import type { IProductDocument, IProductProperties } from '../models/product.model';
import type { ITranslatedField } from '../models/shared.schema';
import { toCategoryDto, type CategoryDto } from './category.dto';
import { toTagDto, type TagDto } from './tag.dto';

export interface ProductDto {
  id: string;
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  images: string[];
  category: string;
  tags: string[];
  price: number;
  viewCount: number;
  likeCount: number;
  properties: IProductProperties;
  fileFormats: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetailDto extends Omit<ProductDto, 'category' | 'tags'> {
  category: CategoryDto | null;
  tags: TagDto[];
}

export function toProductDto(doc: IProductDocument): ProductDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    images: doc.images,
    category: doc.category?.toString() ?? '',
    tags: doc.tags?.map((t) => t.toString()) ?? [],
    price: doc.price,
    viewCount: doc.viewCount,
    likeCount: doc.likeCount,
    properties: doc.properties,
    fileFormats: doc.fileFormats,
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
    images: doc.images,
    category: doc.category ? toCategoryDto(doc.category as unknown as ICategoryDocument) : null,
    tags: doc.tags?.map((t) => toTagDto(t as unknown as ITagDocument)) ?? [],
    price: doc.price,
    viewCount: doc.viewCount + 1,
    likeCount: doc.likeCount,
    properties: doc.properties,
    fileFormats: doc.fileFormats,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
