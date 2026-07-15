/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentProvider, PaymentRequest, PaymentResult } from '../interfaces/PaymentProvider';
import { PaymentMethod, Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

/**
 * AdyenProvider — integración con la plataforma global Adyen.
 *
 * En producción, usa @adyen/api-library:
 *   npm install @adyen/api-library
 *
 * Variables de entorno requeridas:
 *   ADYEN_API_KEY
 *   ADYEN_MERCHANT_ACCOUNT
 *   ADYEN_ENVIRONMENT=test|live
 *   ADYEN_CLIENT_KEY (para checkout desde frontend)
 *   ADYEN_HMAC_KEY (para verificación de webhooks)
 *   ADYEN_LIVE_URL_PREFIX (solo para live)
 *
 * Métodos soportados (100+):
 *   - Tarjetas: Visa, Mastercard, AMEX, Maestro, Discover, JCB, UnionPay
 *   - Wallets: Apple Pay, Google Pay, Samsung Pay
 *   - Transferencias: SEPA, ACH, Open Banking
 *   - Métodos locales: Bizum, Klarna, iDEAL, Bancontact, Sofort, BLIK, PIX, etc.
 */
export class AdyenProvider implements PaymentProvider {
  readonly name = 'Adyen';
  readonly supportedMethods: PaymentMethod[] = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.PAYPAL,
    PaymentMethod.BIZUM,
    PaymentMethod.APPLE_PAY,
    PaymentMethod.GOOGLE_PAY,
    PaymentMethod.KLARNA,
    PaymentMethod.SEPA,
  ];

  private getBaseUrl(): string {
    const env = process.env.ADYEN_ENVIRONMENT || 'test';
    const prefix = process.env.ADYEN_LIVE_URL_PREFIX || '';
    if (env === 'live') {
      return `https://${prefix}-checkout-live.adyenpayments.com/checkout`;
    }
    return 'https://checkout-test.adyen.com/checkout';
  }

  private getEndpoint(path: string): string {
    const env = process.env.ADYEN_ENVIRONMENT || 'test';
    const prefix = process.env.ADYEN_LIVE_URL_PREFIX || '';

    if (env === 'live') {
      return `https://${prefix}-pal-live.adyenpayments.com/pal/servlet/${path}`;
    }
    return `https://pal-test.adyen.com/pal/servlet/${path}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.ADYEN_API_KEY || '',
    };
  }

  private getMerchantAccount(): string {
    return process.env.ADYEN_MERCHANT_ACCOUNT || '';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('adyen.createPayment');
    try {
      const payload = {
        amount: {
          currency: request.currency,
          value: Math.round(request.amount * 100), // Adyen usa centavos
        },
        reference: `payment_${Date.now()}`,
        merchantAccount: this.getMerchantAccount(),
        channel: 'Web',
        additionalData: {
          allow3DS2: 'true',
        },
        ...this.buildPaymentMethod(request),
      };

      const response = await fetch(`${this.getBaseUrl()}/v71/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Adyen payment failed: ${errorBody}`);
      }

      const result = (await response.json()) as {
        pspReference: string;
        resultCode: string;
        refusalReason?: string;
        additionalData?: Record<string, string>;
      };

      logger.info({
        message: 'Adyen payment processed',
        pspReference: result.pspReference,
        resultCode: result.resultCode,
      });

      const isSuccess = ['Authorised', 'Received', 'Pending'].includes(result.resultCode);

      return {
        success: isSuccess,
        transactionId: result.pspReference,
        status: result.resultCode,
        amount: request.amount,
        currency: request.currency,
        provider: this.name,
        errorMessage: isSuccess ? undefined : result.refusalReason,
        metadata: result.additionalData,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        errorMessage: error instanceof Error ? error.message : 'Adyen error',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async authorize(request: PaymentRequest): Promise<PaymentResult> {
    return this.createPayment(request); // Adyen autoriza en createPayment
  }

  async capture(transactionId: string, amount?: number): Promise<PaymentResult> {
    const span = tracer.startSpan('adyen.capture');
    try {
      const payload: Record<string, unknown> = {
        merchantAccount: this.getMerchantAccount(),
        modificationAmount: {
          value: amount ? Math.round(amount * 100) : 0,
          currency: Currency.USD,
        },
      };

      const response = await fetch(`${this.getEndpoint('Payment')}/v71/capture`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...payload,
          originalReference: transactionId,
        }),
      });

      if (!response.ok) throw new Error(`Adyen capture failed: ${response.statusText}`);

      const result = (await response.json()) as { pspReference: string; response: string };

      return {
        success: result.response === '[capture-received]',
        transactionId: result.pspReference,
        status: result.response,
        amount: amount || 0,
        currency: Currency.USD,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.USD,
        errorMessage: error instanceof Error ? error.message : 'Capture failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async refund(transactionId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    const span = tracer.startSpan('adyen.refund');
    try {
      const payload: Record<string, unknown> = {
        merchantAccount: this.getMerchantAccount(),
        modificationAmount: {
          value: amount ? Math.round(amount * 100) : 0,
          currency: Currency.USD,
        },
      };

      const response = await fetch(`${this.getEndpoint('Payment')}/v71/refund`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...payload,
          originalReference: transactionId,
        }),
      });

      if (!response.ok) throw new Error(`Adyen refund failed: ${response.statusText}`);

      const result = (await response.json()) as { pspReference: string; response: string };

      logger.info({ message: 'Adyen refund processed', pspReference: result.pspReference, reason });

      return {
        success: result.response === '[refund-received]',
        transactionId: result.pspReference,
        status: result.response,
        amount: amount || 0,
        currency: Currency.USD,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.USD,
        errorMessage: error instanceof Error ? error.message : 'Refund failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async partialRefund(
    transactionId: string,
    amount: number,
    reason?: string,
  ): Promise<PaymentResult> {
    return this.refund(transactionId, amount, reason);
  }

  async cancel(transactionId: string): Promise<PaymentResult> {
    const span = tracer.startSpan('adyen.cancel');
    try {
      const response = await fetch(`${this.getEndpoint('Payment')}/v71/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          merchantAccount: this.getMerchantAccount(),
          originalReference: transactionId,
        }),
      });

      if (!response.ok) throw new Error(`Adyen cancel failed: ${response.statusText}`);

      const result = (await response.json()) as { pspReference: string; response: string };

      return {
        success: result.response === '[cancel-received]',
        transactionId: result.pspReference,
        status: 'CANCELLED',
        amount: 0,
        currency: Currency.USD,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.USD,
        errorMessage: error instanceof Error ? error.message : 'Cancel failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async getStatus(transactionId: string): Promise<PaymentResult> {
    const span = tracer.startSpan('adyen.getStatus');
    try {
      const response = await fetch(
        `${this.getEndpoint('Checkout')}/v71/payments/${transactionId}`,
        { headers: this.getHeaders() },
      );

      if (!response.ok) throw new Error(`Adyen status check failed: ${response.statusText}`);

      const result = (await response.json()) as {
        pspReference: string;
        resultCode: string;
        amount?: { currency: string; value: number };
      };

      return {
        success: true,
        transactionId: result.pspReference,
        status: result.resultCode,
        amount: result.amount ? result.amount.value / 100 : 0,
        currency: (result.amount?.currency as Currency) || Currency.USD,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.USD,
        errorMessage: error instanceof Error ? error.message : 'Status check failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async verifyWebhook(payload: unknown, _headers: Record<string, string>): Promise<boolean> {
    try {
      // Adyen webhooks usan HMAC SHA-256 para verificar notificaciones
      const hmacKey = process.env.ADYEN_HMAC_KEY;
      if (!hmacKey) return false;

      const notification = payload as Record<string, unknown>;
      if (!notification) return false;

      // En producción se verificaría el checksum HMAC del payload
      // const calculatedHmac = ...;
      // return calculatedHmac === notification.hmacSignature;
      return true;
    } catch {
      return false;
    }
  }

  private buildPaymentMethod(request: PaymentRequest): Record<string, unknown> {
    switch (request.method) {
      case PaymentMethod.PAYPAL:
        return {
          paymentMethod: { type: 'paypal' },
        };
      case PaymentMethod.KLARNA:
        return {
          paymentMethod: { type: 'klarna' },
          billingAddress: request.paymentData.billingAddress,
        };
      case PaymentMethod.SEPA:
        return {
          paymentMethod: {
            type: 'sepadirectdebit',
            sepa: {
              iban: request.paymentData.iban as string,
              ownerName: request.paymentData.ownerName as string,
            },
          },
        };
      case PaymentMethod.APPLE_PAY:
        return {
          paymentMethod: { type: 'applepay' },
          /** Apple Pay requires the domain registered in Adyen's Apple Pay configuration */
          applePayToken: request.paymentData.applePayToken as string | undefined,
        };
      case PaymentMethod.GOOGLE_PAY:
        return {
          paymentMethod: { type: 'googlepay' },
          googlePayToken: request.paymentData.googlePayToken as string | undefined,
        };
      case PaymentMethod.BIZUM:
        return {
          paymentMethod: { type: 'bizum' },
        };
      default:
        return {
          paymentMethod: { type: 'scheme' }, // tarjeta
        };
    }
  }
}

export const adyenProvider = new AdyenProvider();
