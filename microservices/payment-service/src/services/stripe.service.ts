
import Stripe from 'stripe';
import { PaymentMethod, Currency } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class StripeService {
  /**
   * Creates a payment intent with Stripe
   */
  async createPaymentIntent(
    amount: number,
    currency: Currency,
    paymentMethodId?: string,
    customerId?: string
  ) {
    const span = tracer.startSpan('stripe.createPaymentIntent');
    
    try {
      // Convert amount to cents (Stripe expects amount in smallest currency unit)
      const amountInCents = Math.round(amount * 100);
      
      const params: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      };
      
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }
      
      if (customerId) {
        params.customer = customerId;
      }
      
      const paymentIntent = await stripe.paymentIntents.create(params);
      
      span.setAttribute('paymentIntentId', paymentIntent.id);
      span.addEvent('Payment intent created successfully');
      
      logger.info({ 
        message: 'Stripe payment intent created', 
        paymentIntentId: paymentIntent.id,
        amount,
        currency 
      });
      
      return paymentIntent;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
      
      logger.error({ 
        message: 'Failed to create Stripe payment intent', 
        error: error instanceof Error ? error.message : String(error),
        amount,
        currency 
      });
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Confirms a payment intent with a payment method
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ) {
    const span = tracer.startSpan('stripe.confirmPaymentIntent');
    
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }
      
      const paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntentId,
        params
      );
      
      span.setAttribute('paymentIntentId', paymentIntent.id);
      span.setAttribute('status', paymentIntent.status);
      span.addEvent('Payment intent confirmed');
      
      logger.info({ 
        message: 'Stripe payment intent confirmed', 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status 
      });
      
      return paymentIntent;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
      
      logger.error({ 
        message: 'Failed to confirm Stripe payment intent', 
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId 
      });
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves a payment intent from Stripe
   */
  async getPaymentIntent(paymentIntentId: string) {
    const span = tracer.startSpan('stripe.getPaymentIntent');
    
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      span.setAttribute('paymentIntentId', paymentIntent.id);
      span.setAttribute('status', paymentIntent.status);
      span.addEvent('Payment intent retrieved');
      
      logger.debug({ 
        message: 'Stripe payment intent retrieved', 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status 
      });
      
      return paymentIntent;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
      
      logger.error({ 
        message: 'Failed to retrieve Stripe payment intent', 
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId 
      });
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a customer in Stripe
   */
  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, any>
  ) {
    const span = tracer.startSpan('stripe.createCustomer');
    
    try {
      const params: Stripe.CustomerCreateParams = {
        email,
        name,
        metadata,
      };
      
      const customer = await stripe.customers.create(params);
      
      span.setAttribute('customerId', customer.id);
      span.addEvent('Customer created successfully');
      
      logger.info({ 
        message: 'Stripe customer created', 
        customerId: customer.id,
        email 
      });
      
      return customer;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
      
      logger.error({ 
        message: 'Failed to create Stripe customer', 
        error: error instanceof Error ? error.message : String(error),
        email 
      });
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Creates a payment method attached to a customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ) {
    const span = tracer.startSpan('stripe.attachPaymentMethod');
    
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      span.setAttribute('paymentMethodId', paymentMethodId);
      span.setAttribute('customerId', customerId);
      span.addEvent('Payment method attached to customer');
      
      logger.info({ 
        message: 'Stripe payment method attached to customer', 
        paymentMethodId,
        customerId 
      });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
      
      logger.error({ 
        message: 'Failed to attach Stripe payment method to customer', 
        error: error instanceof Error ? error.message : String(error),
        paymentMethodId,
        customerId 
      });
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Handles Stripe webhook events
   */
  async handleWebhookEvent(
    payload: Buffer,
    signature: string
  ) {
    const span = tracer.startSpan('stripe.handleWebhookEvent');
    
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      
      let event: Stripe.Event;
      
      try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err) {
        logger.error({ 
          message: '⚠️  Webhook signature verification failed.', 
          error: err instanceof Error ? err.message : String(err) 
        });
        throw err;
      }
      
      span.setAttribute('eventId', event.id);
      span.setAttribute('eventType', event.type);
      span.addEvent('Webhook event received');
      
      logger.info({ 
        message: 'Stripe webhook received', 
        eventId: event.id,
        eventType: event.type 
      });
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.info({ 
            message: 'PaymentIntent succeeded', 
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount_received / 100,
            currency: paymentIntent.currency 
          });
          // Aquí podrías notificar a tu servicio de pagos que el pago fue exitoso
          break;
          
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.error({ 
            message: 'PaymentIntent failed', 
            paymentIntentId: failedPaymentIntent.id,
            amount: failedPaymentIntent.amount,
            currency: failedPaymentIntent.currency,
            error: failedPaymentIntent.last_payment_error?.message 
          });
          // Aquí podrías notificar a tu servicio de pagos que el pago falló
          break;
          
        // Maneja otros tipos de eventos según necesites
        default:
          logger.debug(Unhandled event type );
      }
      
      return event;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error instanceof Error ? error.message : 'Unknown error' });
      
      logger.error({ 
        message: 'Error handling Stripe webhook event', 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    } finally {
      span.end();
    }
  }
}

// Export a singleton instance
export const stripeService = new StripeService();
