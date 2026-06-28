import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validatePagination,
  validatePaymentFilters,
  validateInvoiceFilters,
  validateRevenueReport,
  validatePaymentId,
  validateRefundPayment,
} from '../validators/payment.validator';
import { logger } from '../logging/logger';

interface AuditLogEntry {
  timestamp: string;
  action: string;
  adminUserId: string;
  adminEmail: string;
  ipAddress: string;
  userAgent: string;
  targetId: string;
  details: Record<string, any>;
}

const auditLogs: AuditLogEntry[] = [];

function logAuditAction(
  req: Request,
  action: string,
  targetId: string,
  details: Record<string, any>,
): void {
  const user = (req as Request & { user?: { id: string; email: string; role: string } }).user;
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    adminUserId: user?.id || 'unknown',
    adminEmail: user?.email || 'unknown',
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    targetId,
    details,
  };
  auditLogs.push(entry);
  logger.info({ message: `AUDIT: ${action}`, ...entry });

  if (auditLogs.length > 10000) {
    auditLogs.splice(0, 5000);
  }
}

export async function getAllPaymentsHandler(req: Request, res: Response): Promise<void> {
  try {
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

    const filtersValidation = validatePaymentFilters(req.query);

    if (!filtersValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            filtersValidation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const { page, limit } = paginationValidation.data;
    const filters = filtersValidation.success ? filtersValidation.data : {};
    const result = await adminService.getAllPayments(page, limit, filters);

    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to get all payments', error });
    res.status(500).json(errorResponse('GET_ALL_PAYMENTS_FAILED', (error as Error).message));
  }
}

export async function getAdminPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePaymentId(req.params.id);

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

    const { paymentService } = await import('../services/payment.service');
    const payment = await paymentService.findOne(req.params.id);

    if (!payment) {
      res
        .status(404)
        .json(errorResponse('PAYMENT_NOT_FOUND', `Payment with id ${req.params.id} not found`));
      return;
    }

    res.status(200).json(successResponse(payment));
  } catch (error) {
    logger.error({ message: 'Failed to get payment', error });
    res.status(500).json(errorResponse('GET_PAYMENT_FAILED', (error as Error).message));
  }
}

export async function getPaymentStatsHandler(req: Request, res: Response): Promise<void> {
  try {
    const stats = await adminService.getPaymentStats();

    res.status(200).json(successResponse(stats));
  } catch (error) {
    logger.error({ message: 'Failed to get payment stats', error });
    res.status(500).json(errorResponse('GET_PAYMENT_STATS_FAILED', (error as Error).message));
  }
}

export async function exportPaymentsHandler(req: Request, res: Response): Promise<void> {
  try {
    const filtersValidation = validatePaymentFilters(req.query);

    if (!filtersValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            filtersValidation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const filters = filtersValidation.success ? filtersValidation.data : {};
    const payments = await adminService.exportPayments(filters);

    const csvHeader =
      'ID,User ID,Amount,Currency,Method,Status,Description,Transaction ID,Created At\n';
    const csvRows = payments
      .map(
        (p) =>
          `${p.id},${p.userId},${p.amount},${p.currency},${p.method},${p.status},"${p.description.replace(/"/g, '""')}",${p.transactionId || ''},${p.createdAt.toISOString()}`,
      )
      .join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments_export.csv"');
    res.send(csv);
  } catch (error) {
    logger.error({ message: 'Failed to export payments', error });
    res.status(500).json(errorResponse('EXPORT_PAYMENTS_FAILED', (error as Error).message));
  }
}

export async function getAllInvoicesHandler(req: Request, res: Response): Promise<void> {
  try {
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

    const filtersValidation = validateInvoiceFilters(req.query);

    if (!filtersValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            filtersValidation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const { page, limit } = paginationValidation.data;
    const filters = filtersValidation.success ? filtersValidation.data : {};
    const result = await adminService.getAllInvoices(page, limit, filters);

    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to get all invoices', error });
    res.status(500).json(errorResponse('GET_ALL_INVOICES_FAILED', (error as Error).message));
  }
}

export async function getInvoiceStatsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { invoiceService } = await import('../services/invoice.service');
    const invoices = invoiceService.getAllInvoices();

    const totalInvoices = invoices.length;
    const totalValue = invoices.reduce((sum, i) => sum + i.total, 0);
    const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE').length;
    const draftInvoices = invoices.filter((i) => i.status === 'DRAFT').length;
    const cancelledInvoices = invoices.filter((i) => i.status === 'CANCELLED').length;

    const statusBreakdown: Record<string, number> = {};
    const currencyBreakdown: Record<string, number> = {};

    for (const invoice of invoices) {
      statusBreakdown[invoice.status] = (statusBreakdown[invoice.status] || 0) + 1;
      currencyBreakdown[invoice.currency] =
        (currencyBreakdown[invoice.currency] || 0) + invoice.total;
    }

    const stats = {
      totalInvoices,
      totalValue,
      paidInvoices,
      overdueInvoices,
      draftInvoices,
      cancelledInvoices,
      statusBreakdown,
      currencyBreakdown,
    };

    res.status(200).json(successResponse(stats));
  } catch (error) {
    logger.error({ message: 'Failed to get invoice stats', error });
    res.status(500).json(errorResponse('GET_INVOICE_STATS_FAILED', (error as Error).message));
  }
}

export async function getRevenueReportHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateRevenueReport(req.query);

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

    const { dateFrom, dateTo } = validation.data;
    const report = await adminService.getRevenueReport(dateFrom, dateTo);

    res.status(200).json(successResponse(report));
  } catch (error) {
    logger.error({ message: 'Failed to get revenue report', error });
    res.status(500).json(errorResponse('GET_REVENUE_REPORT_FAILED', (error as Error).message));
  }
}

export async function forceCompletePaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePaymentId(req.params.id);

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

    const payment = await adminService.forceCompletePayment(req.params.id);

    logAuditAction(req, 'FORCE_COMPLETE_PAYMENT', payment.id, {
      previousStatus: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    });

    res.status(200).json(successResponse(payment, 'Payment force completed'));
  } catch (error) {
    logger.error({ message: 'Failed to force complete payment', error });
    res.status(500).json(errorResponse('FORCE_COMPLETE_FAILED', (error as Error).message));
  }
}

export async function forceRefundPaymentHandler(req: Request, res: Response): Promise<void> {
  try {
    const idValidation = validatePaymentId(req.params.id);

    if (!idValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            idValidation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const refundValidation = validateRefundPayment(req.body);

    if (!refundValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            refundValidation.error.errors.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const { reason } = refundValidation.data;
    const payment = await adminService.forceRefundPayment(req.params.id, reason);

    logAuditAction(req, 'FORCE_REFUND_PAYMENT', payment.id, {
      reason,
      amount: payment.amount,
      currency: payment.currency,
    });

    res.status(200).json(successResponse(payment, 'Payment force refunded'));
  } catch (error) {
    logger.error({ message: 'Failed to force refund payment', error });
    res.status(500).json(errorResponse('FORCE_REFUND_FAILED', (error as Error).message));
  }
}

export async function getAuditLogsHandler(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const actionFilter = req.query.action as string | undefined;

    let logs = [...auditLogs].reverse();

    if (actionFilter) {
      logs = logs.filter((l) => l.action === actionFilter);
    }

    logs = logs.slice(0, limit);

    res.status(200).json(successResponse({ logs, total: logs.length }));
  } catch (error) {
    logger.error({ message: 'Failed to get audit logs', error });
    res.status(500).json(errorResponse('GET_AUDIT_LOGS_FAILED', (error as Error).message));
  }
}
