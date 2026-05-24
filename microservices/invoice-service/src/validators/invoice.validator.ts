import { z } from 'zod';
import { Currency, InvoiceStatus, InvoiceChannel } from '../types';

const currencySchema = z.nativeEnum(Currency);
const invoiceStatusSchema = z.nativeEnum(InvoiceStatus);
const channelSchema = z.nativeEnum(InvoiceChannel);

export const createInvoiceFromPaymentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  userEmail: z.string().email('Invalid email'),
  userPhone: z.string().min(1, 'userPhone is required'),
  paymentId: z.string().min(1, 'paymentId is required'),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Item description is required'),
        quantity: z.number().int().positive('Quantity must be positive'),
        unitPrice: z.number().positive('Unit price must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  currency: currencySchema.default(Currency.USD),
  channel: channelSchema.default(InvoiceChannel.EMAIL),
  notes: z.string().max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional(),
});

export const createReceiptSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  userEmail: z.string().email('Invalid email'),
  userPhone: z.string().min(1, 'userPhone is required'),
  paymentId: z.string().min(1, 'paymentId is required'),
  invoiceId: z.string().min(1, 'invoiceId is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: currencySchema.default(Currency.USD),
  description: z.string().min(1, 'description is required').max(500),
});

export const paymentWebhookSchema = z.object({
  event: z.enum(['payment.completed', 'payment.refunded']),
  paymentId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email().optional(),
  userPhone: z.string().optional(),
  amount: z.number().positive(),
  currency: currencySchema,
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const invoiceFiltersSchema = z.object({
  status: invoiceStatusSchema.optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const resendSchema = z.object({
  channel: channelSchema,
});

export function validateCreateInvoiceFromPayment(body: unknown) {
  return createInvoiceFromPaymentSchema.safeParse(body);
}

export function validateCreateReceipt(body: unknown) {
  return createReceiptSchema.safeParse(body);
}

export function validatePaymentWebhook(body: unknown) {
  return paymentWebhookSchema.safeParse(body);
}

export function validatePagination(query: unknown) {
  return paginationSchema.safeParse(query);
}

export function validateInvoiceFilters(query: unknown) {
  return invoiceFiltersSchema.safeParse(query);
}

export function validateResend(body: unknown) {
  return resendSchema.safeParse(body);
}
