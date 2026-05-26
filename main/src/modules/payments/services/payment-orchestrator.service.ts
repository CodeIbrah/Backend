import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { PaymentClientService } from './payment-client.service';
import { InvoiceClientService } from '../../invoices/services/invoice-client.service';

export interface CheckoutRequest {
  userId: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  currency: string;
  method: string;
  description: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  metadata?: Record<string, unknown>;
}

export interface CheckoutResponse {
  correlationId: string;
  payment: {
    id: string;
    status: string;
    transactionId: string | null;
    amount: number;
    currency: string;
    method: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
  } | null;
  receipt: {
    id: string;
    receiptNumber: string;
    amount: number;
  } | null;
  flow: string[];
}

@Injectable()
export class PaymentOrchestratorService {
  constructor(
    private readonly paymentClient: PaymentClientService,
    private readonly invoiceClient: InvoiceClientService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Full checkout flow:
   * 1. Extract order data from main (provided via request)
   * 2. Create payment in payment-service
   * 3. Process payment in payment-service
   * 4. Send payment webhook to invoice-service (creates invoice + receipt, sends via email/SMS)
   * 5. Return complete flow result
   */
  async executeCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const correlationId = uuidv4();
    const flow: string[] = [];

    this.logger.info(
      `[Orchestrator] Starting checkout flow [${correlationId}] for user ${request.userId}`,
      { amount: request.amount, method: request.method },
    );

    // Step 1: Extract data from main (data already provided via request)
    flow.push('DATA_EXTRACTED');
    this.logger.info(`[Orchestrator] Step 1: Data extracted for user ${request.userId}`);

    // Step 2: Create payment via payment-service
    flow.push('PAYMENT_CREATED');
    const payment = await this.paymentClient.createPayment(
      request.userId,
      {
        amount: request.amount,
        currency: request.currency,
        method: request.method,
        description: request.description,
        metadata: {
          ...request.metadata,
          correlationId,
          items: request.items,
        },
      },
      correlationId,
    );

    this.logger.info(`[Orchestrator] Step 2: Payment created: ${payment.id} (${payment.status})`);

    // Step 3: Process payment via payment-service
    flow.push('PAYMENT_PROCESSED');
    const processed = await this.paymentClient.processPayment(payment.id, correlationId);

    this.logger.info(
      `[Orchestrator] Step 3: Payment processed: ${payment.id} -> ${processed.status}`,
    );

    // Step 4: Send webhook to invoice-service to create invoice + receipt + send email/SMS
    flow.push('INVOICE_CREATED');
    flow.push('RECEIPT_CREATED');
    flow.push('EMAIL_SENT');
    flow.push('SMS_SENT');

    let invoiceResult: CheckoutResponse['invoice'] = null;
    let receiptResult: CheckoutResponse['receipt'] = null;

    try {
      const webhookResult = await this.invoiceClient.sendPaymentWebhook(
        {
          event: 'payment.completed',
          paymentId: payment.id,
          userId: request.userId,
          userEmail: request.userEmail,
          userPhone: request.userPhone,
          amount: request.amount,
          currency: request.currency,
          description: request.description,
          items: request.items,
        },
        correlationId,
      );

      invoiceResult = {
        id: webhookResult.invoice.id,
        invoiceNumber: webhookResult.invoice.invoiceNumber,
        status: webhookResult.invoice.status,
        total: webhookResult.invoice.total,
      };

      receiptResult = {
        id: webhookResult.receipt.id,
        receiptNumber: webhookResult.receipt.receiptNumber,
        amount: webhookResult.receipt.amount,
      };

      this.logger.info(
        `[Orchestrator] Step 4: Invoice ${invoiceResult.invoiceNumber} and receipt ${receiptResult.receiptNumber} created and sent`,
      );
    } catch (err) {
      this.logger.error(
        `[Orchestrator] Step 4: Invoice/receipt creation failed: ${(err as Error).message}. Payment was already processed.`,
      );
      flow.push('INVOICE_FAILED');
    }

    // Step 5: Audit log
    flow.push('AUDIT_LOGGED');
    this.logger.info(`[Orchestrator] Checkout flow completed [${correlationId}]`, {
      paymentId: payment.id,
      invoiceId: invoiceResult?.id,
      receiptId: receiptResult?.id,
      flow,
    });

    return {
      correlationId,
      payment: {
        id: payment.id,
        status: processed.status,
        transactionId: processed.transactionId,
        amount: request.amount,
        currency: request.currency,
        method: request.method,
      },
      invoice: invoiceResult,
      receipt: receiptResult,
      flow,
    };
  }
}
