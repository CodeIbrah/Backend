import { z } from 'zod';

const notificationTypeSchema = z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP']);

export const sendNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  type: notificationTypeSchema,
  message: z.string().min(1, 'Message is required').max(500, 'Message is too long'),
});

export const bulkNotificationSchema = z.array(
  z.object({
    userId: z.string().uuid('Invalid user ID format'),
    type: notificationTypeSchema,
    message: z.string().min(1, 'Message is required').max(500, 'Message is too long'),
  })
);

export const notificationIdSchema = z.string().uuid('Invalid notification ID format');

export const userIdSchema = z.string().uuid('Invalid user ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  userId: z.string().uuid('Invalid user ID format'),
});

export function validateSendNotification(body: unknown) {
  return sendNotificationSchema.safeParse(body);
}

export function validateBulkNotifications(body: unknown) {
  return bulkNotificationSchema.safeParse(body);
}

export function validateNotificationId(id: string) {
  return notificationIdSchema.safeParse(id);
}

export function validateUserId(id: string) {
  return userIdSchema.safeParse(id);
}

export function validatePagination(query: unknown) {
  return paginationSchema.safeParse(query);
}
