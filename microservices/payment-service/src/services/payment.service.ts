import { v4 as uuidv4 } from 'uuid';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  Currency,
  CreatePaymentInput,
  PaginatedResult,
  PaymentFilters,
} from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

class PaymentService {
  private store = new Map<string, Payment>();

  async create(userId: string, data: CreatePaymentInput): Promise<Payment> {
    const span = tracer.startSpan('payment.create');

    try {
      span.setAttribute('userId', userId);
      span.setAttribute('amount', data.amount);
      span.setAttribute('currency', data.currency);
      span.setAttribute('method', data.method);

      const now = new Date();
      const payment: Payment = {
        id: uuidv4(),
        userId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: PaymentStatus.PENDING,
        description: data.description,
        metadata: data.metadata || {},
        transactionId: null,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
      };

      this.store.set(payment.id, payment);

      span.setAttribute('paymentId', payment.id);
      span.addEvent('Payment created successfully');

      logger.info({
        message: 'Payment created',
        paymentId: payment.id,
        userId,
        amount: data.amount,
        currency: data.currency,
      });

      return payment;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create payment', error, userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResult<Payment>> {
    const span = tracer.startSpan('payment.findAll');

    try {
      span.setAttribute('userId', userId);
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const userPayments = Array.from(this.store.values()).filter(
        (p) => p.userId === userId
      );
      const total = userPayments.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = userPayments.slice(start, end);

      span.setAttribute('total', total);
      span.setAttribute('returnedCount', items.length);
      span.addEvent('Payments retrieved successfully');

      return { items, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve payments', error, userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<Payment | null> {
    const span = tracer.startSpan('payment.findOne');

    try {
      span.setAttribute('paymentId', id);

      const payment = this.store.get(id);

      if (payment) {
        span.addEvent('Payment found');
      } else {
        span.addEvent('Payment not found');
      }

      return payment || null;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve payment', error, paymentId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async processPayment(id: string): Promise<Payment> {
    const span = tracer.startSpan('payment.processPayment');

    try {
      span.setAttribute('paymentId', id);

      const payment = this.store.get(id);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error(`Payment cannot be processed. Current status: ${payment.status}`);
      }

      payment.status = PaymentStatus.PROCESSING;
      payment.updatedAt = new Date();
      this.store.set(id, payment);

      span.addEvent('Payment processing started');

      await this.simulateProcessing();

      const success = Math.random() > 0.1;

      if (success) {
        payment.status = PaymentStatus.COMPLETED;
        payment.transactionId = this.generateTransactionId();
        payment.completedAt = new Date();
        span.addEvent('Payment completed successfully');
        span.setAttribute('transactionId', payment.transactionId);
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.errorMessage = 'Payment gateway timeout';
        span.addEvent('Payment failed');
      }

      payment.updatedAt = new Date();
      this.store.set(id, payment);

      logger.info({
        message: 'Payment processed',
        paymentId: id,
        status: payment.status,
        transactionId: payment.transactionId,
      });

      return payment;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to process payment', error, paymentId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async refundPayment(id: string, reason: string): Promise<Payment> {
    const span = tracer.startSpan('payment.refundPayment');

    try {
      span.setAttribute('paymentId', id);
      span.setAttribute('reason', reason);

      const payment = this.store.get(id);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error(`Only completed payments can be refunded. Current status: ${payment.status}`);
      }

      payment.status = PaymentStatus.REFUNDED;
      payment.metadata = { ...payment.metadata, refundReason: reason, refundedAt: new Date().toISOString() };
      payment.updatedAt = new Date();
      this.store.set(id, payment);

      span.addEvent('Payment refunded successfully');

      logger.info({
        message: 'Payment refunded',
        paymentId: id,
        reason,
      });

      return payment;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to refund payment', error, paymentId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async getUserStats(userId: string): Promise<{
    totalPayments: number;
    totalSpent: number;
    completedPayments: number;
    failedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    averageAmount: number;
    paymentsByMethod: Record<string, number>;
    paymentsByStatus: Record<string, number>;
  }> {
    const span = tracer.startSpan('payment.getUserStats');

    try {
      span.setAttribute('userId', userId);

      const userPayments = Array.from(this.store.values()).filter(
        (p) => p.userId === userId
      );

      const totalPayments = userPayments.length;
      const completedPayments = userPayments.filter((p) => p.status === PaymentStatus.COMPLETED).length;
      const failedPayments = userPayments.filter((p) => p.status === PaymentStatus.FAILED).length;
      const pendingPayments = userPayments.filter((p) => p.status === PaymentStatus.PENDING).length;
      const refundedPayments = userPayments.filter((p) => p.status === PaymentStatus.REFUNDED).length;

      const totalSpent = userPayments
        .filter((p) => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);

      const averageAmount = totalPayments > 0 ? totalSpent / totalPayments : 0;

      const paymentsByMethod: Record<string, number> = {};
      const paymentsByStatus: Record<string, number> = {};

      for (const payment of userPayments) {
        paymentsByMethod[payment.method] = (paymentsByMethod[payment.method] || 0) + 1;
        paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
      }

      span.setAttribute('totalPayments', totalPayments);
      span.addEvent('User stats retrieved');

      return {
        totalPayments,
        totalSpent,
        completedPayments,
        failedPayments,
        pendingPayments,
        refundedPayments,
        averageAmount,
        paymentsByMethod,
        paymentsByStatus,
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to get user stats', error, userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findByFilters(filters: PaymentFilters, page = 1, limit = 10): Promise<PaginatedResult<Payment>> {
    const span = tracer.startSpan('payment.findByFilters');

    try {
      let payments = Array.from(this.store.values());

      if (filters.userId) {
        payments = payments.filter((p) => p.userId === filters.userId);
      }
      if (filters.status) {
        payments = payments.filter((p) => p.status === filters.status);
      }
      if (filters.method) {
        payments = payments.filter((p) => p.method === filters.method);
      }
      if (filters.currency) {
        payments = payments.filter((p) => p.currency === filters.currency);
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        payments = payments.filter((p) => p.createdAt >= from);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        payments = payments.filter((p) => p.createdAt <= to);
      }
      if (filters.minAmount !== undefined) {
        payments = payments.filter((p) => p.amount >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        payments = payments.filter((p) => p.amount <= filters.maxAmount!);
      }

      const total = payments.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = payments.slice(start, end);

      span.setAttribute('total', total);
      span.addEvent('Filtered payments retrieved');

      return { items, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to find payments by filters', error });
      throw error;
    } finally {
      span.end();
    }
  }

  generateTransactionId(): string {
    return `txn_${Date.now()}_${uuidv4().slice(0, 8)}`;
  }

  private simulateProcessing(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 500 + 100);
    });
  }

  getAllPayments(): Payment[] {
    return Array.from(this.store.values());
  }
}

export const paymentService = new PaymentService();
