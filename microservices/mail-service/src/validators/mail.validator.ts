import { z } from 'zod';

export const sendMailSchema = z
  .object({
    to: z.string().email('Invalid recipient email'),
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    body: z.string().min(1, 'Body is required').max(100000, 'Body too long').optional(),
    templateId: z
      .string()
      .min(1, 'Template ID is required')
      .max(100, 'Template ID too long')
      .optional(),
    templateData: z
      .record(z.unknown())
      .refine((val) => val !== null && typeof val === 'object', 'templateData must be a non-null object')
      .optional(),
    attachments: z
      .array(
        z.object({
          filename: z.string().min(1).max(255),
          content: z.string().min(1),
        }),
      )
      .max(10, 'Max 10 attachments allowed')
      .optional(),
  })
  .refine(
    (data) => data.body !== undefined || data.templateId !== undefined,
    { message: 'Either body or templateId must be provided', path: ['body'] },
  )
  .refine(
    (data) => !data.templateId || (data.templateData !== undefined && data.templateData !== null),
    { message: 'templateData must be provided when templateId is set', path: ['templateData'] },
  );

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export function validateSendMail(body: unknown) {
  return sendMailSchema.safeParse(body);
}

export function validatePagination(query: unknown) {
  return paginationSchema.safeParse(query);
}
