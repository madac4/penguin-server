import type { PaginatedDto } from '@/dtos/common.dto';
import { toTagDto, type TagDto } from '@/dtos/tag.dto';
import { DEFAULT_FUZZY_THRESHOLD, fuzzyScore } from '@/utils/fuzzy.util';
import { paginatedResult, parsePagination } from '@/utils/pagination.util';
import { slugify } from '@/utils/slugify.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import type { ITranslatedField } from '../models/shared.schema';
import { Tag, type ITagDocument } from '../models/tag.model';
import type { CreateTagInput, ListTagsInput, UpdateTagInput } from '../validators/tag.validator';

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createTag(input: CreateTagInput): Promise<TagDto> {
  const slug: ITranslatedField = {
    en: slugify(input.name.en),
    ru: slugify(input.name.ru),
  };

  const existingSlug = await Tag.findOne({
    $or: [{ 'slug.en': slug.en }, { 'slug.ru': slug.ru }],
  });

  if (existingSlug) throw new ErrorHandler('A tag with this name already exists', 409);

  const tag = await Tag.create({
    name: input.name,
    slug,
    isActive: input.isActive,
  });

  return toTagDto(tag);
}

// ─── Get by ID ───────────────────────────────────────────────────────────────

export async function getTagById(id: string): Promise<TagDto> {
  const tag = await Tag.findById(id);

  if (!tag) throw new ErrorHandler('Tag not found', 404);

  return toTagDto(tag);
}

// ─── List (paginated, filterable, fuzzy search) ──────────────────────────────

export async function listTags(query: ListTagsInput): Promise<PaginatedDto<TagDto>> {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, unknown> = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    const needle = query.search;

    const allItems = await Tag.find(filter).sort({ createdAt: -1 }).lean();

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
      paged.map(({ item }) => toTagDto(item as unknown as ITagDocument)),
      total,
      page,
      limit,
    );
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Tag.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Tag.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((item) => toTagDto(item as unknown as ITagDocument)),
    total,
    page,
    limit,
  );
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateTag(id: string, input: UpdateTagInput): Promise<TagDto> {
  const tag = await Tag.findById(id);

  if (!tag) throw new ErrorHandler('Tag not found', 404);

  if (input.name) {
    tag.name = input.name;
    tag.slug = {
      en: slugify(input.name.en),
      ru: slugify(input.name.ru),
    };

    const existingSlug = await Tag.findOne({
      _id: { $ne: id },
      $or: [{ 'slug.en': tag.slug.en }, { 'slug.ru': tag.slug.ru }],
    });

    if (existingSlug) throw new ErrorHandler('A tag with this name already exists', 409);
  }

  if (input.isActive !== undefined) tag.isActive = input.isActive;

  await tag.save();

  return toTagDto(tag);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteTag(id: string): Promise<void> {
  const tag = await Tag.findById(id);

  if (!tag) throw new ErrorHandler('Tag not found', 404);

  await Tag.findByIdAndDelete(id);
}
