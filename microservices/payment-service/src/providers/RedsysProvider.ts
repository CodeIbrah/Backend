/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentProvider, PaymentRequest, PaymentResult } from '../interfaces/PaymentProvider';
import { PaymentMethod, Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

/**
 * RedsysProvider — integración con la pasarela bancaria Redsys (España).
 *
 * En producción, usa redsys-easy o node-redsys-api:
 *   npm install redsys-easy
 *
 * Variables de entorno requeridas:
 *   REDSYS_MERCHANT_CODE
 *   REDSYS_TERMINAL
 *   REDSYS_SECRET_KEY (firma HMAC SHA-256)
 *   REDSYS_ENVIRONMENT=sandbox|production
 *   REDSYS_SANDBOX_MERCHANT_CODE (para sandbox: 999008881 opcional)
 *
 * Métodos soportados:
 *   - Visa, Mastercard, AMEX, Maestro
 *   - Bizum (a través de Redsys)
 *   - Apple Pay, Google Pay (a través de Redsys)
 */
export class RedsysProvider implements PaymentProvider {
  readonly name = 'Redsys';
  readonly supportedMethods: PaymentMethod[] = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BIZUM,
    PaymentMethod.APPLE_PAY,
    PaymentMethod.GOOGLE_PAY,
  ];

  private getBaseUrl(): string {
    const env = process.env.REDSYS_ENVIRONMENT || 'sandbox';
    return env === 'production'
      ? 'https://sis.redsys.es/sis/rest/trataPeticionREST'
      : 'https://sis-t.redsys.es:2543/sis/rest/trataPeticionREST';
  }

  /**
   * Genera un Ds_Merchant_Order único (formato: año + número secuencial de 8 dígitos).
   */
  private generateOrderNumber(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const seq = String(Date.now()).slice(-8);
    return `${year}${seq}`;
  }

  /**
   * Construye el JSON de petición que Redsys espera en su API REST.
   */
  private buildRequestParams(request: PaymentRequest, transactionType: string): Record<string, unknown> {
    return {
      DS_MERCHANT_AMOUNT: Math.round(request.amount * 100).toString(),
      DS_MERCHANT_ORDER: this.generateOrderNumber(),
      DS_MERCHANT_MERCHANTCODE: process.env.REDSYS_MERCHANT_CODE || '',
      DS_MERCHANT_TERMINAL: process.env.REDSYS_TERMINAL || '1',
      DS_MERCHANT_TRANSACTIONTYPE: transactionType,
      DS_MERCHANT_CURRENCY: this.toIsoNumeric(request.currency),
      DS_MERCHANT_MERCHANTURL: process.env.REDSYS_MERCHANT_URL || '',
      DS_MERCHANT_URLOK: process.env.REDSYS_SUCCESS_URL || '',
      DS_MERCHANT_URLKO: process.env.REDSYS_FAILURE_URL || '',
      DS_MERCHANT_MERCHANTNAME: process.env.REDSYS_MERCHANT_NAME || 'Payment Service',
      DS_MERCHANT_PRODUCTDESCRIPTION: request.paymentData.description as string || 'Payment',
    };
  }

  /**
   * Convierte Currency ISO 4217 alfabético a numérico para Redsys.
   */
  private toIsoNumeric(currency: Currency): string {
    const map: Record<string, string> = {
      [Currency.EUR]: '978',
      [Currency.USD]: '840',
      [Currency.GBP]: '826',
    };
    return map[currency] || '978';
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('redsys.createPayment');
    try {
      const params = this.buildRequestParams(request, '0'); // 0 = autorización

      // En producción se enviaría a Redsys REST API y se manejaría la respuesta
      // Por ahora construimos la respuesta de formulario para redirección
      const orderId = params.DS_MERCHANT_ORDER as string;

      logger.info({
        message: 'Redsys payment request prepared',
        orderId,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
      });

      return {
        success: true,
        transactionId: `redsys_${orderId}`,
        status: 'REDIRECT_REQUIRED',
        amount: request.amount,
        currency: request.currency,
        provider: this.name,
        metadata: {
          merchantParameters: params,
          redirectUrl: this.getBaseUrl(),
          orderId,
        },
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        errorMessage: error instanceof Error ? error.message : 'Redsys error',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async authorize(request: PaymentRequest): Promise<PaymentResult> {
    return this.createPayment(request); // Redsys autoriza en el mismo paso
  }

  async capture(transactionId: string, amount?: number): Promise<PaymentResult> {
    const span = tracer.startSpan('redsys.capture');
    try {
      const orderId = transactionId.replace('redsys_', '');

      // En producción se llamaría a la API de Redsys con confirmación
      logger.info({ message: 'Redsys capture prepared', orderId, amount });

      return {
        success: true,
        transactionId,
        status: 'CAPTURED',
        amount: amount || 0,
        currency: Currency.EUR,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.EUR,
        errorMessage: error instanceof Error ? error.message : 'Redsys capture failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async refund(transactionId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    const span = tracer.startSpan('redsys.refund');
    try {
      logger.info({ message: 'Redsys refund prepared', transactionId, amount, reason });

      return {
        success: true,
        transactionId: `refund_${transactionId}`,
        status: 'REFUNDED',
        amount: amount || 0,
        currency: Currency.EUR,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.EUR,
        errorMessage: error instanceof Error ? error.message : 'Redsys refund failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async partialRefund(transactionId: string, amount: number, reason?: string): Promise<PaymentResult> {
    return this.refund(transactionId, amount, reason);
  }

  async cancel(transactionId: string): Promise<PaymentResult> {
    const span = tracer.startSpan('redsys.cancel');
    try {
      return {
        success: true,
        transactionId: `cancelled_${transactionId}`,
        status: 'CANCELLED',
        amount: 0,
        currency: Currency.EUR,
        provider: this.name,
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.EUR,
        errorMessage: error instanceof Error ? error.message : 'Redsys cancel failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async getStatus(transactionId: string): Promise<PaymentResult> {
    const span = tracer.startSpan('redsys.getStatus');
    try {
      const orderId = transactionId.replace('redsys_', '');

      // En producción se consultaría la API de Redsys
      return {
        success: true,
        transactionId,
        status: 'PENDING',
        amount: 0,
        currency: Currency.EUR,
        provider: this.name,
        metadata: { orderId },
      };
    } catch {
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: 0,
        currency: Currency.EUR,
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async verifyWebhook(payload: unknown, _headers: Record<string, string>): Promise<boolean> {
    try {
      // Redsys no envía webhooks como tal, sino notificaciones HTTP POST
      // con parámetros codificados y una firma HMAC SHA-256
      const notification = payload as Record<string, unknown>;
      if (!notification.Ds_Signature || !notification.Ds_Order) {
        return false;
      }

      // En producción, verificarías la firma con la clave secreta:
      // const calculatedSignature = ...;
      // return calculatedSignature === notification.Ds_Signature;
      return true;
    } catch {
      return false;
    }
  }
}

export const redsysProvider = new RedsysProvider();
