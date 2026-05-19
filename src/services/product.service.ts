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
import { Types } from 'mongoose';
import { toPropertyDefinitionDto } from '../dtos/property-definition.dto';
import { toTagDto } from '../dtos/tag.dto';
import { ErrorHandler } from '../middlewares/error.middleware';
import type { ICategoryDocument } from '../models/category.model';
import { Category } from '../models/category.model';
import { Product, type IProductDocument } from '../models/product.model';
import type { IPropertyDefinitionDocument } from '../models/property-definition.model';
import { PropertyDefinition } from '../models/property-definition.model';
import type { ITranslatedField } from '../models/shared.schema';
import type { ITagDocument } from '../models/tag.model';
import { Tag } from '../models/tag.model';
import { Role, UploadFolder } from '../utils/enums';
import type {
  AddProductFilesInput,
  CreateProductInput,
  ListProductsInput,
  UpdateProductInput,
} from '../validators/product.validator';
import * as collectionService from './collection.service';
import * as downloadService from './download.service';
import * as subscriptionService from './subscription.service';
import * as uploadService from './upload.service';

type ProductPropertyInput = CreateProductInput['properties'][number];
type ProductFileInput = CreateProductInput['files'][number];

type ProductPropertyLike = {
  definition: unknown;
  value?: string;
  values?: string[];
  isActive?: boolean;
};

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function productPropertyValues(property: ProductPropertyLike): string[] {
  return uniqueValues(
    property.values?.length ? property.values : property.value ? [property.value] : [],
  );
}

function normalizeProductProperties(properties: ProductPropertyInput[]): ProductPropertyInput[] {
  return properties.map((property) => {
    const values = productPropertyValues(property);

    return {
      ...property,
      value: values[0] ?? '',
      values,
    };
  });
}

async function validatePropertyDefinitions(
  properties: ProductPropertyInput[],
  categoryId: string,
): Promise<void> {
  if (properties.length === 0) return;

  const definitionIds = [...new Set(properties.map((p) => p.definition))];

  if (definitionIds.length !== properties.length) {
    throw new ErrorHandler('Product properties must use each definition only once', 400);
  }

  const definitions = await PropertyDefinition.find({
    _id: { $in: definitionIds },
    isActive: true,
  })
    .select('_id categories values')
    .lean();

  if (definitions.length !== definitionIds.length) {
    throw new ErrorHandler('One or more property definitions not found', 404);
  }

  const invalidDefinition = definitions.find(
    (definition) => !definition.categories?.some((category) => category.toString() === categoryId),
  );

  if (invalidDefinition) {
    throw new ErrorHandler(
      'One or more property definitions are not assigned to this category',
      400,
    );
  }

  const definitionsById = new Map(
    definitions.map((definition) => [definition._id.toString(), definition]),
  );
  const invalidValue = properties.some((property) => {
    if (property.isActive === false) return false;

    const definition = definitionsById.get(property.definition);
    const allowedValues = new Set((definition?.values ?? []).map((value) => value.trim()));
    if (allowedValues.size === 0) return false;

    return productPropertyValues(property).some((value) => !allowedValues.has(value));
  });

  if (invalidValue) {
    throw new ErrorHandler('One or more product property values are not allowed', 400);
  }
}

function normalizeProductFiles(files: ProductFileInput[]): ProductFileInput[] {
  const normalizedFiles = files.map((file) => {
    const key = uploadService.extractKeyFromUrl(file.url);

    if (!key.startsWith(`${UploadFolder.Models}/`)) {
      throw new ErrorHandler('Product files must be uploaded to the models folder', 400);
    }

    return {
      ...file,
      url: key,
      label: file.label ?? '',
    };
  });

  const uniqueUrls = new Set(normalizedFiles.map((file) => file.url));
  if (uniqueUrls.size !== normalizedFiles.length) {
    throw new ErrorHandler('Product files must not contain duplicate URLs', 400);
  }

  return normalizedFiles;
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput): Promise<ProductDto> {
  const categoryExists = await Category.findById(input.category);

  if (!categoryExists) throw new ErrorHandler('Category not found', 404);

  if (input.tags.length > 0) {
    const tagCount = await Tag.countDocuments({ _id: { $in: input.tags } });
    if (tagCount !== input.tags.length) throw new ErrorHandler('One or more tags not found', 404);
  }

  const properties = normalizeProductProperties(input.properties);
  await validatePropertyDefinitions(properties, input.category);

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
    files: normalizeProductFiles(input.files),
    category: input.category,
    tags: input.tags,
    isFree: input.isFree,
    properties,
    isActive: input.isActive,
  });

  return toProductDto(product);
}

// ─── Add Files ───────────────────────────────────────────────────────────────

export async function addProductFiles(
  id: string,
  input: AddProductFilesInput,
): Promise<ProductDto> {
  const product = await Product.findById(id);

  if (!product) throw new ErrorHandler('Product not found', 404);

  const newFiles = normalizeProductFiles(input.files);
  const existingUrls = new Set(product.files.map((file) => file.url));

  const duplicateFile = newFiles.find((file) => existingUrls.has(file.url));
  if (duplicateFile) {
    throw new ErrorHandler('Product already contains one or more of these files', 409);
  }

  product.files.push(...(newFiles as unknown as typeof product.files));

  await product.save();

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
      properties: {
        definition: IPropertyDefinitionDocument;
        value: string;
        values: string[];
        isActive: boolean;
      }[];
    }>('properties.definition');

  if (!product) throw new ErrorHandler('Product not found', 404);

  await Product.updateOne({ _id: id }, { $inc: { viewCount: 1 } });

  const fileAccess = await resolveFileAccess(
    { id: product._id.toString(), isFree: product.isFree, fileCount: product.files.length },
    requestingUser,
  );

  return toProductDetailDto(product as unknown as IProductDocument, fileAccess);
}

