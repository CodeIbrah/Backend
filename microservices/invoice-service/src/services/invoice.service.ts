import { v4 as uuidv4 } from 'uuid';
import { Invoice, Receipt, InvoiceStatus, Currency, InvoiceChannel, CreateInvoiceInput, PaginatedResult, InvoiceFilters, MailPayload, SmsPayload } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || 'http://localhost:3007';
const SMS_SERVICE_URL = process.env.SMS_SERVICE_URL || 'http://localhost:3008';

class InvoiceService {
  private invoiceStore = new Map<string, Invoice>();
  private receiptStore = new Map<string, Receipt>();
  private invoiceCounter = 2000;
  private receiptCounter = 8000;

  async createInvoiceFromPayment(data: CreateInvoiceInput): Promise<Invoice> {
    const span = tracer.startSpan('invoice.createFromPayment');
    try {
      span.setAttribute('userId', data.userId);
      span.setAttribute('paymentId', data.paymentId);

      const items = data.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = data.tax || 0;
      const discount = data.discount || 0;
      const total = subtotal + tax - discount;
      const now = new Date();
      const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const invoice: Invoice = {
        id: uuidv4(),
        invoiceNumber: this.generateInvoiceNumber(),
        userId: data.userId,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        paymentId: data.paymentId,
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

      this.invoiceStore.set(invoice.id, invoice);
      span.setAttribute('invoiceId', invoice.id);
      span.setAttribute('invoiceNumber', invoice.invoiceNumber);
      span.addEvent('Invoice created from payment');

      logger.info({
        message: 'Invoice created from payment',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId: data.userId,
        paymentId: data.paymentId,
        total,
      });

      return invoice;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create invoice from payment', error, userId: data.userId });
      throw error;
    } finally {
      span.end();
    }
  }

  async createReceipt(data: {
    userId: string;
    userEmail: string;
    userPhone: string;
    paymentId: string;
    invoiceId: string;
    amount: number;
    currency: Currency;
    description: string;
  }): Promise<Receipt> {
    const span = tracer.startSpan('receipt.create');
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
        description: data.description,
        issuedAt: new Date(),
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

  async sendInvoice(invoice: Invoice): Promise<void> {
    const span = tracer.startSpan('invoice.send');
    try {
      const shouldEmail = invoice.channel === InvoiceChannel.EMAIL || invoice.channel === InvoiceChannel.BOTH;
      const shouldSms = invoice.channel === InvoiceChannel.SMS || invoice.channel === InvoiceChannel.BOTH;

      const results = await Promise.allSettled([
        shouldEmail && invoice.userEmail ? this.sendEmail(invoice) : Promise.resolve(),
        shouldSms && invoice.userPhone ? this.sendSms(invoice) : Promise.resolve(),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error({ message: 'Failed to send via channel', error: result.reason, invoiceId: invoice.id });
        }
      }

      invoice.sentAt = new Date();
      invoice.updatedAt = new Date();
      this.invoiceStore.set(invoice.id, invoice);

      span.addEvent('Invoice sent via channels');
      logger.info({
        message: 'Invoice sent',
        invoiceId: invoice.id,
        channels: invoice.channel,
        email: shouldEmail,
        sms: shouldSms,
      });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to send invoice', error, invoiceId: invoice.id });
      throw error;
    } finally {
      span.end();
    }
  }

  async sendReceipt(receipt: Receipt): Promise<void> {
    const span = tracer.startSpan('receipt.send');
    try {
      const results = await Promise.allSettled([
        receipt.userEmail ? this.sendReceiptEmail(receipt) : Promise.resolve(),
        receipt.userPhone ? this.sendReceiptSms(receipt) : Promise.resolve(),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error({ message: 'Failed to send receipt via channel', error: result.reason, receiptId: receipt.id });
        }
      }

      receipt.sentAt = new Date();
      this.receiptStore.set(receipt.id, receipt);

      span.addEvent('Receipt sent');
      logger.info({ message: 'Receipt sent', receiptId: receipt.id });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to send receipt', error, receiptId: receipt.id });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAllInvoices(userId: string, page = 1, limit = 10): Promise<PaginatedResult<Invoice>> {
    const userInvoices = Array.from(this.invoiceStore.values()).filter((i) => i.userId === userId);
    const total = userInvoices.length;
    const start = (page - 1) * limit;
    return { items: userInvoices.slice(start, start + limit), total, page, limit };
  }

  async findInvoice(id: string): Promise<Invoice | null> {
    return this.invoiceStore.get(id) || null;
  }

  async findInvoiceByNumber(number: string): Promise<Invoice | null> {
    for (const invoice of this.invoiceStore.values()) {
      if (invoice.invoiceNumber === number) return invoice;
    }
    return null;
  }

  async findAllReceipts(userId: string, page = 1, limit = 10): Promise<PaginatedResult<Receipt>> {
    const userReceipts = Array.from(this.receiptStore.values()).filter((r) => r.userId === userId);
    const total = userReceipts.length;
    const start = (page - 1) * limit;
    return { items: userReceipts.slice(start, start + limit), total, page, limit };
  }

  async findReceipt(id: string): Promise<Receipt | null> {
    return this.receiptStore.get(id) || null;
  }

  async findReceiptByPayment(paymentId: string): Promise<Receipt | null> {
    for (const receipt of this.receiptStore.values()) {
      if (receipt.paymentId === paymentId) return receipt;
    }
    return null;
  }

  async findByFilters(filters: InvoiceFilters, page = 1, limit = 10): Promise<PaginatedResult<Invoice>> {
    let invoices = Array.from(this.invoiceStore.values());
    if (filters.userId) invoices = invoices.filter((i) => i.userId === filters.userId);
    if (filters.status) invoices = invoices.filter((i) => i.status === filters.status);
    if (filters.dateFrom) invoices = invoices.filter((i) => i.createdAt >= new Date(filters.dateFrom!));
    if (filters.dateTo) invoices = invoices.filter((i) => i.createdAt <= new Date(filters.dateTo!));
    const total = invoices.length;
    const start = (page - 1) * limit;
    return { items: invoices.slice(start, start + limit), total, page, limit };
  }

  getAllInvoices(): Invoice[] {
    return Array.from(this.invoiceStore.values());
  }

  getAllReceipts(): Receipt[] {
    return Array.from(this.receiptStore.values());
  }

  private async sendEmail(invoice: Invoice): Promise<void> {
    const payload: MailPayload = {
      to: invoice.userEmail,
      subject: `Invoice ${invoice.invoiceNumber} - ${invoice.currency} ${invoice.total.toFixed(2)}`,
      body: this.formatInvoiceEmailBody(invoice),
    };
    try {
      const res = await fetch(`${MAIL_SERVICE_URL}/api/v1/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Mail service responded with ${res.status}`);
      }
      logger.info({ message: 'Invoice email sent', invoiceId: invoice.id });
    } catch (error) {
      logger.error({ message: 'Failed to send invoice email', error, invoiceId: invoice.id, mailServiceUrl: MAIL_SERVICE_URL });
      throw error;
    }
  }

  private async sendSms(invoice: Invoice): Promise<void> {
    const payload: SmsPayload = {
      to: invoice.userPhone,
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${invoice.total.toFixed(2)} is now available. Due: ${invoice.dueDate.toISOString().split('T')[0]}`,
    };
    try {
      const res = await fetch(`${SMS_SERVICE_URL}/api/v1/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`SMS service responded with ${res.status}`);
      }
      logger.info({ message: 'Invoice SMS sent', invoiceId: invoice.id });
    } catch (error) {
      logger.error({ message: 'Failed to send invoice SMS', error, invoiceId: invoice.id, smsServiceUrl: SMS_SERVICE_URL });
      throw error;
    }
  }

