import type { PaginatedDto } from '@/dtos/common.dto';
import { toPlanDto, type PlanDto } from '@/dtos/plan.dto';
import { paginatedResult, parsePagination } from '@/utils/pagination.util';
import { slugify } from '@/utils/slugify.util';
import { ErrorHandler } from '../middlewares/error.middleware';
import { Plan, type IPlanDocument } from '../models/plan.model';
import type {
  CreatePlanInput,
  ListPlansInput,
  UpdatePlanInput,
} from '../validators/plan.validator';

function buildSlug(name: { en: string; ru: string }): string {
  return slugify(name.en) || slugify(name.ru);
}

export async function createPlan(input: CreatePlanInput): Promise<PlanDto> {
  const slug = buildSlug(input.name);
  if (!slug) throw new ErrorHandler('Plan name is empty', 400);

  const existing = await Plan.findOne({ slug });
  if (existing) throw new ErrorHandler('A plan with this name already exists', 409);

  const plan = await Plan.create({ ...input, slug });
  return toPlanDto(plan);
}

export async function getPlanById(id: string): Promise<PlanDto> {
  const plan = await Plan.findById(id);
  if (!plan) throw new ErrorHandler('Plan not found', 404);
  return toPlanDto(plan);
}

export async function listPlans(query: ListPlansInput): Promise<PaginatedDto<PlanDto>> {
  const { page, limit } = parsePagination(query);

  const filter: Record<string, unknown> = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Plan.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Plan.countDocuments(filter),
  ]);

  return paginatedResult(
    items.map((item) => toPlanDto(item as unknown as IPlanDocument)),
    total,
    page,
    limit,
  );
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<PlanDto> {
  const plan = await Plan.findById(id);
  if (!plan) throw new ErrorHandler('Plan not found', 404);

  if (input.name) {
    plan.name = input.name;
    const slug = buildSlug(input.name);
    if (!slug) throw new ErrorHandler('Plan name is empty', 400);
    const existing = await Plan.findOne({ _id: { $ne: id }, slug });
    if (existing) throw new ErrorHandler('A plan with this name already exists', 409);
    plan.slug = slug;
  }

  if (input.downloadCredits !== undefined) plan.downloadCredits = input.downloadCredits;
  if (input.durationDays !== undefined) plan.durationDays = input.durationDays;
  if (input.priceCents !== undefined) plan.priceCents = input.priceCents;
  if (input.isPopular !== undefined) plan.isPopular = input.isPopular;
  if (input.isActive !== undefined) plan.isActive = input.isActive;
  if (input.sortOrder !== undefined) plan.sortOrder = input.sortOrder;

  await plan.save();
  return toPlanDto(plan);
}

export async function deletePlan(id: string): Promise<void> {
  const plan = await Plan.findById(id);
  if (!plan) throw new ErrorHandler('Plan not found', 404);
  await Plan.findByIdAndDelete(id);
}