async function resolveFileAccess(
  product: { id: string; isFree: boolean; fileCount: number },
  user?: { id: string; role: string },
): Promise<FileAccessDto> {
  const open: FileAccessDto = { locked: false, reason: null };

  if (product.fileCount === 0) return open;
  if (!user) return { locked: true, reason: 'unauthenticated' };
  if (user.role === Role.Administrator || user.role === Role.Moderator) return open;
  if (product.isFree) return open;

  if (await subscriptionService.hasDownloadQuota(user.id)) return open;

  const hasSub = await subscriptionService.getUserSubscription(user.id);
  if (hasSub) return { locked: true, reason: 'quota_exceeded' };

  return { locked: true, reason: 'subscription_required' };
}

// ─── Sort map ────────────────────────────────────────────────────────────────

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  popular: { viewCount: -1 },
};

// ─── List (paginated, filterable, fuzzy search) ──────────────────────────────
export async function listProducts(query: ListProductsInput): Promise<PaginatedDto<ProductDto>> {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.isFree !== undefined) filter.isFree = query.isFree;
  if (query.category) filter.category = query.category;

  // Tag filter — OR across selected tags (any matching tag qualifies the product)
  if (query.tags && query.tags.length > 0) filter.tags = { $in: query.tags };

  if (query.formats && query.formats.length > 0) {
    filter['files.format'] = { $in: query.formats };
  }

  // Property filter: AND across definitions, OR across selected values for the same definition.
  if (query.properties && query.properties.length > 0) {
    const valuesByDefinition = query.properties.reduce<Map<string, string[]>>((map, property) => {
      const values = map.get(property.definition) ?? [];
      values.push(property.value);
      map.set(property.definition, values);
      return map;
    }, new Map());

    filter.properties = {
      $all: [...valuesByDefinition.entries()].map(([definition, values]) => ({
        $elemMatch: {
          definition: new Types.ObjectId(definition),
          $or: [{ values: { $in: values } }, { value: { $in: values } }],
          isActive: { $ne: false },
        },
      })),
    };
  }

  const sort = SORT_MAP[query.sortBy ?? 'newest'];

  const listingDefs = await buildListingDefsMap();

  if (query.search) {
    const needle = query.search;

    const allItems = await Product.find(filter).sort(sort).lean();

    const scored = allItems
      .map((item) => {
        const propertyBest =
          item.properties?.length > 0
            ? Math.max(
                ...item.properties
                  .filter((p) => p.isActive !== false)
                  .flatMap((p) =>
                    productPropertyValues(p).map((value) => fuzzyScore(needle, value)),
                  ),
                0,
              )
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
      paged.map(({ item }) => toProductDto(item as unknown as IProductDocument, listingDefs)),
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
    items.map((item) => toProductDto(item as unknown as IProductDocument, listingDefs)),
    total,
    page,
    limit,
  );
}

async function buildListingDefsMap(): Promise<Map<string, IPropertyDefinitionDocument>> {
  const defs = await PropertyDefinition.find({ showInListing: true, isActive: true }).lean();
  return new Map(defs.map((d) => [d._id.toString(), d as unknown as IPropertyDefinitionDocument]));
}

// ─── Update ──────────────────────────────────────────────────────────────────
export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDto> {
  const product = await Product.findById(id);

  if (!product) throw new ErrorHandler('Product not found', 404);

  const categoryId = input.category ?? product.category.toString();

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
  if (input.files !== undefined) {
    product.files = normalizeProductFiles(input.files) as unknown as typeof product.files;
  }
  if (input.isFree !== undefined) product.isFree = input.isFree;
  if (input.isActive !== undefined) product.isActive = input.isActive;

  if (input.properties !== undefined) {
    const properties = normalizeProductProperties(input.properties);
    await validatePropertyDefinitions(properties, categoryId);
    product.properties = properties as unknown as typeof product.properties;
  } else if (input.category !== undefined) {
    await validatePropertyDefinitions(
      product.properties.map((property) => ({
        definition: property.definition.toString(),
        value: productPropertyValues(property)[0] ?? '',
        values: productPropertyValues(property),
        isActive: property.isActive,
      })),
      categoryId,
    );
  }

  await product.save();

  return toProductDto(product);
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export async function getProductFilters(categoryId?: string): Promise<ProductFiltersDto> {
  const match: Record<string, unknown> = { isActive: true };
  if (categoryId) match.category = new Types.ObjectId(categoryId);

  type FacetResult = {
    formats: { _id: string }[];
    tagIds: { _id: Types.ObjectId }[];
  };

  const [facet] = await Product.aggregate<FacetResult>([
    { $match: match },
    {
      $facet: {
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
      },
    },
  ]);

  const formats = facet.formats.map((f) => f._id).filter(Boolean);

  const tagIds = facet.tagIds.map((t) => t._id);
  const tags = tagIds.length ? await Tag.find({ _id: { $in: tagIds } }).lean() : [];

  const propertyFilter: Record<string, unknown> = { isActive: true };
  if (categoryId) propertyFilter.categories = categoryId;

  const definitions = await PropertyDefinition.find(propertyFilter).sort({ createdAt: -1 }).lean();

  const properties = definitions
    .map((def) => {
      const values = uniqueValues(def.values ?? []).sort();

      return {
        definition: toPropertyDefinitionDto(def as unknown as IPropertyDefinitionDocument),
        values: [...values].sort(),
      };
    })
    .filter((property) => property.values.length > 0);

  return {
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

  await collectionService.removeProductFromAllCollections(id);
  await downloadService.removeProductFromAllDownloads(id);
  await Product.findByIdAndDelete(id);
}
