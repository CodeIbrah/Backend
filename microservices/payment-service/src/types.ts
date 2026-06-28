export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BIZUM = 'BIZUM',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO',
  CASH = 'CASH',
  KLARNA = 'KLARNA',
  SEPA = 'SEPA',
}

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

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  metadata: Record<string, any>;
  transactionId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  paymentId: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: Currency;
  status: InvoiceStatus;
  notes: string | null;
  issuedAt: Date;
  dueDate: Date;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Receipt {
  id: string;
  paymentId: string;
  invoiceId: string | null;
  userId: string;
  receiptNumber: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string;
  issuedAt: Date;
  pdfUrl: string | null;
}

export interface AdminPaymentStats {
  totalPayments: number;
  totalRevenue: number;
  totalRefunds: number;
  pendingPayments: number;
  failedPayments: number;
  averagePaymentAmount: number;
  paymentsByStatus: Record<string, number>;
  paymentsByMethod: Record<string, number>;
  revenueByCurrency: Record<string, number>;
  dailyRevenue: Array<{ date: string; amount: number; count: number }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePaymentInput {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  description: string;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceInput {
  items: Omit<InvoiceItem, 'total'>[];
  tax?: number;
  discount?: number;
  currency?: Currency;
  notes?: string | null;
  dueDate?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  currency?: Currency;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RevenueReport {
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  refundCount: number;
  averageTransactionAmount: number;
  revenueByCurrency: Record<string, number>;
  revenueByMethod: Record<string, number>;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    refunds: number;
    net: number;
    count: number;
  }>;
}
