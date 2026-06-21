import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    details?: unknown | undefined;
    constructor(statusCode: number, message: string, details?: unknown | undefined);
}
export declare const errorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => undefined;
export declare const notFound: (_req: Request, res: Response) => void;
//# sourceMappingURL=errorHandler.d.ts.map