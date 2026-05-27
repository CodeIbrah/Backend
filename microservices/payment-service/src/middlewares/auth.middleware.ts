import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { logger } from '../logging/logger';
import { errorResponse } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  token?: string;
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
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    (req as AuthenticatedRequest).token = token;
    next();
  } catch (err) {
    logger.warn(`Invalid token: ${(err as Error).message}`);
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid or expired token'));
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required'));
    return;
  }

  if (authReq.user.role !== 'admin' && authReq.user.role !== 'ADMIN') {
    logger.warn('Non-admin user attempted admin access', { userId: authReq.user.id });
    res.status(403).json(errorResponse('FORBIDDEN', 'Admin access required'));
    return;
  }

  next();
}
