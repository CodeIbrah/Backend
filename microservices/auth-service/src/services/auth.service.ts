import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

export interface DecodedToken {
  userId: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}

export async function verifyToken(token: string): Promise<DecodedToken> {
  const span = tracer.startSpan('auth.verifyToken');

  try {
    span.setAttribute('token.length', token.length);

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    const decoded: DecodedToken = {
      userId: payload.sub || payload.userId,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      exp: payload.exp,
      iat: payload.iat,
    };

    span.setAttribute('userId', decoded.userId);
    span.addEvent('Token verified successfully');

    return decoded;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: 2, message: (error as Error).message });
    logger.error({ message: 'Token verification failed', error });
    throw error;
  } finally {
    span.end();
  }
}

export async function validatePermission(
  userId: string,
  resource: string,
  action?: string,
): Promise<boolean> {
  const span = tracer.startSpan('auth.validatePermission');

  try {
    span.setAttribute('userId', userId);
    span.setAttribute('resource', resource);
    if (action) {
      span.setAttribute('action', action);
    }

    const requiredPermission = action ? `${resource}:${action}` : resource;

    const decoded = await verifyToken(userId);

    const hasPermission =
      decoded.permissions.includes(requiredPermission) ||
      decoded.permissions.includes(`${resource}:*`) ||
      decoded.permissions.includes('*') ||
      decoded.roles.includes('admin');

    span.setAttribute('hasPermission', hasPermission);
    logger.info({
      message: 'Permission validation result',
      userId,
      resource,
      action,
      hasPermission,
    });

    return hasPermission;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: 2, message: (error as Error).message });
    logger.error({ message: 'Permission validation failed', error });
    throw error;
  } finally {
    span.end();
  }
}
