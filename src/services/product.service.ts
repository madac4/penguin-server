import type { PaginatedDto } from '@/dtos/common.dto';
import {
  toProductDetailDto,
  toProductDto,
  type ProductDetailDto,
  type ProductDto,
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
import type {
  CreateProductInput,
  ListProductsInput,
  UpdateProductInput,
} from '../validators/product.validator';
import * as uploadService from './upload.service';
import * as wishlistService from './wishlist.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    category: input.category,
    tags: input.tags,
    price: input.price,
    properties: input.properties,
    fileFormats: input.fileFormats,
    isActive: input.isActive,
  });

  return toProductDto(product);
}

// ─── Get by ID (with populated refs + view increment) ────────────────────────

export async function getProductById(id: string): Promise<ProductDetailDto> {
  const product = await Product.findById(id)
    .populate<{ category: ICategoryDocument }>('category')
    .populate<{ tags: ITagDocument[] }>('tags')
    .populate<{
      properties: { definition: IPropertyDefinitionDocument; value: string }[];
    }>('properties.definition');

  if (!product) throw new ErrorHandler('Product not found', 404);

  await Product.updateOne({ _id: id }, { $inc: { viewCount: 1 } });

  return toProductDetailDto(product as unknown as IProductDocument);
}

// ─── List (paginated, filterable, fuzzy search) ──────────────────────────────
export async function listProducts(query: ListProductsInput): Promise<PaginatedDto<ProductDto>> {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = query.tag;

  if (query.search) {
    const needle = query.search;

    const allItems = await Product.find(filter).sort({ createdAt: -1 }).lean();

    const scored = allItems
      .map((item) => {
        const best = Math.max(
          fuzzyScore(needle, item.name.en),
          fuzzyScore(needle, item.name.ru),
          fuzzyScore(needle, item.description?.en ?? ''),
          fuzzyScore(needle, item.description?.ru ?? ''),
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
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
  if (input.price !== undefined) product.price = input.price;
  if (input.fileFormats !== undefined) product.fileFormats = input.fileFormats;
  if (input.isActive !== undefined) product.isActive = input.isActive;

  if (input.properties !== undefined) {
    await validatePropertyDefinitions(input.properties);
    product.properties = input.properties as unknown as typeof product.properties;
  }

  await product.save();

  return toProductDto(product);
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