  private async sendReceiptEmail(receipt: Receipt): Promise<void> {
    const payload: MailPayload = {
      to: receipt.userEmail,
      subject: `Receipt ${receipt.receiptNumber} - Payment Confirmed`,
      body: this.formatReceiptEmailBody(receipt),
    };
    try {
      const res = await fetch(`${MAIL_SERVICE_URL}/api/v1/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Mail service responded with ${res.status}`);
      }
      logger.info({ message: 'Receipt email sent', receiptId: receipt.id });
    } catch (error) {
      logger.error({ message: 'Failed to send receipt email', error, receiptId: receipt.id, mailServiceUrl: MAIL_SERVICE_URL });
      throw error;
    }
  }

  private async sendReceiptSms(receipt: Receipt): Promise<void> {
    const payload: SmsPayload = {
      to: receipt.userPhone,
      message: `Receipt ${receipt.receiptNumber}: Payment of ${receipt.currency} ${receipt.amount.toFixed(2)} confirmed. Thank you!`,
    };
    try {
      const res = await fetch(`${SMS_SERVICE_URL}/api/v1/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`SMS service responded with ${res.status}`);
      }
      logger.info({ message: 'Receipt SMS sent', receiptId: receipt.id });
    } catch (error) {
      logger.error({ message: 'Failed to send receipt SMS', error, receiptId: receipt.id, smsServiceUrl: SMS_SERVICE_URL });
      throw error;
    }
  }

  private formatInvoiceEmailBody(invoice: Invoice): string {
    const itemsHtml = invoice.items
      .map((i) => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${i.unitPrice.toFixed(2)}</td><td>${i.total.toFixed(2)}</td></tr>`)
      .join('');
    return `
      <h2>Invoice ${invoice.invoiceNumber}</h2>
      <p><strong>Status:</strong> ${invoice.status}</p>
      <p><strong>Due Date:</strong> ${invoice.dueDate.toISOString().split('T')[0]}</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Subtotal:</strong> ${invoice.currency} ${invoice.subtotal.toFixed(2)}</p>
      <p><strong>Tax:</strong> ${invoice.currency} ${invoice.tax.toFixed(2)}</p>
      ${invoice.discount > 0 ? `<p><strong>Discount:</strong> -${invoice.currency} ${invoice.discount.toFixed(2)}</p>` : ''}
      <p><strong>Total:</strong> ${invoice.currency} ${invoice.total.toFixed(2)}</p>
      ${invoice.notes ? `<p><em>${invoice.notes}</em></p>` : ''}
    `;
  }

  private formatReceiptEmailBody(receipt: Receipt): string {
    return `
      <h2>Payment Receipt</h2>
      <p><strong>Receipt:</strong> ${receipt.receiptNumber}</p>
      <p><strong>Amount:</strong> ${receipt.currency} ${receipt.amount.toFixed(2)}</p>
      <p><strong>Description:</strong> ${receipt.description}</p>
      <p>Thank you for your payment!</p>
    `;
  }

  private generateInvoiceNumber(): string {
    this.invoiceCounter++;
    const year = new Date().getFullYear();
    return `INV-${year}-${String(this.invoiceCounter).padStart(6, '0')}`;
  }

  private generateReceiptNumber(): string {
    this.receiptCounter++;
    const year = new Date().getFullYear();
    return `RCP-${year}-${String(this.receiptCounter).padStart(6, '0')}`;
  }
}

export const invoiceService = new InvoiceService();
