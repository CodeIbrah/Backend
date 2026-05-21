import { Router } from 'express';
import {
  getAllPaymentsHandler,
  getAdminPaymentHandler,
  getPaymentStatsHandler,
  exportPaymentsHandler,
  getAllInvoicesHandler,
  getInvoiceStatsHandler,
  getRevenueReportHandler,
  forceCompletePaymentHandler,
  forceRefundPaymentHandler,
  getAuditLogsHandler,
} from '../controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/api/v1/admin/payments', authMiddleware, adminMiddleware, getAllPaymentsHandler);
router.get('/api/v1/admin/payments/:id', authMiddleware, adminMiddleware, getAdminPaymentHandler);
router.get('/api/v1/admin/payments/stats', authMiddleware, adminMiddleware, getPaymentStatsHandler);
router.get('/api/v1/admin/payments/export', authMiddleware, adminMiddleware, exportPaymentsHandler);
router.post('/api/v1/admin/payments/:id/force-complete', authMiddleware, adminMiddleware, forceCompletePaymentHandler);
router.post('/api/v1/admin/payments/:id/force-refund', authMiddleware, adminMiddleware, forceRefundPaymentHandler);
router.get('/api/v1/admin/invoices', authMiddleware, adminMiddleware, getAllInvoicesHandler);
router.get('/api/v1/admin/invoices/stats', authMiddleware, adminMiddleware, getInvoiceStatsHandler);
router.get('/api/v1/admin/revenue', authMiddleware, adminMiddleware, getRevenueReportHandler);
router.get('/api/v1/admin/audit-logs', authMiddleware, adminMiddleware, getAuditLogsHandler);

export default router;
