import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';
import { logger } from '../logging/logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role?: string };
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    logger.warn({ message: 'Invalid token', error: err });
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid or expired token'));
  }
}
