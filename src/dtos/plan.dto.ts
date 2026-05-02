import type { IPlanDocument } from '../models/plan.model';
import type { ITranslatedField } from '../models/shared.schema';

export interface PlanDto {
  id: string;
  name: ITranslatedField;
  slug: string;
  downloadCredits: number;
  durationDays: number;
  priceCents: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function toPlanDto(doc: IPlanDocument): PlanDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    downloadCredits: doc.downloadCredits,
    durationDays: doc.durationDays,
    priceCents: doc.priceCents,
    isPopular: doc.isPopular,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
