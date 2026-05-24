import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';
import { errorResponse } from '../utils/response';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  logger.error({ message: err.message, stack: err.stack, statusCode, code });

  if (statusCode >= 500) {
    logger.error(`Unhandled error: ${err.stack}`);
  }

  res.status(statusCode).json(
    errorResponse(code, process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message)
  );
}
