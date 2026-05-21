import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validateCreateInvoice,
  validatePayInvoice,
  validateInvoiceId,
  validateInvoiceNumber,
  validatePagination,
} from '../validators/payment.validator';
import { logger } from '../logging/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function createInvoiceHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateInvoice(req.body);

    if (!validation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', validation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const { userId, ...data } = validation.data;
    const invoice = await invoiceService.create(userId, data);

    logger.info({ message: 'Invoice created', invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber });

    res.status(201).json(successResponse(invoice, 'Invoice created successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to create invoice', error });
    res.status(500).json(errorResponse('CREATE_INVOICE_FAILED', (error as Error).message));
  }
}

export async function listInvoicesHandler(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'User ID required'));
      return;
    }

    const paginationValidation = validatePagination(req.query);

    if (!paginationValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', paginationValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const { page, limit } = paginationValidation.data;
    const result = await invoiceService.findAll(userId, page, limit);

    res.status(200).json(
      paginatedResponse(result.items, result.total, result.page, result.limit)
    );
  } catch (error) {
    logger.error({ message: 'Failed to list invoices', error });
    res.status(500).json(errorResponse('LIST_INVOICES_FAILED', (error as Error).message));
  }
}

export async function getInvoiceHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateInvoiceId(req.params.id);

    if (!validation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', validation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const invoice = await invoiceService.findOne(req.params.id);

    if (!invoice) {
      res.status(404).json(errorResponse('INVOICE_NOT_FOUND', `Invoice with id ${req.params.id} not found`));
      return;
    }

    res.status(200).json(successResponse(invoice));
  } catch (error) {
    logger.error({ message: 'Failed to get invoice', error });
    res.status(500).json(errorResponse('GET_INVOICE_FAILED', (error as Error).message));
  }
}

export async function getInvoicePDFHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateInvoiceId(req.params.id);

    if (!validation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', validation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const invoice = await invoiceService.findOne(req.params.id);

    if (!invoice) {
      res.status(404).json(errorResponse('INVOICE_NOT_FOUND', `Invoice with id ${req.params.id} not found`));
      return;
    }

    const pdfBuffer = await invoiceService.generatePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error({ message: 'Failed to generate invoice PDF', error });
    res.status(500).json(errorResponse('GENERATE_PDF_FAILED', (error as Error).message));
  }
}

export async function payInvoiceHandler(req: Request, res: Response): Promise<void> {
  try {
    const idValidation = validateInvoiceId(req.params.id);

    if (!idValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', idValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const payValidation = validatePayInvoice(req.body);

    if (!payValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', payValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const { paymentId } = payValidation.data;
    const invoice = await invoiceService.payInvoice(req.params.id, paymentId);

    logger.info({ message: 'Invoice paid', invoiceId: invoice.id, paymentId });

    res.status(200).json(successResponse(invoice, 'Invoice marked as paid'));
  } catch (error) {
    logger.error({ message: 'Failed to pay invoice', error });
    res.status(500).json(errorResponse('PAY_INVOICE_FAILED', (error as Error).message));
  }
}

export async function getInvoiceByNumberHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateInvoiceNumber(req.params.number);

    if (!validation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', validation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const invoice = await invoiceService.findByNumber(req.params.number);

    if (!invoice) {
      res.status(404).json(errorResponse('INVOICE_NOT_FOUND', `Invoice with number ${req.params.number} not found`));
      return;
    }

    res.status(200).json(successResponse(invoice));
  } catch (error) {
    logger.error({ message: 'Failed to get invoice by number', error });
    res.status(500).json(errorResponse('GET_INVOICE_BY_NUMBER_FAILED', (error as Error).message));
  }
}
