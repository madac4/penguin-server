import type { PaginatedDto } from '@/dtos/common.dto'

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: { page?: number; limit?: number }): PaginationParams {
  const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function paginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedDto<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
