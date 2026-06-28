import { v4 as uuidv4 } from 'uuid';
import { Receipt, PaymentStatus, Currency, PaymentMethod, PaginatedResult } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';
import { generateReceiptPDF } from '../utils/pdf-generator';

interface CreateReceiptInput {
  userId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  description: string;
}

class ReceiptService {
  private store = new Map<string, Receipt>();
  private receiptCounter = 5000;

  async create(
    paymentId: string,
    invoiceId: string | null,
    data: CreateReceiptInput,
  ): Promise<Receipt> {
    const span = tracer.startSpan('receipt.create');

    try {
      span.setAttribute('paymentId', paymentId);
      span.setAttribute('userId', data.userId);
      span.setAttribute('amount', data.amount);

      const now = new Date();
      const receipt: Receipt = {
        id: uuidv4(),
        paymentId,
        invoiceId,
        userId: data.userId,
        receiptNumber: this.generateReceiptNumber(),
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: PaymentStatus.COMPLETED,
        description: data.description,
        issuedAt: now,
        pdfUrl: null,
      };

      this.store.set(receipt.id, receipt);

      span.setAttribute('receiptId', receipt.id);
      span.setAttribute('receiptNumber', receipt.receiptNumber);
      span.addEvent('Receipt created successfully');

      logger.info({
        message: 'Receipt created',
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
        paymentId,
        userId: data.userId,
      });

      return receipt;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create receipt', error, paymentId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAll(userId: string, page = 1, limit = 10): Promise<PaginatedResult<Receipt>> {
    const span = tracer.startSpan('receipt.findAll');

    try {
      span.setAttribute('userId', userId);
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const userReceipts = Array.from(this.store.values()).filter((r) => r.userId === userId);
      const total = userReceipts.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = userReceipts.slice(start, end);

      span.setAttribute('total', total);
      span.setAttribute('returnedCount', items.length);
      span.addEvent('Receipts retrieved successfully');

      return { items, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve receipts', error, userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<Receipt | null> {
    const span = tracer.startSpan('receipt.findOne');

    try {
      span.setAttribute('receiptId', id);

      const receipt = this.store.get(id);

      if (receipt) {
        span.addEvent('Receipt found');
      } else {
        span.addEvent('Receipt not found');
      }

      return receipt || null;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve receipt', error, receiptId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async findByPaymentId(paymentId: string): Promise<Receipt | null> {
    const span = tracer.startSpan('receipt.findByPaymentId');

    try {
      span.setAttribute('paymentId', paymentId);

      const receipt = Array.from(this.store.values()).find((r) => r.paymentId === paymentId);

      if (receipt) {
        span.addEvent('Receipt found by payment ID');
      } else {
        span.addEvent('Receipt not found by payment ID');
      }

      return receipt || null;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to find receipt by payment ID', error, paymentId });
      throw error;
    } finally {
      span.end();
    }
  }

  async generatePDF(receipt: Receipt): Promise<Buffer> {
    const span = tracer.startSpan('receipt.generatePDF');

    try {
      span.setAttribute('receiptId', receipt.id);
      span.addEvent('Generating PDF');

      const pdfBuffer = await generateReceiptPDF(receipt);

      span.setAttribute('pdfSize', pdfBuffer.length);
      span.addEvent('PDF generated successfully');

      logger.info({
        message: 'Receipt PDF generated',
        receiptId: receipt.id,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to generate receipt PDF', error, receiptId: receipt.id });
      throw error;
    } finally {
      span.end();
    }
  }

  generateReceiptNumber(): string {
    this.receiptCounter++;
    const year = new Date().getFullYear();
    return `RCP-${year}-${String(this.receiptCounter).padStart(6, '0')}`;
  }
}

export const receiptService = new ReceiptService();
