import { ICategoryDocument } from '@/models/category.model';
import { IPropertyDefinitionDocument } from '@/models/property-definition.model';
import { ITagDocument } from '@/models/tag.model';
import type { IProductDocument } from '../models/product.model';
import type { ITranslatedField } from '../models/shared.schema';
import { toCategoryDto, type CategoryDto } from './category.dto';
import { toPropertyDefinitionDto, type PropertyDefinitionDto } from './property-definition.dto';
import { toTagDto, type TagDto } from './tag.dto';

export interface ProductFiltersDto {
  priceRange: { min: number; max: number };
  formats: string[];
  tags: TagDto[];
  properties: {
    definition: PropertyDefinitionDto;
    values: string[];
  }[];
}

export interface ProductPropertyDto {
  definition: string;
  value: string;
}

export interface ProductPropertyDetailDto {
  definition: PropertyDefinitionDto;
  value: string;
}

export interface ProductFileDto {
  url: string | null; // null when the caller has no access to download
  filename: string;
  format: string;
  size: number;
}

export interface ProductDto {
  id: string;
  name: ITranslatedField;
  description: ITranslatedField;
  slug: ITranslatedField;
  thumbnail: string;
  images: string[];
  files: ProductFileDto[];
  category: string;
  tags: string[];
  price: number;
  viewCount: number;
  likeCount: number;
  properties: ProductPropertyDto[];
  listingProperties: ProductPropertyDetailDto[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileAccessDto {
  locked: boolean;
  // Reason only present when locked — helps the UI choose the right CTA
  reason: 'unauthenticated' | 'purchase_required' | 'quota_exceeded' | null;
}

export interface ProductDetailDto extends Omit<ProductDto, 'category' | 'tags' | 'properties'> {
  category: CategoryDto | null;
  tags: TagDto[];
  properties: ProductPropertyDetailDto[];
  fileAccess: FileAccessDto;
}

export function toProductDto(
  doc: IProductDocument,
  listingDefs: Map<string, IPropertyDefinitionDocument> = new Map(),
): ProductDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    thumbnail: doc.thumbnail,
    images: doc.images,
    files: (doc.files ?? []).map((f) => ({
      url: null,
      filename: f.filename,
      format: f.format,
      size: f.size,
    })),
    category: doc.category?.toString() ?? '',
    tags: doc.tags?.map((t) => t.toString()) ?? [],
    price: doc.price,
    viewCount: doc.viewCount,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: p.definition?.toString() ?? '',
      value: p.value,
    })),
    listingProperties: (doc.properties ?? [])
      .filter((p) => listingDefs.has(p.definition?.toString() ?? ''))
      .map((p) => ({
        definition: toPropertyDefinitionDto(
          listingDefs.get(p.definition.toString())!,
        ),
        value: p.value,
      })),
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toProductDetailDto(
  doc: IProductDocument,
  fileAccess: FileAccessDto,
  listingDefs: Map<string, IPropertyDefinitionDocument> = new Map(),
): ProductDetailDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    slug: doc.slug,
    thumbnail: doc.thumbnail,
    images: doc.images,
    fileAccess,
    files: (doc.files ?? []).map((f) => ({
      url: fileAccess.locked ? null : f.url,
      filename: f.filename,
      format: f.format,
      size: f.size,
    })),
    category: doc.category ? toCategoryDto(doc.category as unknown as ICategoryDocument) : null,
    tags: doc.tags?.map((t) => toTagDto(t as unknown as ITagDocument)) ?? [],
    price: doc.price,
    viewCount: doc.viewCount + 1,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: toPropertyDefinitionDto(p.definition as unknown as IPropertyDefinitionDocument),
      value: p.value,
    })),
    listingProperties: (doc.properties ?? [])
      .filter((p) => listingDefs.has(p.definition?.toString() ?? ''))
      .map((p) => ({
        definition: toPropertyDefinitionDto(listingDefs.get(p.definition.toString())!),
        value: p.value,
      })),
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
