import type { Response } from 'express';
export declare function success<T>(res: Response, data: T, statusCode?: number, message?: string): Response;
export declare function error(res: Response, message: string, statusCode?: number, errors?: string[]): Response;
//# sourceMappingURL=response.util.d.ts.map