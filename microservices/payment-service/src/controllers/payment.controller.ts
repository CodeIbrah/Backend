import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { receiptService } from '../services/receipt.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validateCreatePayment,
  validateProcessPayment,
  validateRefundPayment,
  validatePaymentId,
  validatePagination,
} from '../validators/payment.validator';
import { logger } from '../logging/logger';
import { PaymentStatus } from '../types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function createPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreatePayment(req.body);

    if (!validation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', validation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const { userId, ...data } = validation.data;
    const payment = await paymentService.create(userId, data);

    logger.info({ message: 'Payment created', paymentId: payment.id });

    res.status(201).json(successResponse(payment, 'Payment created successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to create payment', error });
    res.status(500).json(errorResponse('CREATE_PAYMENT_FAILED', (error as Error).message));
  }
}

export async function listPaymentsHandler(req: Request, res: Response): Promise<void> {
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
    const result = await paymentService.findAll(userId, page, limit);

    res.status(200).json(
      paginatedResponse(result.items, result.total, result.page, result.limit)
    );
  } catch (error) {
    logger.error({ message: 'Failed to list payments', error });
    res.status(500).json(errorResponse('LIST_PAYMENTS_FAILED', (error as Error).message));
  }
}

export async function getPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePaymentId(req.params.id);

    if (!validation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', validation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const payment = await paymentService.findOne(req.params.id);

    if (!payment) {
      res.status(404).json(errorResponse('PAYMENT_NOT_FOUND', `Payment with id ${req.params.id} not found`));
      return;
    }

    res.status(200).json(successResponse(payment));
  } catch (error) {
    logger.error({ message: 'Failed to get payment', error });
    res.status(500).json(errorResponse('GET_PAYMENT_FAILED', (error as Error).message));
  }
}

export async function processPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const idValidation = validatePaymentId(req.params.id);

    if (!idValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', idValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const processValidation = validateProcessPayment(req.body);

    if (!processValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', processValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const payment = await paymentService.processPayment(req.params.id);

    if (payment.status === PaymentStatus.COMPLETED) {
      await receiptService.create(payment.id, null, {
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        description: payment.description,
      });
    }

    logger.info({ message: 'Payment processed', paymentId: payment.id, status: payment.status });

    res.status(200).json(successResponse(payment, `Payment ${payment.status.toLowerCase()}`));
  } catch (error) {
    logger.error({ message: 'Failed to process payment', error });
    res.status(500).json(errorResponse('PROCESS_PAYMENT_FAILED', (error as Error).message));
  }
}

export async function refundPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const idValidation = validatePaymentId(req.params.id);

    if (!idValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', idValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const refundValidation = validateRefundPayment(req.body);

    if (!refundValidation.success) {
      res.status(400).json(
        errorResponse('VALIDATION_ERROR', refundValidation.error.errors.map((e) => e.message).join(', '))
      );
      return;
    }

    const { reason } = refundValidation.data;
    const payment = await paymentService.refundPayment(req.params.id, reason);

    logger.info({ message: 'Payment refunded', paymentId: payment.id, reason });

    res.status(200).json(successResponse(payment, 'Payment refunded successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to refund payment', error });
    res.status(500).json(errorResponse('REFUND_PAYMENT_FAILED', (error as Error).message));
  }
}

export async function getPaymentStatsHandler(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'User ID required'));
      return;
    }

    const stats = await paymentService.getUserStats(userId);

    res.status(200).json(successResponse(stats));
  } catch (error) {
    logger.error({ message: 'Failed to get payment stats', error });
    res.status(500).json(errorResponse('GET_PAYMENT_STATS_FAILED', (error as Error).message));
  }
}
