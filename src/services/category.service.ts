import { toCategoryDto, type CategoryDto, type CategoryTreeDto } from '@/dtos/category.dto'
import type { PaginatedDto } from '@/dtos/common.dto'
import { paginatedResult, parsePagination } from '@/utils/pagination.util'
import { slugify } from '@/utils/slugify.util'
import { ErrorHandler } from '../middlewares/error.middleware'
import {
	Category,
	type ICategoryDocument,
	type ITranslatedField,
} from '../models/category.model'
import type {
	CreateCategoryInput,
	ListCategoriesInput,
	UpdateCategoryInput,
} from '../validators/category.validator'

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
  if (input.parent) {
    const parentExists = await Category.findById(input.parent);
    if (!parentExists) throw new ErrorHandler('Parent category not found', 404);
  }

  const slug: ITranslatedField = {
    en: slugify(input.name.en),
    ru: slugify(input.name.ru),
  };

  const existingSlug = await Category.findOne({
    $or: [{ 'slug.en': slug.en }, { 'slug.ru': slug.ru }],
  });

  if (existingSlug) throw new ErrorHandler('A category with this name already exists', 409);

  const category = await Category.create({
    name: input.name,
    description: input.description,
    slug,
    parent: input.parent || null,
    image: input.image || null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  });

  return toCategoryDto(category);
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getCategoryById(id: string): Promise<CategoryDto> {
  const category = await Category.findById(id).populate('parent');

  if (!category) throw new ErrorHandler('Category not found', 404);

  return toCategoryDto(category);
}

// ─── List (paginated, filterable, bilingual search) ──────────────────────────

export async function listCategories(
  query: ListCategoriesInput,
): Promise<PaginatedDto<CategoryDto>> {
  const { page, limit, skip } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.parent !== undefined) {
    filter.parent = query.parent === 'null' ? null : query.parent;
  }

  if (query.search) {
    const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { 'name.en': regex },
      { 'name.ru': regex },
      { 'description.en': regex },
      { 'description.ru': regex },
    ];
  }

  const [items, total] = await Promise.all([
    Category.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((item) => toCategoryDto(item as unknown as ICategoryDocument)),
    total,
    page,
    limit,
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryDto> {
  const category = await Category.findById(id);

  if (!category) throw new ErrorHandler('Category not found', 404);

  if (input.parent !== undefined) {
    if (input.parent === id) throw new ErrorHandler('A category cannot be its own parent', 400);
    if (input.parent) {
      const parentExists = await Category.findById(input.parent);
      if (!parentExists) throw new ErrorHandler('Parent category not found', 404);
    }
    category.parent = input.parent as unknown as typeof category.parent;
  }

  if (input.name) {
    category.name = input.name;
    category.slug = {
      en: slugify(input.name.en),
      ru: slugify(input.name.ru),
    };

    const existingSlug = await Category.findOne({
      _id: { $ne: id },
      $or: [{ 'slug.en': category.slug.en }, { 'slug.ru': category.slug.ru }],
    });

    if (existingSlug) throw new ErrorHandler('A category with this name already exists', 409);
  }

  if (input.description) {
    if (input.description.en !== undefined) category.description.en = input.description.en;
    if (input.description.ru !== undefined) category.description.ru = input.description.ru;
  }

  if (input.image !== undefined) category.image = input.image;
  if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) category.isActive = input.isActive;

  await category.save();

  return toCategoryDto(category);
}

// ─── Update Sort Order ───────────────────────────────────────────────────────

export async function updateCategorySortOrder(id: string, sortOrder: number): Promise<CategoryDto> {
  const category = await Category.findById(id);

  if (!category) throw new ErrorHandler('Category not found', 404);

  category.sortOrder = sortOrder;

  await category.save();

  return toCategoryDto(category);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteCategory(id: string): Promise<void> {
  const category = await Category.findById(id);

  if (!category) throw new ErrorHandler('Category not found', 404);

  const childCount = await Category.countDocuments({ parent: id });
  if (childCount > 0) {
    throw new ErrorHandler(
      `Cannot delete category with ${childCount} child categories. Delete or reassign children first.`,
      400,
    );
  }

  await Category.findByIdAndDelete(id);
}

// ─── Tree ────────────────────────────────────────────────────────────────────

export async function getCategoryTree(): Promise<CategoryTreeDto[]> {
  const allCategories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  const dtos = allCategories.map((cat) =>
    toCategoryDto(cat as unknown as ICategoryDocument),
  );

  const map = new Map<string, CategoryTreeDto>();
  const roots: CategoryTreeDto[] = [];

  for (const dto of dtos) {
    map.set(dto.id, { ...dto, children: [] });
  }

  for (const dto of dtos) {
    const node = map.get(dto.id)!;
    if (dto.parent) {
      const parentNode = map.get(dto.parent);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
