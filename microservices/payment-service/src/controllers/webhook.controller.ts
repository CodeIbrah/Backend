import { Request, Response } from 'express';
import { paymentGatewayService } from '../services/payment-gateway.service';
import { logger } from '../logging/logger';

/**
 * Webhook unificado para todas las pasarelas de pago.
 *
 * Cada pasarela tiene un prefijo en la URL:
 *   POST /api/v1/webhooks/stripe
 *   POST /api/v1/webhooks/paypal
 *   POST /api/v1/webhooks/redsys
 *   POST /api/v1/webhooks/adyen
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const provider = req.params.provider?.toLowerCase();

  if (!provider) {
    res.status(400).json({ error: 'Provider parameter is required' });
    return;
  }

  try {
    const verified = await paymentGatewayService.verifyWebhook(
      provider,
      provider === 'stripe' ? req.body : req.body,
      req.headers as Record<string, string>,
    );

    if (!verified) {
      logger.warn({ message: 'Webhook verification failed', provider });
      res.status(401).json({ error: 'Webhook verification failed' });
      return;
    }

    // Route to provider-specific handlers
    switch (provider) {
      case 'stripe': {
        const event = req.body;
        const eventType = event.type as string;
        const eventData = event.data?.object as Record<string, unknown> | undefined;

        logger.info({
          message: 'Stripe webhook received',
          eventType,
          eventId: event.id,
        });

        switch (eventType) {
          case 'payment_intent.succeeded':
            logger.info({ message: 'PaymentIntent succeeded', id: eventData?.id });
            break;
          case 'payment_intent.payment_failed':
            logger.error({ message: 'PaymentIntent failed', id: eventData?.id });
            break;
          case 'charge.refunded':
            logger.info({ message: 'Charge refunded', id: eventData?.id });
            break;
          default:
            logger.debug({ message: 'Unhandled Stripe event', eventType });
        }
        break;
      }

      case 'paypal': {
        const event = req.body;
        logger.info({
          message: 'PayPal webhook received',
          eventType: event.event_type,
        });
        break;
      }

      case 'redsys': {
        // Redsys envía notificaciones POST con parámetros codificados
        logger.info({
          message: 'Redsys notification received',
          order: req.body.Ds_Order,
        });
        break;
      }

      case 'adyen': {
        const notificationItems = req.body.notificationItems as Array<Record<string, unknown>> | undefined;
        logger.info({
          message: 'Adyen webhook received',
          items: notificationItems?.length,
        });
        break;
      }

      default:
        logger.warn({ message: 'Unknown webhook provider', provider });
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error({
      message: 'Webhook processing error',
      provider,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
