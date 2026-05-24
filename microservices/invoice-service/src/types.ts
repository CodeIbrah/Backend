export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  MXN = 'MXN',
  COP = 'COP',
  BRL = 'BRL',
}

export enum InvoiceChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  BOTH = 'BOTH',
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  paymentId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  channel: InvoiceChannel;
  notes: string | null;
  issuedAt: Date;
  dueDate: Date;
  paidAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  currency: Currency;
  description: string;
  issuedAt: Date;
  sentAt: Date | null;
}

export interface CreateInvoiceInput {
  userId: string;
  userEmail: string;
  userPhone: string;
  paymentId: string;
  items: Omit<InvoiceItem, 'total'>[];
  tax?: number;
  discount?: number;
  currency?: Currency;
  channel?: InvoiceChannel;
  notes?: string | null;
  dueDate?: string;
}

export interface PaymentData {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  description: string;
  status: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MailPayload {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface SmsPayload {
  to: string;
  message: string;
}
