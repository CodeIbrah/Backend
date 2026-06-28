import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { recordHttpRequest } from './telemetry';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string | undefined) || randomUUID();
  res.setHeader('X-Correlation-ID', correlationId);
  req.headers['x-correlation-id'] = correlationId;
  next();
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const method = req.method;
    const path = req.route?.path || req.path;
    const statusCode = res.statusCode;

    recordHttpRequest(method, path, statusCode, durationMs);
  });

  next();
}
