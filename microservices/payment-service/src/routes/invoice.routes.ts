import { Router } from 'express';
import {
  createInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  getInvoicePDFHandler,
  payInvoiceHandler,
  getInvoiceByNumberHandler,
  resendInvoiceHandler,
} from '../controllers/invoice.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/api/v1/invoices', authMiddleware, createInvoiceHandler);
router.get('/api/v1/invoices', authMiddleware, listInvoicesHandler);
router.get('/api/v1/invoices/:number', authMiddleware, getInvoiceByNumberHandler);
router.get('/api/v1/invoices/:id', authMiddleware, getInvoiceHandler);
router.get('/api/v1/invoices/:id/pdf', authMiddleware, getInvoicePDFHandler);
router.post('/api/v1/invoices/:id/pay', authMiddleware, payInvoiceHandler);
router.post('/api/v1/invoices/:id/resend', authMiddleware, resendInvoiceHandler);

export default router;
