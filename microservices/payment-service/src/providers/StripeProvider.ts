/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentProvider, PaymentRequest, PaymentResult } from '../interfaces/PaymentProvider';
import { PaymentMethod, Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

let _stripe: any = null;

function getStripe(): any {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    const StripeLib = require('stripe');
    _stripe = new StripeLib(key);
  }
  return _stripe;
}

export class StripeProvider implements PaymentProvider {
  readonly name = 'Stripe';
  readonly supportedMethods: PaymentMethod[] = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.APPLE_PAY,
    PaymentMethod.GOOGLE_PAY,
  ];

  async createPayment(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('stripe.createPayment');
    try {
      const amountInCents = Math.round(request.amount * 100);
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
      });

      span.setAttribute('paymentIntentId', paymentIntent.id);

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        amount: request.amount,
        currency: request.currency,
        provider: this.name,
        metadata: { clientSecret: paymentIntent.client_secret },
      };
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        amount: request.amount,
        currency: request.currency,
        errorMessage: error instanceof Error ? error.message : 'Stripe error',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async authorize(request: PaymentRequest): Promise<PaymentResult> {
    const span = tracer.startSpan('stripe.authorize');
    try {
      const amountInCents = Math.round(request.amount * 100);
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        capture_method: 'manual',
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: 'REQUIRES_CAPTURE',
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
        errorMessage: error instanceof Error ? error.message : 'Authorization failed',
        provider: this.name,
      };
    } finally {
      span.end();
    }
  }

  async capture(transactionId: string, amount?: number): Promise<PaymentResult> {
    const span = tracer.startSpan('stripe.capture');
    try {
      const params: Record<string, unknown> = {};
      if (amount !== undefined) {
        params.amount_to_capture = Math.round(amount * 100);
      }
      const intent = await getStripe().paymentIntents.capture(transactionId, params);

      return {
        success: intent.status === 'succeeded',
        transactionId: intent.id,
        status: intent.status,
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
    const span = tracer.startSpan('stripe.refund');
    try {
      const refundParams: Record<string, unknown> = { payment_intent: transactionId };
      if (amount !== undefined) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await getStripe().refunds.create(refundParams);

      logger.info({ message: 'Stripe refund processed', refundId: refund.id, reason });

      return {
        success: refund.status === 'succeeded',
        transactionId: refund.id,
        status: refund.status,
        amount: amount || 0,
        currency: Currency.USD,
        provider: this.name,
        metadata: { refundId: refund.id },
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

  async partialRefund(transactionId: string, amount: number, reason?: string): Promise<PaymentResult> {
    return this.refund(transactionId, amount, reason);
  }

  async cancel(transactionId: string): Promise<PaymentResult> {
    const span = tracer.startSpan('stripe.cancel');
    try {
      const intent = await getStripe().paymentIntents.cancel(transactionId);

      return {
        success: true,
        transactionId: intent.id,
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
    const span = tracer.startSpan('stripe.getStatus');
    try {
      const intent = await getStripe().paymentIntents.retrieve(transactionId);

      return {
        success: true,
        transactionId: intent.id,
        status: intent.status,
        amount: intent.amount / 100,
        currency: intent.currency.toUpperCase() as Currency,
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

  async verifyWebhook(payload: unknown, headers: Record<string, string>): Promise<boolean> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return false;

      const sig = headers['stripe-signature'];
      if (!sig) return false;

      getStripe().webhooks.constructEvent(payload as string, sig, webhookSecret);
      return true;
    } catch {
      return false;
    }
  }
}

export const stripeProvider = new StripeProvider();
