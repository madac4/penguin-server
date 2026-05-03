import { Types } from 'mongoose';
import type { PaginatedDto } from '@/dtos/common.dto';
import {
  toProductDetailDto,
  toProductDto,
  type FileAccessDto,
  type ProductDetailDto,
  type ProductDto,
  type ProductFiltersDto,
} from '@/dtos/product.dto';
import { DEFAULT_FUZZY_THRESHOLD, fuzzyScore } from '@/utils/fuzzy.util';
import { paginatedResult, parsePagination } from '@/utils/pagination.util';
import { slugify } from '@/utils/slugify.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import type { ICategoryDocument } from '../models/category.model';
import { Category } from '../models/category.model';
import { Product, type IProductDocument } from '../models/product.model';
import type { IPropertyDefinitionDocument } from '../models/property-definition.model';
import { PropertyDefinition } from '../models/property-definition.model';
import type { ITranslatedField } from '../models/shared.schema';
import type { ITagDocument } from '../models/tag.model';
import { Tag } from '../models/tag.model';
import { toPropertyDefinitionDto } from '../dtos/property-definition.dto';
import { toTagDto } from '../dtos/tag.dto';
import type {
  CreateProductInput,
  ListProductsInput,
  UpdateProductInput,
} from '../validators/product.validator';
import * as orderService from './order.service';
import * as uploadService from './upload.service';
import * as wishlistService from './wishlist.service';
import { Role } from '../utils/enums';

async function validatePropertyDefinitions(
  properties: { definition: string; value: string }[],
): Promise<void> {
  if (properties.length === 0) return;

  const definitionIds = [...new Set(properties.map((p) => p.definition))];
  const count = await PropertyDefinition.countDocuments({ _id: { $in: definitionIds } });

  if (count !== definitionIds.length) {
    throw new ErrorHandler('One or more property definitions not found', 404);
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput): Promise<ProductDto> {
  const categoryExists = await Category.findById(input.category);

  if (!categoryExists) throw new ErrorHandler('Category not found', 404);

  if (input.tags.length > 0) {
    const tagCount = await Tag.countDocuments({ _id: { $in: input.tags } });
    if (tagCount !== input.tags.length) throw new ErrorHandler('One or more tags not found', 404);
  }

  await validatePropertyDefinitions(input.properties);

  const slug: ITranslatedField = {
    en: slugify(input.name.en),
    ru: slugify(input.name.ru),
  };

  const existingSlug = await Product.findOne({
    $or: [{ 'slug.en': slug.en }, { 'slug.ru': slug.ru }],
  });

  if (existingSlug) throw new ErrorHandler('A product with this name already exists', 409);

  const product = await Product.create({
    name: input.name,
    description: input.description,
    slug,
    thumbnail: input.thumbnail,
    images: input.images,
    files: input.files,
    category: input.category,
    tags: input.tags,
    price: input.price,
    properties: input.properties,
    isActive: input.isActive,
  });

  return toProductDto(product);
}

// ─── Get by ID (with populated refs + view increment) ────────────────────────

export async function getProductById(
  id: string,
  requestingUser?: { id: string; role: string },
): Promise<ProductDetailDto> {
  const product = await Product.findById(id)
    .populate<{ category: ICategoryDocument }>('category')
    .populate<{ tags: ITagDocument[] }>('tags')
    .populate<{
      properties: { definition: IPropertyDefinitionDocument; value: string }[];
    }>('properties.definition');

  if (!product) throw new ErrorHandler('Product not found', 404);

  await Product.updateOne({ _id: id }, { $inc: { viewCount: 1 } });

  const fileAccess = await resolveFileAccess(
    { id: product._id.toString(), price: product.price, fileCount: product.files.length },
    requestingUser,
  );

  return toProductDetailDto(product as unknown as IProductDocument, fileAccess);
}

async function resolveFileAccess(
  product: { id: string; price: number; fileCount: number },
  user?: { id: string; role: string },
): Promise<FileAccessDto> {
  const open: FileAccessDto = { locked: false, reason: null };

  if (product.fileCount === 0) return open;
  if (!user) return { locked: true, reason: 'unauthenticated' };
  if (user.role === Role.Administrator) return open;
  if (product.price === 0) return open;

  // Paid product — check direct purchase
  if (await orderService.hasPurchased(user.id, product.id)) return open;

  return { locked: true, reason: 'purchase_required' };
}

// ─── Sort map ────────────────────────────────────────────────────────────────

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popular: { viewCount: -1 },
};

