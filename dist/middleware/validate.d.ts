import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
export declare const validate: (schema: ZodType, source?: "body" | "query" | "params") => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map