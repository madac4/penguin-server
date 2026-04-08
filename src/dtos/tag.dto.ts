import type { ITranslatedField } from '../models/shared.schema'
import type { ITagDocument } from '../models/tag.model'

export interface TagDto {
  id: string;
  name: ITranslatedField;
  slug: ITranslatedField;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function toTagDto(doc: ITagDocument): TagDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
