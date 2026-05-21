import { Router } from 'express';
import {
  listReceiptsHandler,
  getReceiptHandler,
  getReceiptPDFHandler,
  getReceiptByPaymentHandler,
} from '../controllers/receipt.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/api/v1/receipts', authMiddleware, listReceiptsHandler);
router.get('/api/v1/receipts/:id', authMiddleware, getReceiptHandler);
router.get('/api/v1/receipts/:id/pdf', authMiddleware, getReceiptPDFHandler);
router.get('/api/v1/receipts/payment/:paymentId', authMiddleware, getReceiptByPaymentHandler);

export default router;
