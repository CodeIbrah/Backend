import {
  Payment,
  Invoice,
  AdminPaymentStats,
  PaymentStatus,
  PaymentMethod,
  Currency,
  InvoiceStatus,
  PaginatedResult,
  PaymentFilters,
  InvoiceFilters,
  RevenueReport,
} from '../types';
import { paymentService } from './payment.service';
import { invoiceService } from './invoice.service';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

class AdminService {
  async getAllPayments(
    page = 1,
    limit = 10,
    filters: PaymentFilters = {},
  ): Promise<PaginatedResult<Payment>> {
    const span = tracer.startSpan('admin.getAllPayments');

    try {
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const result = await paymentService.findByFilters(filters, page, limit);

      span.setAttribute('total', result.total);
      span.addEvent('All payments retrieved');

      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to get all payments', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async getAllInvoices(
    page = 1,
    limit = 10,
    filters: InvoiceFilters = {},
  ): Promise<PaginatedResult<Invoice>> {
    const span = tracer.startSpan('admin.getAllInvoices');

    try {
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const result = await invoiceService.findByFilters(filters, page, limit);

      span.setAttribute('total', result.total);
      span.addEvent('All invoices retrieved');

      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to get all invoices', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async getPaymentStats(): Promise<AdminPaymentStats> {
    const span = tracer.startSpan('admin.getPaymentStats');

    try {
      const payments = paymentService.getAllPayments();

      const totalPayments = payments.length;
      const totalRevenue = payments
        .filter((p) => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);
      const totalRefunds = payments
        .filter((p) => p.status === PaymentStatus.REFUNDED)
        .reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = payments.filter((p) => p.status === PaymentStatus.PENDING).length;
      const failedPayments = payments.filter((p) => p.status === PaymentStatus.FAILED).length;
      const averagePaymentAmount = totalPayments > 0 ? totalRevenue / totalPayments : 0;

      const paymentsByStatus: Record<string, number> = {};
      const paymentsByMethod: Record<string, number> = {};
      const revenueByCurrency: Record<string, number> = {};

      for (const payment of payments) {
        paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
        paymentsByMethod[payment.method] = (paymentsByMethod[payment.method] || 0) + 1;

        if (payment.status === PaymentStatus.COMPLETED) {
          revenueByCurrency[payment.currency] =
            (revenueByCurrency[payment.currency] || 0) + payment.amount;
        }
      }

      const dailyRevenue = this.calculateDailyRevenue(payments);

      span.setAttribute('totalPayments', totalPayments);
      span.setAttribute('totalRevenue', totalRevenue);
      span.addEvent('Payment stats retrieved');

      return {
        totalPayments,
        totalRevenue,
        totalRefunds,
        pendingPayments,
        failedPayments,
        averagePaymentAmount,
        paymentsByStatus,
        paymentsByMethod,
        revenueByCurrency,
        dailyRevenue,
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to get payment stats', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async getRevenueReport(dateFrom: string, dateTo: string): Promise<RevenueReport> {
    const span = tracer.startSpan('admin.getRevenueReport');

    try {
      span.setAttribute('dateFrom', dateFrom);
      span.setAttribute('dateTo', dateTo);

      const payments = paymentService.getAllPayments();
      const from = new Date(dateFrom);
      const to = new Date(dateTo);

      const filteredPayments = payments.filter((p) => p.createdAt >= from && p.createdAt <= to);

      const completedPayments = filteredPayments.filter(
        (p) => p.status === PaymentStatus.COMPLETED,
      );
      const refundedPayments = filteredPayments.filter((p) => p.status === PaymentStatus.REFUNDED);

      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRefunds = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
      const netRevenue = totalRevenue - totalRefunds;
      const transactionCount = completedPayments.length;
      const refundCount = refundedPayments.length;
      const averageTransactionAmount = transactionCount > 0 ? totalRevenue / transactionCount : 0;

      const revenueByCurrency: Record<string, number> = {};
      const revenueByMethod: Record<string, number> = {};

      for (const payment of completedPayments) {
        revenueByCurrency[payment.currency] =
          (revenueByCurrency[payment.currency] || 0) + payment.amount;
        revenueByMethod[payment.method] = (revenueByMethod[payment.method] || 0) + payment.amount;
      }

      const dailyBreakdown = this.calculateDailyBreakdown(filteredPayments, from, to);

      span.addEvent('Revenue report generated');

      return {
        dateFrom,
        dateTo,
        totalRevenue,
        totalRefunds,
        netRevenue,
        transactionCount,
        refundCount,
        averageTransactionAmount,
        revenueByCurrency,
        revenueByMethod,
        dailyBreakdown,
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to get revenue report', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async exportPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
    const span = tracer.startSpan('admin.exportPayments');

    try {
      const result = await paymentService.findByFilters(filters, 1, 10000);

      span.setAttribute('exportCount', result.total);
      span.addEvent('Payments exported');

      return result.items;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to export payments', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async forceCompletePayment(id: string): Promise<Payment> {
    const span = tracer.startSpan('admin.forceCompletePayment');

    try {
      span.setAttribute('paymentId', id);

      const payment = await paymentService.findOne(id);
      if (!payment) {
        throw new Error('Payment not found');
      }

      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = paymentService.generateTransactionId();
      payment.completedAt = new Date();
      payment.updatedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        forceCompletedBy: 'admin',
        forceCompletedAt: new Date().toISOString(),
      };

      span.addEvent('Payment force completed');

      logger.warn({
        message: 'Payment force completed by admin',
        paymentId: id,
        transactionId: payment.transactionId,
      });

      return payment;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to force complete payment', error, paymentId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async forceRefundPayment(id: string, reason: string): Promise<Payment> {
    const span = tracer.startSpan('admin.forceRefundPayment');

    try {
      span.setAttribute('paymentId', id);
      span.setAttribute('reason', reason);

      const payment = await paymentService.findOne(id);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error(
          `Only completed payments can be refunded. Current status: ${payment.status}`,
        );
      }

      payment.status = PaymentStatus.REFUNDED;
      payment.updatedAt = new Date();
      payment.metadata = {
        ...payment.metadata,
        refundReason: reason,
        forceRefundedBy: 'admin',
        forceRefundedAt: new Date().toISOString(),
      };

      span.addEvent('Payment force refunded');

      logger.warn({
        message: 'Payment force refunded by admin',
        paymentId: id,
        reason,
      });

      return payment;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to force refund payment', error, paymentId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  private calculateDailyRevenue(
    payments: Payment[],
  ): Array<{ date: string; amount: number; count: number }> {
    const dailyMap = new Map<string, { amount: number; count: number }>();

    for (const payment of payments) {
      if (payment.status !== PaymentStatus.COMPLETED) continue;

      const date = payment.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { amount: 0, count: 0 };
      dailyMap.set(date, {
        amount: existing.amount + payment.amount,
        count: existing.count + 1,
      });
    }

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateDailyBreakdown(
    payments: Payment[],
    from: Date,
    to: Date,
  ): Array<{ date: string; revenue: number; refunds: number; net: number; count: number }> {
    const dailyMap = new Map<string, { revenue: number; refunds: number; count: number }>();

    const current = new Date(from);
    while (current <= to) {
      const dateStr = current.toISOString().split('T')[0];
      dailyMap.set(dateStr, { revenue: 0, refunds: 0, count: 0 });
      current.setDate(current.getDate() + 1);
    }

    for (const payment of payments) {
      const date = payment.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { revenue: 0, refunds: 0, count: 0 };

      if (payment.status === PaymentStatus.COMPLETED) {
        existing.revenue += payment.amount;
        existing.count++;
      } else if (payment.status === PaymentStatus.REFUNDED) {
        existing.refunds += payment.amount;
      }

      dailyMap.set(date, existing);
    }

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        refunds: data.refunds,
        net: data.revenue - data.refunds,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const adminService = new AdminService();
