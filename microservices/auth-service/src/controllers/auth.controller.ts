import { z } from 'zod';
import { Request, Response } from 'express';
import { verifyToken, validatePermission } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';
import { validateVerifyToken, validateValidatePermission } from '../validators/auth.validator';
import { logger } from '../logging/logger';

export async function verifyTokenHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateVerifyToken(req.body);

    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', errorMsg)
      );
      return;
    }

    const { token } = validation.data;
    const decoded = await verifyToken(token);

    logger.info({ message: 'Token verified', userId: decoded.userId });

    res.status(200).json(
      successResponse({
        valid: true,
        userId: decoded.userId,
        roles: decoded.roles,
        permissions: decoded.permissions,
        expiresAt: decoded.exp,
      })
    );
  } catch (error) {
    logger.error({ message: 'Token verification failed', error });
    res.status(401).json(errorResponse('INVALID_TOKEN', (error as Error).message));
  }
}

export async function validatePermissionHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateValidatePermission(req.body);

    if (!validation.success) {
      const errorMsg = validation.error.issues.map((e) => e.message).join(', ');
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', errorMsg)
      );
      return;
    }

    const { userId, resource, action } = validation.data;
    const hasPermission = await validatePermission(userId, resource, action);

    res.status(200).json(
      successResponse({
        userId,
        resource,
        action,
        hasPermission,
      })
    );
  } catch (error) {
    logger.error({ message: 'Permission validation failed', error });
    res.status(500).json(errorResponse('PERMISSION_CHECK_FAILED', (error as Error).message));
  }
}

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(
    successResponse({
      service: 'auth-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  );
}
