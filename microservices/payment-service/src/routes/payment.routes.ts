import { Router } from 'express';
import {
  createPaymentHandler,
  listPaymentsHandler,
  getPaymentHandler,
  processPaymentHandler,
  refundPaymentHandler,
  getPaymentStatsHandler,
} from '../controllers/payment.controller';
import { handleWebhook } from '../controllers/webhook.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

// Payment CRUD
router.post('/api/v1/payments', authMiddleware, asyncHandler(createPaymentHandler));
router.get('/api/v1/payments', authMiddleware, asyncHandler(listPaymentsHandler));
router.get('/api/v1/payments/stats', authMiddleware, asyncHandler(getPaymentStatsHandler));
router.get('/api/v1/payments/:id', authMiddleware, asyncHandler(getPaymentHandler));
router.post('/api/v1/payments/:id/process', authMiddleware, asyncHandler(processPaymentHandler));
router.post('/api/v1/payments/:id/refund', authMiddleware, asyncHandler(refundPaymentHandler));

// Webhooks (sin auth — firmados por las pasarelas)
router.post('/api/v1/webhooks/:provider', asyncHandler(handleWebhook));

export default router;
