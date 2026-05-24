import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-at-least-32-chars-long';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: string };
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid or expired token'));
  }
}
