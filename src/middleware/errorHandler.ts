import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    console.error('Error:', err);

    if (err instanceof ZodError) {
      const issues = (err as any).issues || (err as any).errors || [];
      return void res.status(400).json({
        error: 'Validation Error',
        details: issues.map((e: any) => ({
          field: e.path?.join('.') || '',
          message: e.message,
        })),
      });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return void res.status(409).json({
          error: 'Duplicate Entry',
          message: 'A record with this value already exists',
        });
      }
      if (err.code === 'P2025') {
        return void res.status(404).json({
          error: 'Not Found',
          message: 'Record not found',
        });
      }
      if (err.code === 'P2003') {
        return void res.status(400).json({
          error: 'Foreign Key Violation',
          message: 'Referenced record does not exist',
        });
      }
    }

    if (err instanceof AppError) {
      return void res.status(err.statusCode).json({
        error: err.message,
        details: err.details,
      });
    }

    if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
      return void res.status(400).json({ error: 'Invalid JSON' });
    }

    if (typeof (err as any)?.message === 'string') {
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? (err as any).message : undefined,
      });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (handlerError) {
    console.error('Error handler threw:', handlerError, 'original error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
};