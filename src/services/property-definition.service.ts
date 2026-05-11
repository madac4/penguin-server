import type { PaginatedDto } from '@/dtos/common.dto';
import {
  toPropertyDefinitionDto,
  type PropertyDefinitionDto,
} from '@/dtos/property-definition.dto';
import { DEFAULT_FUZZY_THRESHOLD, fuzzyScore } from '@/utils/fuzzy.util';
import { paginatedResult, parsePagination } from '@/utils/pagination.util';
import { slugify } from '@/utils/slugify.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Category } from '../models/category.model';
import {
  PropertyDefinition,
  type IPropertyDefinitionDocument,
} from '../models/property-definition.model';
import type { ITranslatedField } from '../models/shared.schema';
import type {
  CreatePropertyDefinitionInput,
  ListPropertyDefinitionsInput,
  UpdatePropertyDefinitionInput,
} from '../validators/property-definition.validator';

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

async function validateCategories(categoryIds: string[]): Promise<void> {
  const uniqueCategoryIds = [...new Set(categoryIds)];
  const count = await Category.countDocuments({ _id: { $in: uniqueCategoryIds } });

  if (count !== uniqueCategoryIds.length) {
    throw new ErrorHandler('One or more categories not found', 404);
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createPropertyDefinition(
  input: CreatePropertyDefinitionInput,
): Promise<PropertyDefinitionDto> {
  await validateCategories(input.categories);

  const slug: ITranslatedField = {
    en: slugify(input.name.en),
    ru: slugify(input.name.ru),
  };

  const existingSlug = await PropertyDefinition.findOne({
    $or: [{ 'slug.en': slug.en }, { 'slug.ru': slug.ru }],
  });

  if (existingSlug) {
    throw new ErrorHandler('A property with this name already exists', 409);
  }

  const propDef = await PropertyDefinition.create({
    name: input.name,
    slug,
    categories: [...new Set(input.categories)],
    values: uniqueValues(input.values),
    isActive: input.isActive,
    showInListing: input.showInListing,
  });

  return toPropertyDefinitionDto(propDef);
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getPropertyDefinitionById(id: string): Promise<PropertyDefinitionDto> {
  const propDef = await PropertyDefinition.findById(id);

  if (!propDef) throw new ErrorHandler('Property definition not found', 404);

  return toPropertyDefinitionDto(propDef);
}

// ─── List (paginated, filterable, fuzzy search) ──────────────────────────────

export async function listPropertyDefinitions(
  query: ListPropertyDefinitionsInput,
): Promise<PaginatedDto<PropertyDefinitionDto>> {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.category) {
    filter.categories = query.category;
  }

  if (query.search) {
    const needle = query.search;

    const allItems = await PropertyDefinition.find(filter).sort({ createdAt: -1 }).lean();

    const scored = allItems
      .map((item) => {
        const best = Math.max(fuzzyScore(needle, item.name.en), fuzzyScore(needle, item.name.ru));
        return { item, score: best };
      })
      .filter(({ score }) => score >= DEFAULT_FUZZY_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    const total = scored.length;
    const start = (page - 1) * limit;
    const paged = scored.slice(start, start + limit);

    return paginatedResult(
      paged.map(({ item }) =>
        toPropertyDefinitionDto(item as unknown as IPropertyDefinitionDocument),
      ),
      total,
      page,
      limit,
    );
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    PropertyDefinition.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PropertyDefinition.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((item) => toPropertyDefinitionDto(item as unknown as IPropertyDefinitionDocument)),
    total,
    page,
    limit,
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updatePropertyDefinition(
  id: string,
  input: UpdatePropertyDefinitionInput,
): Promise<PropertyDefinitionDto> {
  const propDef = await PropertyDefinition.findById(id);

  if (!propDef) throw new ErrorHandler('Property definition not found', 404);

  if (input.name) {
    propDef.name = input.name;
    propDef.slug = {
      en: slugify(input.name.en),
      ru: slugify(input.name.ru),
    };

    const existingSlug = await PropertyDefinition.findOne({
      _id: { $ne: id },
      $or: [{ 'slug.en': propDef.slug.en }, { 'slug.ru': propDef.slug.ru }],
    });

    if (existingSlug) {
      throw new ErrorHandler('A property with this name already exists', 409);
    }
  }

  if (input.isActive !== undefined) propDef.isActive = input.isActive;
  if (input.showInListing !== undefined) propDef.showInListing = input.showInListing;
  if (input.categories !== undefined) {
    await validateCategories(input.categories);
    propDef.categories = [...new Set(input.categories)] as unknown as typeof propDef.categories;
  }
  if (input.values !== undefined) propDef.values = uniqueValues(input.values);

  await propDef.save();

  return toPropertyDefinitionDto(propDef);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deletePropertyDefinition(id: string): Promise<void> {
  const propDef = await PropertyDefinition.findById(id);

  if (!propDef) throw new ErrorHandler('Property definition not found', 404);

  await PropertyDefinition.findByIdAndDelete(id);
}
