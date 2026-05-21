import { Router } from 'express';
import {
  createPaymentHandler,
  listPaymentsHandler,
  getPaymentHandler,
  processPaymentHandler,
  refundPaymentHandler,
  getPaymentStatsHandler,
} from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/api/v1/payments', authMiddleware, createPaymentHandler);
router.get('/api/v1/payments', authMiddleware, listPaymentsHandler);
router.get('/api/v1/payments/stats', authMiddleware, getPaymentStatsHandler);
router.get('/api/v1/payments/:id', authMiddleware, getPaymentHandler);
router.post('/api/v1/payments/:id/process', authMiddleware, processPaymentHandler);
router.post('/api/v1/payments/:id/refund', authMiddleware, refundPaymentHandler);

export default router;
