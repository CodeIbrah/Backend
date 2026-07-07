import { Currency, PaymentMethod } from '../types';

export interface PaymentResult {
  success: boolean;
  transactionId: string | null;
  status: string;
  amount: number;
  currency: Currency;
  errorMessage?: string;
  provider?: string;
  settlementDate?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentRequest {
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  paymentData: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  readonly supportedMethods: PaymentMethod[];

  createPayment(request: PaymentRequest): Promise<PaymentResult>;
  authorize(request: PaymentRequest): Promise<PaymentResult>;
  capture(transactionId: string, amount?: number): Promise<PaymentResult>;
  refund(transactionId: string, amount?: number, reason?: string): Promise<PaymentResult>;
  partialRefund(transactionId: string, amount: number, reason?: string): Promise<PaymentResult>;
  cancel(transactionId: string): Promise<PaymentResult>;
  getStatus(transactionId: string): Promise<PaymentResult>;
  verifyWebhook(payload: unknown, headers: Record<string, string>): Promise<boolean>;
}
