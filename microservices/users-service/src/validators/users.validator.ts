import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  role: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const userIdSchema = z.string().uuid('Invalid user ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export function validateCreateUser(body: unknown) {
  return createUserSchema.safeParse(body);
}

export function validateUpdateUser(body: unknown) {
  return updateUserSchema.safeParse(body);
}

export function validateUserId(id: string) {
  return userIdSchema.safeParse(id);
}

export function validatePagination(query: unknown) {
  return paginationSchema.safeParse(query);
}
