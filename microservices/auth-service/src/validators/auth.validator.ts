import { z } from 'zod';

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const validatePermissionSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().optional(),
});

export function validateVerifyToken(body: unknown) {
  return verifyTokenSchema.safeParse(body);
}

export function validateValidatePermission(body: unknown) {
  return validatePermissionSchema.safeParse(body);
}
