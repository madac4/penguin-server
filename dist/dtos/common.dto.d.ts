export interface ApiResponseDto<T = unknown> {
    success: boolean;
    message: string;
    data: T;
}
export interface ApiErrorDto {
    success: false;
    message: string;
    errors?: string[];
    stack?: string;
}
export interface PaginatedDto<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
//# sourceMappingURL=common.dto.d.ts.map