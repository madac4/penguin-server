import type { NextFunction, Request, Response } from 'express';
export declare class ErrorHandler extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const CatchAsyncErrors: (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
export declare const globalErrorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => void;
export {};
//# sourceMappingURL=error.middleware.d.ts.map