// ─── List (paginated, filterable, fuzzy search) ──────────────────────────────
export async function listProducts(query: ListProductsInput): Promise<PaginatedDto<ProductDto>> {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.category) filter.category = query.category;

  // Tag filter — OR across selected tags (any matching tag qualifies the product)
  if (query.tags && query.tags.length > 0) filter.tags = { $in: query.tags };

  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (query.priceMin !== undefined) priceFilter.$gte = query.priceMin;
    if (query.priceMax !== undefined) priceFilter.$lte = query.priceMax;
    filter.price = priceFilter;
  }

  if (query.formats && query.formats.length > 0) {
    filter['files.format'] = { $in: query.formats };
  }

  // Property filter — AND across selected definition/value pairs
  if (query.properties && query.properties.length > 0) {
    filter.properties = {
      $all: query.properties.map((p) => ({
        $elemMatch: { definition: new Types.ObjectId(p.definition), value: p.value },
      })),
    };
  }

  const sort = SORT_MAP[query.sortBy ?? 'newest'];

  if (query.search) {
    const needle = query.search;

    const allItems = await Product.find(filter).sort(sort).lean();

    const scored = allItems
      .map((item) => {
        const propertyBest =
          item.properties?.length > 0
            ? Math.max(...item.properties.map((p) => fuzzyScore(needle, p.value)))
            : 0;

        const best = Math.max(
          fuzzyScore(needle, item.name.en),
          fuzzyScore(needle, item.name.ru),
          fuzzyScore(needle, item.description?.en ?? ''),
          fuzzyScore(needle, item.description?.ru ?? ''),
          propertyBest,
        );
        return { item, score: best };
      })
      .filter(({ score }) => score >= DEFAULT_FUZZY_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    const total = scored.length;
    const start = (page - 1) * limit;
    const paged = scored.slice(start, start + limit);

    return paginatedResult(
      paged.map(({ item }) => toProductDto(item as unknown as IProductDocument)),
      total,
      page,
      limit,
    );
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((item) => toProductDto(item as unknown as IProductDocument)),
    total,
    page,
    limit,
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────
export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDto> {
  const product = await Product.findById(id);

  if (!product) throw new ErrorHandler('Product not found', 404);

  if (input.category) {
    const categoryExists = await Category.findById(input.category);
    if (!categoryExists) throw new ErrorHandler('Category not found', 404);
    product.category = input.category as unknown as typeof product.category;
  }

  if (input.tags) {
    if (input.tags.length > 0) {
      const tagCount = await Tag.countDocuments({ _id: { $in: input.tags } });
      if (tagCount !== input.tags.length) throw new ErrorHandler('One or more tags not found', 404);
    }
    product.tags = input.tags as unknown as typeof product.tags;
  }

  if (input.name) {
    product.name = input.name;
    product.slug = {
      en: slugify(input.name.en),
      ru: slugify(input.name.ru),
    };

    const existingSlug = await Product.findOne({
      _id: { $ne: id },
      $or: [{ 'slug.en': product.slug.en }, { 'slug.ru': product.slug.ru }],
    });

    if (existingSlug) throw new ErrorHandler('A product with this name already exists', 409);
  }

  if (input.description) {
    if (input.description.en !== undefined) product.description.en = input.description.en;
    if (input.description.ru !== undefined) product.description.ru = input.description.ru;
  }

  if (input.thumbnail !== undefined) product.thumbnail = input.thumbnail;
  if (input.images !== undefined) product.images = input.images;
  if (input.files !== undefined) product.files = input.files as unknown as typeof product.files;
  if (input.price !== undefined) product.price = input.price;
  if (input.isActive !== undefined) product.isActive = input.isActive;

  if (input.properties !== undefined) {
    await validatePropertyDefinitions(input.properties);
    product.properties = input.properties as unknown as typeof product.properties;
  }

  await product.save();

  return toProductDto(product);
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export async function getProductFilters(categoryId?: string): Promise<ProductFiltersDto> {
  const match: Record<string, unknown> = { isActive: true };
  if (categoryId) match.category = new Types.ObjectId(categoryId);

  type FacetResult = {
    priceRange: { min: number; max: number }[];
    formats: { _id: string }[];
    tagIds: { _id: Types.ObjectId }[];
    propertyValues: { _id: Types.ObjectId; values: string[] }[];
  };

  const [facet] = await Product.aggregate<FacetResult>([
    { $match: match },
    {
      $facet: {
        priceRange: [
          { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
          { $project: { _id: 0, min: 1, max: 1 } },
        ],
        formats: [
          { $unwind: { path: '$files', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$files.format' } },
          { $match: { _id: { $ne: null } } },
          { $sort: { _id: 1 } },
        ],
        tagIds: [
          { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$tags' } },
        ],
        propertyValues: [
          { $unwind: { path: '$properties', preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: '$properties.definition',
              values: { $addToSet: '$properties.value' },
            },
          },
        ],
      },
    },
  ]);

  const priceRange = facet.priceRange[0] ?? { min: 0, max: 0 };
  const formats = facet.formats.map((f) => f._id).filter(Boolean);

  const tagIds = facet.tagIds.map((t) => t._id);
  const tags = tagIds.length
    ? await Tag.find({ _id: { $in: tagIds } }).lean()
    : [];

  const defIds = facet.propertyValues.map((p) => p._id);
  const definitions = defIds.length
    ? await PropertyDefinition.find({ _id: { $in: defIds }, isActive: true }).lean()
    : [];

  const defMap = new Map(definitions.map((d) => [d._id.toString(), d]));

  const properties = facet.propertyValues
    .map((p) => {
      const def = defMap.get(p._id.toString());
      if (!def) return null;
      return {
        definition: toPropertyDefinitionDto(def as unknown as IPropertyDefinitionDocument),
        values: [...p.values].sort(),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return {
    priceRange,
    formats,
    tags: tags.map((t) => toTagDto(t as unknown as ITagDocument)),
    properties,
  };
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteProduct(id: string): Promise<void> {
  const product = await Product.findById(id);

  if (!product) throw new ErrorHandler('Product not found', 404);

  if (product.images.length > 0) {
    await uploadService.deleteFiles(product.images).catch(() => {});
  }

  if (product.thumbnail) {
    await uploadService.deleteFile(product.thumbnail).catch(() => {});
  }

  await wishlistService.removeAllForProduct(id);
  await Product.findByIdAndDelete(id);
}
