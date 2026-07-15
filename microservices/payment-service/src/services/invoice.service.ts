import { v4 as uuidv4 } from 'uuid';
import {
  Invoice,
  Receipt,
  InvoiceStatus,
  Currency,
  InvoiceItem,
  InvoiceChannel,
  CreateInvoiceInput,
  PaginatedResult,
  InvoiceFilters,
} from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';
import { generateInvoicePDF, generateReceiptPDF } from '../utils/pdf-generator';
import { deliveryService } from './delivery.service';

class InvoiceService {
  private store = new Map<string, Invoice>();
  private receiptStore = new Map<string, Receipt>();
  private invoiceCounter = 2000;
  private receiptCounter = 8000;

  async create(userId: string, data: CreateInvoiceInput): Promise<Invoice> {
    const span = tracer.startSpan('invoice.create');

    try {
      span.setAttribute('userId', userId);

      const items: InvoiceItem[] = data.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = data.tax || 0;
      const discount = data.discount || 0;
      const total = subtotal + tax - discount;

      const now = new Date();
      const dueDate = data.dueDate
        ? new Date(data.dueDate)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const invoice: Invoice = {
        id: uuidv4(),
        invoiceNumber: this.generateInvoiceNumber(),
        userId,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        paymentId: null,
        items,
        subtotal,
        tax,
        discount,
        total,
        currency: data.currency || Currency.USD,
        status: InvoiceStatus.ISSUED,
        channel: data.channel || InvoiceChannel.EMAIL,
        notes: data.notes || null,
        issuedAt: now,
        dueDate,
        paidAt: null,
        sentAt: null,
        createdAt: now,
        updatedAt: now,
      };

      this.store.set(invoice.id, invoice);

      span.setAttribute('invoiceId', invoice.id);
      span.setAttribute('invoiceNumber', invoice.invoiceNumber);
      span.setAttribute('total', total);
      span.addEvent('Invoice created successfully');

      logger.info({
        message: 'Invoice created',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId,
        total,
      });

      return invoice;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create invoice', error, userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAll(userId: string, page = 1, limit = 10): Promise<PaginatedResult<Invoice>> {
    const span = tracer.startSpan('invoice.findAll');

    try {
      span.setAttribute('userId', userId);
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const userInvoices = Array.from(this.store.values()).filter((i) => i.userId === userId);
      const total = userInvoices.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = userInvoices.slice(start, end);

      span.setAttribute('total', total);
      span.setAttribute('returnedCount', items.length);
      span.addEvent('Invoices retrieved successfully');

      return { items, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve invoices', error, userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<Invoice | null> {
    const span = tracer.startSpan('invoice.findOne');

    try {
      span.setAttribute('invoiceId', id);

      const invoice = this.store.get(id);

      if (invoice) {
        span.addEvent('Invoice found');
      } else {
        span.addEvent('Invoice not found');
      }

      return invoice || null;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve invoice', error, invoiceId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async findByNumber(number: string): Promise<Invoice | null> {
    const span = tracer.startSpan('invoice.findByNumber');

    try {
      span.setAttribute('invoiceNumber', number);

      const invoice = Array.from(this.store.values()).find((i) => i.invoiceNumber === number);

      if (invoice) {
        span.addEvent('Invoice found by number');
      } else {
        span.addEvent('Invoice not found by number');
      }

      return invoice || null;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to find invoice by number', error, invoiceNumber: number });
      throw error;
    } finally {
      span.end();
    }
  }

  async payInvoice(id: string, paymentId: string): Promise<Invoice> {
    const span = tracer.startSpan('invoice.payInvoice');

    try {
      span.setAttribute('invoiceId', id);
      span.setAttribute('paymentId', paymentId);

      const invoice = this.store.get(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error('Invoice is already paid');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error('Cannot pay a cancelled invoice');
      }

      invoice.status = InvoiceStatus.PAID;
      invoice.paymentId = paymentId;
      invoice.paidAt = new Date();
      invoice.updatedAt = new Date();
      this.store.set(id, invoice);

      span.addEvent('Invoice marked as paid');

      logger.info({
        message: 'Invoice paid',
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        paymentId,
      });

      // Auto-create receipt and send via delivery service
      try {
        const receipt = await this.createReceipt({
          userId: invoice.userId,
          userEmail: invoice.userEmail,
          userPhone: invoice.userPhone,
          paymentId,
          invoiceId: invoice.id,
          amount: invoice.total,
          currency: invoice.currency,
          description: `Payment for invoice ${invoice.invoiceNumber}`,
        });
        await deliveryService.sendInvoice(invoice);
        await deliveryService.sendReceipt(receipt);
      } catch (deliveryError) {
        logger.error({
          message: 'Failed to send invoice/receipt after payment',
          error: deliveryError,
          invoiceId: id,
          paymentId,
        });
      }

      return invoice;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to pay invoice', error, invoiceId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async createReceipt(data: {
    userId: string;
    userEmail?: string;
    userPhone?: string;
    paymentId: string;
    invoiceId: string;
    amount: number;
    currency: Currency;
    description: string;
  }): Promise<Receipt> {
    const span = tracer.startSpan('invoice.createReceipt');
    try {
      span.setAttribute('paymentId', data.paymentId);
      span.setAttribute('userId', data.userId);

      const receipt: Receipt = {
        id: uuidv4(),
        receiptNumber: this.generateReceiptNumber(),
        invoiceId: data.invoiceId,
        paymentId: data.paymentId,
        userId: data.userId,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        amount: data.amount,
        currency: data.currency,
        method: undefined as any,
        status: undefined as any,
        description: data.description,
        issuedAt: new Date(),
        pdfUrl: null,
        sentAt: null,
      };

      this.receiptStore.set(receipt.id, receipt);
      span.setAttribute('receiptId', receipt.id);
      span.setAttribute('receiptNumber', receipt.receiptNumber);
      span.addEvent('Receipt created');

      logger.info({
        message: 'Receipt created',
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
        paymentId: data.paymentId,
        userId: data.userId,
      });

      return receipt;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create receipt', error, paymentId: data.paymentId });
      throw error;
    } finally {
      span.end();
    }
  }

  async findReceiptByPayment(paymentId: string): Promise<Receipt | null> {
    for (const receipt of this.receiptStore.values()) {
      if (receipt.paymentId === paymentId) return receipt;
    }
    return null;
  }

  async findReceipt(id: string): Promise<Receipt | null> {
    return this.receiptStore.get(id) || null;
  }

  async resendInvoice(id: string, channel: InvoiceChannel): Promise<Invoice> {
    const span = tracer.startSpan('invoice.resend');

    try {
      span.setAttribute('invoiceId', id);
      span.setAttribute('channel', channel);

      const invoice = this.store.get(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const originalChannel = invoice.channel;
      invoice.channel = channel;
      await deliveryService.sendInvoice(invoice);
      invoice.channel = originalChannel;
      this.store.set(id, invoice);

      span.addEvent('Invoice resent');
      logger.info({
        message: 'Invoice resent',
        invoiceId: id,
        channel,
      });

      return invoice;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to resend invoice', error, invoiceId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async generatePDF(invoice: Invoice): Promise<Buffer> {
    const span = tracer.startSpan('invoice.generatePDF');

    try {
      span.setAttribute('invoiceId', invoice.id);
      span.addEvent('Generating PDF');

      const pdfBuffer = await generateInvoicePDF(invoice);

      span.setAttribute('pdfSize', pdfBuffer.length);
      span.addEvent('PDF generated successfully');

      logger.info({
        message: 'Invoice PDF generated',
        invoiceId: invoice.id,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to generate invoice PDF', error, invoiceId: invoice.id });
      throw error;
    } finally {
      span.end();
    }
  }

  async findByFilters(
    filters: InvoiceFilters,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Invoice>> {
    const span = tracer.startSpan('invoice.findByFilters');

    try {
      let invoices = Array.from(this.store.values());

      if (filters.userId) {
        invoices = invoices.filter((i) => i.userId === filters.userId);
      }
      if (filters.status) {
        invoices = invoices.filter((i) => i.status === filters.status);
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        invoices = invoices.filter((i) => i.createdAt >= from);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        invoices = invoices.filter((i) => i.createdAt <= to);
      }

      const total = invoices.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = invoices.slice(start, end);

      span.setAttribute('total', total);
      span.addEvent('Filtered invoices retrieved');

      return { items, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to find invoices by filters', error });
      throw error;
    } finally {
      span.end();
    }
  }

  generateInvoiceNumber(): string {
    this.invoiceCounter++;
    const year = new Date().getFullYear();
    return `INV-${year}-${String(this.invoiceCounter).padStart(6, '0')}`;
  }

  generateReceiptNumber(): string {
    this.receiptCounter++;
    const year = new Date().getFullYear();
    return `RCP-${year}-${String(this.receiptCounter).padStart(6, '0')}`;
  }

  getAllInvoices(): Invoice[] {
    return Array.from(this.store.values());
  }

  getAllReceipts(): Receipt[] {
    return Array.from(this.receiptStore.values());
  }
}

export const invoiceService = new InvoiceService();
