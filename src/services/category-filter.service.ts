import { toCategoryFilterDto, type CategoryFilterDto } from '@/dtos/category-filter.dto';
import { slugify } from '@/utils/slugify.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Category } from '../models/category.model';
import { CategoryFilter } from '../models/category-filter.model';
import type { ITranslatedField } from '../models/shared.schema';
import type {
  CreateCategoryFilterInput,
  ListCategoryFiltersInput,
  UpdateCategoryFilterInput,
} from '../validators/category-filter.validator';

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) throw new ErrorHandler('Category not found', 404);
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createCategoryFilter(
  categoryId: string,
  input: CreateCategoryFilterInput,
): Promise<CategoryFilterDto> {
  await ensureCategoryExists(categoryId);

  const slug: ITranslatedField = {
    en: slugify(input.name.en),
    ru: slugify(input.name.ru),
  };

  const existing = await CategoryFilter.findOne({
    category: categoryId,
    $or: [{ 'slug.en': slug.en }, { 'slug.ru': slug.ru }],
  });

  if (existing) {
    throw new ErrorHandler('A filter with this name already exists in this category', 409);
  }

  const filter = await CategoryFilter.create({
    category: categoryId,
    name: input.name,
    slug,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  });

  return toCategoryFilterDto(filter);
}

// ─── List by category ────────────────────────────────────────────────────────

export async function listCategoryFilters(
  categoryId: string,
  query: ListCategoryFiltersInput,
): Promise<CategoryFilterDto[]> {
  await ensureCategoryExists(categoryId);

  const where: Record<string, unknown> = { category: categoryId };
  if (query.isActive !== undefined) where.isActive = query.isActive;

  const items = await CategoryFilter.find(where).sort({ sortOrder: 1, createdAt: 1 });
  return items.map(toCategoryFilterDto);
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getCategoryFilterById(id: string): Promise<CategoryFilterDto> {
  const filter = await CategoryFilter.findById(id);
  if (!filter) throw new ErrorHandler('Category filter not found', 404);
  return toCategoryFilterDto(filter);
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateCategoryFilter(
  id: string,
  input: UpdateCategoryFilterInput,
): Promise<CategoryFilterDto> {
  const filter = await CategoryFilter.findById(id);
  if (!filter) throw new ErrorHandler('Category filter not found', 404);

  if (input.name) {
    filter.name = input.name;
    filter.slug = {
      en: slugify(input.name.en),
      ru: slugify(input.name.ru),
    };

    const existing = await CategoryFilter.findOne({
      _id: { $ne: id },
      category: filter.category,
      $or: [{ 'slug.en': filter.slug.en }, { 'slug.ru': filter.slug.ru }],
    });

    if (existing) {
      throw new ErrorHandler('A filter with this name already exists in this category', 409);
    }
  }

  if (input.sortOrder !== undefined) filter.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) filter.isActive = input.isActive;

  await filter.save();
  return toCategoryFilterDto(filter);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteCategoryFilter(id: string): Promise<void> {
  const filter = await CategoryFilter.findById(id);
  if (!filter) throw new ErrorHandler('Category filter not found', 404);

  await CategoryFilter.findByIdAndDelete(id);

  // Best-effort: strip this filter ID from any products that had it ticked
  const { Product } = await import('../models/product.model');
  await Product.updateMany({ filters: id }, { $pull: { filters: id } });
}
