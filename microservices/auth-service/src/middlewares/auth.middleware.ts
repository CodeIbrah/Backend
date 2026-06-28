import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { logger } from '../logging/logger';
import { errorResponse } from '../utils/response';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid authorization header');
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Empty token provided');
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Token is required'));
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as {
      userId: string;
      email: string;
      role: string;
    };
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (err) {
    logger.warn(`Invalid token: ${(err as Error).message}`);
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid or expired token'));
  }
}
