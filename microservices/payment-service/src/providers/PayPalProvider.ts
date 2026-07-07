import { PaymentProvider, PaymentRequest, PaymentResult } from '../interfaces/PaymentProvider';
import { PaymentMethod, Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

/**
 * PayPalProvider — integración con la API REST de PayPal.
 *
 * En producción, usa @paypal/paypal-server-sdk:
 *   import { Client, Environment, OrdersController } from '@paypal/paypal-server-sdk';
 *
 * Variables de entorno requeridas:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_ENVIRONMENT=sandbox|production
 *
 * Métodos soportados:
 *   - PayPal (cuenta PayPal)
 *   - Tarjetas Visa, Mastercard, AMEX, Discover
 *   - PayPal Pay Later
 */
export class PayPalProvider implements PaymentProvider {
  readonly name = 'PayPal';
  readonly supportedMethods: PaymentMethod[] = [
    PaymentMethod.PAYPAL,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
  ];

  private getBaseUrl(): string {
    const env = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    return env === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`PayPal auth failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('paypal.createPayment');
    try {
      const accessToken = await this.getAccessToken();

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: request.currency,
              value: request.amount.toFixed(2),
            },
          },
        ],
        payment_source: this.buildPaymentSource(request),
      };

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`PayPal order creation failed: ${errorBody}`);
      }

      const order = (await response.json()) as { id: string; status: string };

      span.setAttribute('paypalOrderId', order.id);

      return {
        success: true,
        transactionId: order.id,
        status: order.status,
        amount: request.amount,
        currency: request.currency,
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
        errorMessage: error instanceof Error ? error.message : 'PayPal error',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async authorize(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('paypal.authorize');
    try {
      const accessToken = await this.getAccessToken();

      const orderPayload = {
        intent: 'AUTHORIZE',
        purchase_units: [
          {
            amount: {
              currency_code: request.currency,
              value: request.amount.toFixed(2),
            },
          },
        ],
      };

      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error(`PayPal authorize failed: ${response.statusText}`);
      }

      const order = (await response.json()) as { id: string; status: string };

      return {
        success: true,
        transactionId: order.id,
        status: 'AUTHORIZED',
        amount: request.amount,
        currency: request.currency,
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
        errorMessage: error instanceof Error ? error.message : 'PayPal authorization failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async capture(transactionId: string, amount?: number): Promise<PaymentResult> {
    const span = tracer.startSpan('paypal.capture');
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/v2/checkout/orders/${transactionId}/capture`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`PayPal capture failed: ${response.statusText}`);
      }

      const result = (await response.json()) as { id: string; status: string };

      return {
        success: result.status === 'COMPLETED',
        transactionId: result.id,
        status: result.status,
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
        errorMessage: error instanceof Error ? error.message : 'PayPal capture failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async refund(transactionId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    const span = tracer.startSpan('paypal.refund');
    try {
      const accessToken = await this.getAccessToken();

      const refundPayload: Record<string, unknown> = {};
      if (amount !== undefined) {
        refundPayload.amount = {
          currency_code: Currency.USD,
          value: amount.toFixed(2),
        };
      }

      const response = await fetch(
        `${this.getBaseUrl()}/v2/payments/captures/${transactionId}/refund`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refundPayload),
        },
      );

      if (!response.ok) {
        throw new Error(`PayPal refund failed: ${response.statusText}`);
      }

      const result = (await response.json()) as { id: string; status: string };

      logger.info({ message: 'PayPal refund processed', refundId: result.id, reason });

      return {
        success: result.status === 'COMPLETED',
        transactionId: result.id,
        status: result.status,
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
        errorMessage: error instanceof Error ? error.message : 'PayPal refund failed',
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
    const span = tracer.startSpan('paypal.cancel');
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/v2/checkout/orders/${transactionId}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: response.ok,
        transactionId,
        status: 'CANCELLED',
        amount: 0,
        currency: Currency.USD,
        provider: this.name,
      };
    } catch (error) {
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
    const span = tracer.startSpan('paypal.getStatus');
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.getBaseUrl()}/v2/checkout/orders/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) {
        throw new Error(`PayPal status check failed: ${response.statusText}`);
      }

      const order = (await response.json()) as {
        id: string;
        status: string;
        purchase_units?: Array<{
          amount: { currency_code: string; value: string };
        }>;
      };

      const amount = order.purchase_units?.[0]?.amount;
      return {
        success: true,
        transactionId: order.id,
        status: order.status,
        amount: amount ? parseFloat(amount.value) : 0,
        currency: (amount?.currency_code as Currency) || Currency.USD,
        provider: this.name,
      };
    } catch (error) {
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

  async verifyWebhook(_payload: unknown, headers: Record<string, string>): Promise<boolean> {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      if (!webhookId) return false;

      const accessToken = await this.getAccessToken();
      const transmissionId = headers['paypal-transmission-id'];
      const timestamp = headers['paypal-transmission-time'];
      const signature = headers['paypal-transmission-sig'];
      const certUrl = headers['paypal-cert-url'];
      const authAlgo = headers['paypal-auth-algo'];

      if (!transmissionId || !timestamp || !signature) return false;

      const verificationBody = {
        webhook_id: webhookId,
        transmission_id: transmissionId,
        transmission_time: timestamp,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: signature,
        webhook_event: _payload,
      };

      const response = await fetch(
        `${this.getBaseUrl()}/v1/notifications/verify-webhook-signature`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verificationBody),
        },
      );

      if (!response.ok) return false;

      const result = (await response.json()) as { verification_status: string };
      return result.verification_status === 'SUCCESS';
    } catch {
      return false;
    }
  }

  private buildPaymentSource(request: PaymentRequest): Record<string, unknown> | undefined {
    if (request.paymentData.payerId) {
      return {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
          },
        },
      };
    }
    return undefined;
  }
}

export const payPalProvider = new PayPalProvider();
