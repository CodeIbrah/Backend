import Stripe from 'stripe';
import { Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

let _stripe: ReturnType<typeof createStripe> | null = null;

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required for payment operations');
  }
  return new Stripe(key);
}

function getStripe() {
  if (!_stripe) {
    _stripe = createStripe();
  }
  return _stripe;
}

export class StripeService {
  async createPaymentIntent(amount: number, currency: Currency, paymentMethodId?: string, customerId?: string) {
    const span = tracer.startSpan('getStripe().createPaymentIntent');
    try {
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await getStripe().paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        ...(paymentMethodId && { payment_method: paymentMethodId }),
        ...(customerId && { customer: customerId }),
      });
      span.setAttribute('paymentIntentId', paymentIntent.id);
      span.addEvent('Payment intent created');
      return paymentIntent;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string) {
    const span = tracer.startSpan('getStripe().confirmPaymentIntent');
    try {
      const paymentIntent = await getStripe().paymentIntents.confirm(paymentIntentId, {
        ...(paymentMethodId && { payment_method: paymentMethodId }),
      });
      span.setAttribute('paymentIntentId', paymentIntent.id);
      span.addEvent('Payment intent confirmed');
      return paymentIntent;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }

  async getPaymentIntent(paymentIntentId: string) {
    const span = tracer.startSpan('getStripe().getPaymentIntent');
    try {
      return await getStripe().paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    const span = tracer.startSpan('getStripe().createCustomer');
    try {
      const customer = await getStripe().customers.create({ email, name, metadata });
      span.setAttribute('customerId', customer.id);
      return customer;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    const span = tracer.startSpan('getStripe().attachPaymentMethod');
    try {
      await getStripe().paymentMethods.attach(paymentMethodId, { customer: customerId });
      span.addEvent('Payment method attached');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }

  async handleWebhookEvent(payload: Buffer, signature: string) {
    const span = tracer.startSpan('getStripe().handleWebhookEvent');
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
      span.setAttribute('eventId', event.id);
      span.setAttribute('eventType', event.type);
      switch (event.type) {
        case 'payment_intent.succeeded':
          logger.info({ message: 'PaymentIntent succeeded', id: (event.data.object as { id: string }).id });
          break;
        case 'payment_intent.payment_failed':
          logger.error({ message: 'PaymentIntent failed' });
          break;
        default:
          logger.debug('Unhandled event type: ' + event.type);
      }
      return event;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    const span = tracer.startSpan('getStripe().refundPayment');
    try {
      const refund = await getStripe().refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
      span.setAttribute('refundId', refund.id);
      return refund;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      span.end();
    }
  }
}

export const stripeService = new StripeService();
