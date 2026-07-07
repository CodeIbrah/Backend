import { PaymentProvider, PaymentRequest, PaymentResult } from '../interfaces/PaymentProvider';
import { PaymentMethod, Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

/**
 * MockProvider — simulación de pagos para entornos de desarrollo/testing.
 *
 * Sin dependencias externas. Usa Math.random() para simular resultados
 * con tasas de éxito configurables.
 *
 * Soporta TODOS los métodos de pago, ideal para pruebas.
 */
export class MockProvider implements PaymentProvider {
  readonly name = 'Mock';
  readonly supportedMethods: PaymentMethod[] = Object.values(PaymentMethod);

  private successRates: Record<string, number> = {
    [PaymentMethod.CREDIT_CARD]: 0.85,
    [PaymentMethod.DEBIT_CARD]: 0.85,
    [PaymentMethod.PAYPAL]: 0.90,
    [PaymentMethod.BIZUM]: 0.88,
    [PaymentMethod.APPLE_PAY]: 0.95,
    [PaymentMethod.GOOGLE_PAY]: 0.95,
    [PaymentMethod.BANK_TRANSFER]: 0.98,
    [PaymentMethod.CRYPTO]: 0.92,
    [PaymentMethod.CASH]: 1.0,
    [PaymentMethod.KLARNA]: 0.88,
    [PaymentMethod.SEPA]: 0.97,
  };

  private simulateDelay(): Promise<void> {
    const ms = Math.random() * 400 + 50;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('mock.createPayment');
    try {
      await this.simulateDelay();

      const rate = this.successRates[request.method] || 0.9;
      const success = Math.random() < rate;
      const txnId = `mock_${request.method.toLowerCase()}_${Date.now()}`;

      logger.info({
        message: 'Mock payment',
        method: request.method,
        amount: request.amount,
        success,
        transactionId: txnId,
      });

      if (success) {
        return {
          success: true,
          transactionId: txnId,
          status: 'COMPLETED',
          amount: request.amount,
          currency: request.currency,
          provider: this.name,
        };
      }

      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        errorMessage: `Mock ${request.method} payment failed (simulated)`,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        errorMessage: error instanceof Error ? error.message : 'Mock error',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async authorize(request: PaymentRequest): Promise<PaymentResult> {
    return this.createPayment(request);
  }

  async capture(transactionId: string, amount?: number): Promise<PaymentResult> {
    await this.simulateDelay();
    return {
      success: true,
      transactionId: `captured_${transactionId}`,
      status: 'CAPTURED',
      amount: amount || 0,
      currency: Currency.USD,
      provider: this.name,
    };
  }

  async refund(transactionId: string, amount?: number, _reason?: string): Promise<PaymentResult> {
    await this.simulateDelay();
    return {
      success: true,
      transactionId: `refund_${transactionId}`,
      status: 'REFUNDED',
      amount: amount || 0,
      currency: Currency.USD,
      provider: this.name,
    };
  }

  async partialRefund(transactionId: string, amount: number, reason?: string): Promise<PaymentResult> {
    return this.refund(transactionId, amount, reason);
  }

  async cancel(transactionId: string): Promise<PaymentResult> {
    await this.simulateDelay();
    return {
      success: true,
      transactionId: `cancelled_${transactionId}`,
      status: 'CANCELLED',
      amount: 0,
      currency: Currency.USD,
      provider: this.name,
    };
  }

  async getStatus(transactionId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId,
      status: 'COMPLETED',
      amount: 0,
      currency: Currency.USD,
      provider: this.name,
    };
  }

  async verifyWebhook(_payload: unknown, _headers: Record<string, string>): Promise<boolean> {
    return true;
  }
}

export const mockProvider = new MockProvider();
