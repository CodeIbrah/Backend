import { PaymentMethod, Currency } from '../types';
import { PaymentProvider, PaymentRequest, PaymentResult } from '../interfaces/PaymentProvider';
import { stripeProvider } from '../providers/StripeProvider';
import { payPalProvider } from '../providers/PayPalProvider';
import { redsysProvider } from '../providers/RedsysProvider';
import { adyenProvider } from '../providers/AdyenProvider';
import { mockProvider } from '../providers/MockProvider';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

/**
 * ProviderRegistry — mapea métodos de pago a sus proveedores.
 *
 * Orden de resolución:
 *   1. Proveedor real y específico (Stripe, PayPal, Redsys, Adyen)
 *   2. MockProvider (fallback si MOCK_PAYMENTS=true o no hay provider específico)
 *
 * Variables de entorno:
 *   MOCK_PAYMENTS=true — fuerza el uso de MockProvider para todos los pagos
 *   ENABLED_PROVIDERS=stripe,paypal — limita los providers activos
 */
class PaymentGatewayService {
  private registry: Map<PaymentMethod, PaymentProvider> = new Map();
  private allProviders: PaymentProvider[] = [];

  constructor() {
    this.registerProviders();
  }

  private registerProviders(): void {
    const providers = [stripeProvider, payPalProvider, redsysProvider, adyenProvider, mockProvider];
    const enabledProviders = process.env.ENABLED_PROVIDERS
      ? process.env.ENABLED_PROVIDERS.split(',').map((p) => p.trim().toLowerCase())
      : null;
    const useMock = process.env.MOCK_PAYMENTS === 'true';

    for (const provider of providers) {
      // Si MOCK_PAYMENTS=true, solo registrar MockProvider
      if (useMock && provider.name !== 'Mock') continue;

      // Si hay ENABLED_PROVIDERS, filtrar
      if (enabledProviders && !enabledProviders.includes(provider.name.toLowerCase()) && provider.name !== 'Mock') {
        // Still register Mock as fallback
        continue;
      }

      this.allProviders.push(provider);

      for (const method of provider.supportedMethods) {
        // Preferir proveedores más específicos sobre Mock
        if (!this.registry.has(method) || provider.name === 'Mock') {
          // Si ya hay un provider real, no sobreescribir con Mock
          if (provider.name === 'Mock' && this.registry.has(method)) continue;
          this.registry.set(method, provider);
        }
      }
    }

    // Registrar Mock como fallback para métodos no cubiertos
    for (const method of Object.values(PaymentMethod)) {
      if (!this.registry.has(method) && !useMock) {
        this.registry.set(method, mockProvider);
      }
    }

    logger.info({
      message: 'Payment providers registered',
      providers: this.allProviders.map((p) => p.name),
      methods: Array.from(this.registry.entries()).map(
        ([method, provider]) => `${method} → ${provider.name}`,
      ),
    });
  }

  /**
   * Obtiene el provider adecuado para un método de pago.
   */
  getProvider(method: PaymentMethod): PaymentProvider {
    const provider = this.registry.get(method);
    if (!provider) {
      throw new Error(`No payment provider found for method: ${method}`);
    }
    return provider;
  }

  /**
   * Procesa un pago completo (create + capture).
   */
  async processPayment(
    method: PaymentMethod,
    amount: number,
    currency: Currency,
    paymentData: Record<string, unknown> = {},
  ): Promise<PaymentResult> {
    const span = tracer.startSpan('gateway.processPayment');
    span.setAttribute('method', method);
    span.setAttribute('amount', amount);
    span.setAttribute('currency', currency);

    try {
      const provider = this.getProvider(method);
      span.setAttribute('provider', provider.name);

      const request: PaymentRequest = { amount, currency, method, paymentData };

      logger.info({
        message: 'Processing payment via provider',
        provider: provider.name,
        method,
        amount,
        currency,
      });

      const result = await provider.createPayment(request);

      span.setAttribute('result', result.status);

      if (!result.success) {
        logger.error({
          message: 'Payment failed',
          provider: provider.name,
          error: result.errorMessage,
        });
      }

      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Unknown error' });

      logger.error({
        message: 'Payment processing error',
        error: error instanceof Error ? error.message : String(error),
        method,
      });

      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        amount,
        currency,
        errorMessage: error instanceof Error ? error.message : 'Payment processing error',
      };
    } finally {
      span.end();
    }
  }

  /**
   * Reembolsa un pago.
   */
  async refundPayment(
    method: PaymentMethod,
    transactionId: string,
    amount?: number,
    reason?: string,
  ): Promise<PaymentResult> {
    const span = tracer.startSpan('gateway.refundPayment');
    try {
      const provider = this.getProvider(method);
      return await provider.refund(transactionId, amount, reason);
    } catch (error) {
      span.recordException(error as Error);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        amount: amount || 0,
        currency: Currency.USD,
        errorMessage: error instanceof Error ? error.message : 'Refund error',
      };
    } finally {
      span.end();
    }
  }

  /**
   * Verifica un webhook según el proveedor.
   */
  async verifyWebhook(
    providerName: string,
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<boolean> {
    const provider = this.allProviders.find(
      (p) => p.name.toLowerCase() === providerName.toLowerCase(),
    );
    if (!provider) return false;
    return provider.verifyWebhook(payload, headers);
  }

  /**
   * Obtiene todos los proveedores registrados.
   */
  getProviders(): PaymentProvider[] {
    return [...this.allProviders];
  }
}

export const paymentGatewayService = new PaymentGatewayService();
