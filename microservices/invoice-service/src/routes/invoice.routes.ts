import { Router } from 'express';
import {
  createInvoiceFromPaymentHandler,
  createReceiptHandler,
  paymentWebhookHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  getInvoiceByNumberHandler,
  listReceiptsHandler,
  getReceiptHandler,
  getReceiptByPaymentHandler,
  resendInvoiceHandler,
} from '../controllers/invoice.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/api/v1/invoices/from-payment', authMiddleware, createInvoiceFromPaymentHandler);
router.post('/api/v1/invoices/receipts', authMiddleware, createReceiptHandler);
router.post('/api/v1/invoices/webhook', paymentWebhookHandler);
router.get('/api/v1/invoices', authMiddleware, listInvoicesHandler);
router.get('/api/v1/invoices/number/:number', authMiddleware, getInvoiceByNumberHandler);
router.get('/api/v1/invoices/:id', authMiddleware, getInvoiceHandler);
router.post('/api/v1/invoices/:id/resend', authMiddleware, resendInvoiceHandler);
router.get('/api/v1/receipts', authMiddleware, listReceiptsHandler);
router.get('/api/v1/receipts/:id', authMiddleware, getReceiptHandler);
router.get('/api/v1/receipts/payment/:paymentId', authMiddleware, getReceiptByPaymentHandler);

export default router;
