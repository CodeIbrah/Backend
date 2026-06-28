import {
  validateCreateInvoiceFromPayment,
  validatePaymentWebhook,
  validatePagination,
} from '../src/validators/invoice.validator';
import { Currency, InvoiceChannel } from '../src/types';

describe('Invoice Validators', () => {
  it('should validate create invoice from payment input', () => {
    const result = validateCreateInvoiceFromPayment({
      userId: 'user-123',
      userEmail: 'test@example.com',
      userPhone: '+34600000000',
      paymentId: 'payment-456',
      items: [{ description: 'Test item', quantity: 1, unitPrice: 100 }],
      currency: Currency.USD,
      channel: InvoiceChannel.EMAIL,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateCreateInvoiceFromPayment({
      userId: 'user-123',
      userEmail: 'invalid',
      userPhone: '+34600000000',
      paymentId: 'payment-456',
      items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('should validate payment webhook', () => {
    const result = validatePaymentWebhook({
      event: 'payment.completed',
      paymentId: 'pay-123',
      userId: 'user-456',
      amount: 100,
      currency: Currency.USD,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid webhook event', () => {
    const result = validatePaymentWebhook({
      event: 'invalid.event',
      paymentId: 'pay-123',
      userId: 'user-456',
      amount: 100,
      currency: Currency.USD,
    });
    expect(result.success).toBe(false);
  });

  it('should validate pagination', () => {
    const result = validatePagination({ page: '2', limit: '20' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should reject invalid pagination', () => {
    const result = validatePagination({ page: '-1' });
    expect(result.success).toBe(false);
  });
});
