import { z } from 'zod';

export const sendSmsSchema = z.object({
  to: z.string().min(1, 'Recipient phone is required').max(20, 'Phone too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1600, 'Message exceeds 1600 characters (max for concatenated SMS)'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export function validateSendSms(body: unknown) {
  return sendSmsSchema.safeParse(body);
}

export function validatePagination(query: unknown) {
  return paginationSchema.safeParse(query);
}
