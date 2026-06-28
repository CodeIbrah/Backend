import { Request, Response } from 'express';
import { receiptService } from '../services/receipt.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validateReceiptId,
  validatePaymentId,
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

export async function listReceiptsHandler(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'User ID required'));
      return;
    }

    const paginationValidation = validatePagination(req.query);

    if (!paginationValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            paginationValidation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const { page, limit } = paginationValidation.data;
    const result = await receiptService.findAll(userId, page, limit);

    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list receipts', error });
    res.status(500).json(errorResponse('LIST_RECEIPTS_FAILED', (error as Error).message));
  }
}

export async function getReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateReceiptId(req.params.id);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const receipt = await receiptService.findOne(req.params.id);

    if (!receipt) {
      res
        .status(404)
        .json(errorResponse('RECEIPT_NOT_FOUND', `Receipt with id ${req.params.id} not found`));
      return;
    }

    res.status(200).json(successResponse(receipt));
  } catch (error) {
    logger.error({ message: 'Failed to get receipt', error });
    res.status(500).json(errorResponse('GET_RECEIPT_FAILED', (error as Error).message));
  }
}

export async function getReceiptPDFHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateReceiptId(req.params.id);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const receipt = await receiptService.findOne(req.params.id);

    if (!receipt) {
      res
        .status(404)
        .json(errorResponse('RECEIPT_NOT_FOUND', `Receipt with id ${req.params.id} not found`));
      return;
    }

    const pdfBuffer = await receiptService.generatePDF(receipt);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${receipt.receiptNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error({ message: 'Failed to generate receipt PDF', error });
    res.status(500).json(errorResponse('GENERATE_PDF_FAILED', (error as Error).message));
  }
}

export async function getReceiptByPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePaymentId(req.params.paymentId);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const receipt = await receiptService.findByPaymentId(req.params.paymentId);

    if (!receipt) {
      res
        .status(404)
        .json(
          errorResponse(
            'RECEIPT_NOT_FOUND',
            `Receipt for payment ${req.params.paymentId} not found`,
          ),
        );
      return;
    }

    res.status(200).json(successResponse(receipt));
  } catch (error) {
    logger.error({ message: 'Failed to get receipt by payment', error });
    res.status(500).json(errorResponse('GET_RECEIPT_BY_PAYMENT_FAILED', (error as Error).message));
  }
}
