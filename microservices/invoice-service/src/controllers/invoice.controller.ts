import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validateCreateInvoiceFromPayment,
  validateCreateReceipt,
  validatePaymentWebhook,
  validatePagination,
  validateResend,
} from '../validators/invoice.validator';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role?: string };
}
import { logger } from '../logging/logger';
import { InvoiceChannel } from '../types';

export async function createInvoiceFromPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateInvoiceFromPayment(req.body);
    if (!validation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', validation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const invoice = await invoiceService.createInvoiceFromPayment(validation.data);
    await invoiceService.sendInvoice(invoice);

    logger.info({ message: 'Invoice created and sent from payment', invoiceId: invoice.id });
    res.status(201).json(successResponse(invoice, 'Invoice created and sent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to create invoice from payment', error });
    res.status(500).json(errorResponse('CREATE_INVOICE_FAILED', (error as Error).message));
  }
}

export async function createReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateReceipt(req.body);
    if (!validation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', validation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const receipt = await invoiceService.createReceipt(validation.data);
    await invoiceService.sendReceipt(receipt);

    logger.info({ message: 'Receipt created and sent', receiptId: receipt.id });
    res.status(201).json(successResponse(receipt, 'Receipt created and sent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to create receipt', error });
    res.status(500).json(errorResponse('CREATE_RECEIPT_FAILED', (error as Error).message));
  }
}

export async function paymentWebhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePaymentWebhook(req.body);
    if (!validation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', validation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const { event, paymentId, userId, userEmail, userPhone, amount, currency, description, items } = validation.data;

    if (event === 'payment.completed') {
      const invoiceItems = items || [{ description: description || 'Payment', quantity: 1, unitPrice: amount }];

      const invoice = await invoiceService.createInvoiceFromPayment({
        userId,
        userEmail: userEmail || `${userId}@example.com`,
        userPhone: userPhone || '',
        paymentId,
        items: invoiceItems,
        tax: 0,
        discount: 0,
        currency,
        channel: InvoiceChannel.BOTH,
      });
      await invoiceService.sendInvoice(invoice);

      const receipt = await invoiceService.createReceipt({
        userId,
        userEmail: userEmail || `${userId}@example.com`,
        userPhone: userPhone || '',
        paymentId,
        invoiceId: invoice.id,
        amount,
        currency,
        description: description || 'Payment completed',
      });
      await invoiceService.sendReceipt(receipt);

      logger.info({ message: 'Payment webhook processed', paymentId, invoiceId: invoice.id, receiptId: receipt.id });
      res.status(200).json(successResponse({ invoice, receipt }, 'Payment processed successfully'));
    } else {
      logger.info({ message: 'Payment event ignored', event, paymentId });
      res.status(200).json(successResponse({ event, status: 'ignored' }));
    }
  } catch (error) {
    logger.error({ message: 'Failed to process payment webhook', error });
    res.status(500).json(errorResponse('WEBHOOK_PROCESSING_FAILED', (error as Error).message));
  }
}

export async function listInvoicesHandler(req: Request, res: Response): Promise<void> {
  try {
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', paginationValidation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }
    const result = await invoiceService.findAllInvoices(user.userId, paginationValidation.data.page, paginationValidation.data.limit);
    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list invoices', error });
    res.status(500).json(errorResponse('LIST_INVOICES_FAILED', (error as Error).message));
  }
}

export async function getInvoiceHandler(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invoice ID is required'));
      return;
    }
    const invoice = await invoiceService.findInvoice(id);
    if (!invoice) {
      res.status(404).json(errorResponse('NOT_FOUND', `Invoice ${id} not found`));
      return;
    }
    res.status(200).json(successResponse(invoice));
  } catch (error) {
    logger.error({ message: 'Failed to get invoice', error });
    res.status(500).json(errorResponse('GET_INVOICE_FAILED', (error as Error).message));
  }
}

export async function getInvoiceByNumberHandler(req: Request, res: Response): Promise<void> {
  try {
    const { number } = req.params;
    if (!number || typeof number !== 'string' || number.trim() === '') {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invoice number is required'));
      return;
    }
    const invoice = await invoiceService.findInvoiceByNumber(number);
    if (!invoice) {
      res.status(404).json(errorResponse('NOT_FOUND', `Invoice ${number} not found`));
      return;
    }
    res.status(200).json(successResponse(invoice));
  } catch (error) {
    logger.error({ message: 'Failed to get invoice by number', error });
    res.status(500).json(errorResponse('GET_INVOICE_FAILED', (error as Error).message));
  }
}

export async function listReceiptsHandler(req: Request, res: Response): Promise<void> {
  try {
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', paginationValidation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required'));
      return;
    }
    const result = await invoiceService.findAllReceipts(user.userId, paginationValidation.data.page, paginationValidation.data.limit);
    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list receipts', error });
    res.status(500).json(errorResponse('LIST_RECEIPTS_FAILED', (error as Error).message));
  }
}

export async function getReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await invoiceService.findReceipt(req.params.id);
    if (!receipt) {
      res.status(404).json(errorResponse('NOT_FOUND', `Receipt ${req.params.id} not found`));
      return;
    }
    res.status(200).json(successResponse(receipt));
  } catch (error) {
    logger.error({ message: 'Failed to get receipt', error });
    res.status(500).json(errorResponse('GET_RECEIPT_FAILED', (error as Error).message));
  }
}

export async function getReceiptByPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const receipt = await invoiceService.findReceiptByPayment(req.params.paymentId);
    if (!receipt) {
      res.status(404).json(errorResponse('NOT_FOUND', `Receipt for payment ${req.params.paymentId} not found`));
      return;
    }
    res.status(200).json(successResponse(receipt));
  } catch (error) {
    logger.error({ message: 'Failed to get receipt by payment', error });
    res.status(500).json(errorResponse('GET_RECEIPT_FAILED', (error as Error).message));
  }
}

export async function resendInvoiceHandler(req: Request, res: Response): Promise<void> {
  try {
    const invoice = await invoiceService.findInvoice(req.params.id);
    if (!invoice) {
      res.status(404).json(errorResponse('NOT_FOUND', `Invoice ${req.params.id} not found`));
      return;
    }

    const validation = validateResend(req.body);
    if (!validation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', validation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const originalChannel = invoice.channel;
    invoice.channel = validation.data.channel;
    await invoiceService.sendInvoice(invoice);
    invoice.channel = originalChannel;

    logger.info({ message: 'Invoice resent', invoiceId: invoice.id, channel: validation.data.channel });
    res.status(200).json(successResponse(invoice, 'Invoice resent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to resend invoice', error });
    res.status(500).json(errorResponse('RESEND_INVOICE_FAILED', (error as Error).message));
  }
}
