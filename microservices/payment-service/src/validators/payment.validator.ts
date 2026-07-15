import { z } from 'zod';
import { PaymentStatus, PaymentMethod, Currency, InvoiceStatus, InvoiceChannel } from '../types';

const paymentStatusSchema = z.nativeEnum(PaymentStatus);
const paymentMethodSchema = z.nativeEnum(PaymentMethod);
const currencySchema = z.nativeEnum(Currency);
const invoiceStatusSchema = z.nativeEnum(InvoiceStatus);
const channelSchema = z.nativeEnum(InvoiceChannel);

export const createPaymentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: currencySchema,
  method: paymentMethodSchema,
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  metadata: z.record(z.any()).optional(),
});

export const processPaymentSchema = z.object({
  transactionId: z.string().optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});

export const createInvoiceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'Item description is required'),
        quantity: z.number().int().positive('Quantity must be positive'),
        unitPrice: z.number().positive('Unit price must be positive'),
      }),
    )
    .min(1, 'At least one item is required'),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  currency: currencySchema.default(Currency.USD),
  notes: z.string().max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional(),
  userEmail: z.string().email().optional(),
  userPhone: z.string().optional(),
  channel: channelSchema.optional(),
});

export const payInvoiceSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
});

export const paymentIdSchema = z.string().uuid('Invalid payment ID');
export const invoiceIdSchema = z.string().uuid('Invalid invoice ID');
export const receiptIdSchema = z.string().uuid('Invalid receipt ID');
export const invoiceNumberSchema = z.string().min(1, 'Invoice number is required');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const paymentFiltersSchema = z.object({
  status: paymentStatusSchema.optional(),
  method: paymentMethodSchema.optional(),
  currency: currencySchema.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
});

export const invoiceFiltersSchema = z.object({
  status: invoiceStatusSchema.optional(),
  userId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const resendSchema = z.object({
  channel: channelSchema,
});

export const revenueReportSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});

export function validateCreatePayment(body: unknown) {
  return createPaymentSchema.safeParse(body);
}

export function validateProcessPayment(body: unknown) {
  return processPaymentSchema.safeParse(body);
}

export function validateRefundPayment(body: unknown) {
  return refundPaymentSchema.safeParse(body);
}

export function validateCreateInvoice(body: unknown) {
  return createInvoiceSchema.safeParse(body);
}

export function validatePayInvoice(body: unknown) {
  return payInvoiceSchema.safeParse(body);
}

export function validatePaymentId(id: string) {
  return paymentIdSchema.safeParse(id);
}

export function validateInvoiceId(id: string) {
  return invoiceIdSchema.safeParse(id);
}

export function validateReceiptId(id: string) {
  return receiptIdSchema.safeParse(id);
}

export function validateInvoiceNumber(number: string) {
  return invoiceNumberSchema.safeParse(number);
}

export function validatePagination(query: unknown) {
  return paginationSchema.safeParse(query);
}

export function validatePaymentFilters(query: unknown) {
  return paymentFiltersSchema.safeParse(query);
}

export function validateInvoiceFilters(query: unknown) {
  return invoiceFiltersSchema.safeParse(query);
}

export function validateResend(body: unknown) {
  return resendSchema.safeParse(body);
}

export function validateRevenueReport(query: unknown) {
  return revenueReportSchema.safeParse(query);
}
