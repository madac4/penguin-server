import type { ICategoryDocument } from '@/models/category.model';
import type { IPropertyDefinitionDocument } from '@/models/property-definition.model';
import type { ITagDocument } from '@/models/tag.model';
import type { IProductDocument } from '../models/product.model';
import type { ITranslatedField } from '../models/shared.schema';
import { toCategoryDto, type CategoryDto } from './category.dto';
import { toPropertyDefinitionDto, type PropertyDefinitionDto } from './property-definition.dto';
import { toTagDto, type TagDto } from './tag.dto';

function isPopulatedDocument<T extends { _id: unknown; createdAt: Date; updatedAt: Date }>(
  value: unknown,
): value is T {
  if (typeof value !== 'object' || value === null) return false;

  const doc = value as Record<string, unknown>;
  return (
    '_id' in doc &&
    doc._id !== undefined &&
    doc.createdAt instanceof Date &&
    doc.updatedAt instanceof Date
  );
}

export interface ProductFiltersDto {
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
  isActive: boolean;
}

export interface ProductPropertyDetailDto {
  definition: PropertyDefinitionDto;
  value: string;
  isActive: boolean;
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
  isFree: boolean;
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
  reason: 'unauthenticated' | 'subscription_required' | 'quota_exceeded' | null;
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
    isFree: doc.isFree,
    viewCount: doc.viewCount,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? []).map((p) => ({
      definition: p.definition?.toString() ?? '',
      value: p.value,
      isActive: p.isActive ?? true,
    })),
    listingProperties: (doc.properties ?? [])
      .filter((p) => (p.isActive ?? true) && listingDefs.has(p.definition?.toString() ?? ''))
      .map((p) => ({
        definition: toPropertyDefinitionDto(
          listingDefs.get(p.definition.toString())!,
        ),
        value: p.value,
        isActive: p.isActive ?? true,
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
      url: null,
      filename: f.filename,
      format: f.format,
      size: f.size,
    })),
    category: isPopulatedDocument<ICategoryDocument>(doc.category)
      ? toCategoryDto(doc.category)
      : null,
    tags: ((doc.tags ?? []) as unknown[])
      .filter((tag): tag is ITagDocument => isPopulatedDocument<ITagDocument>(tag))
      .map(toTagDto),
    isFree: doc.isFree,
    viewCount: doc.viewCount + 1,
    likeCount: doc.likeCount,
    properties: (doc.properties ?? [])
      .filter((p) =>
        isPopulatedDocument<IPropertyDefinitionDocument>(p.definition as unknown),
      )
      .map((p) => ({
        definition: toPropertyDefinitionDto(
          p.definition as unknown as IPropertyDefinitionDocument,
        ),
        value: p.value,
        isActive: p.isActive ?? true,
      })),
    listingProperties: (doc.properties ?? [])
      .filter((p) => (p.isActive ?? true) && listingDefs.has(p.definition?.toString() ?? ''))
      .map((p) => ({
        definition: toPropertyDefinitionDto(listingDefs.get(p.definition.toString())!),
        value: p.value,
        isActive: p.isActive ?? true,
      })),
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
