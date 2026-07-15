import { Invoice, Receipt, InvoiceChannel } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || 'http://localhost:3007';
const SMS_SERVICE_URL = process.env.SMS_SERVICE_URL || 'http://localhost:3008';
const JWT_SERVICE_TOKEN = process.env.JWT_SERVICE_TOKEN || '';

interface MailPayload {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; content: string }>;
}

interface SmsPayload {
  to: string;
  message: string;
}

class DeliveryService {
  async sendInvoice(invoice: Invoice): Promise<void> {
    const span = tracer.startSpan('delivery.sendInvoice');
    try {
      const channel = invoice.channel || InvoiceChannel.EMAIL;
      const shouldEmail = channel === InvoiceChannel.EMAIL || channel === InvoiceChannel.BOTH;
      const shouldSms = channel === InvoiceChannel.SMS || channel === InvoiceChannel.BOTH;

      const results = await Promise.allSettled([
        shouldEmail && invoice.userEmail ? this.sendInvoiceEmail(invoice) : Promise.resolve(),
        shouldSms && invoice.userPhone ? this.sendInvoiceSms(invoice) : Promise.resolve(),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error({
            message: 'Failed to send invoice via channel',
            error: result.reason,
            invoiceId: invoice.id,
          });
        }
      }

      invoice.sentAt = new Date();

      span.addEvent('Invoice sent via channels');
      logger.info({
        message: 'Invoice sent',
        invoiceId: invoice.id,
        channels: channel,
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
    const span = tracer.startSpan('delivery.sendReceipt');
    try {
      const results = await Promise.allSettled([
        receipt.userEmail ? this.sendReceiptEmail(receipt) : Promise.resolve(),
        receipt.userPhone ? this.sendReceiptSms(receipt) : Promise.resolve(),
      ]);

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error({
            message: 'Failed to send receipt via channel',
            error: result.reason,
            receiptId: receipt.id,
          });
        }
      }

      receipt.sentAt = new Date();

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

  private async sendInvoiceEmail(invoice: Invoice): Promise<void> {
    const payload: MailPayload = {
      to: invoice.userEmail!,
      subject: `Invoice ${invoice.invoiceNumber} - ${invoice.currency} ${invoice.total.toFixed(2)}`,
      body: this.formatInvoiceEmailBody(invoice),
    };
    try {
      const res = await fetch(`${MAIL_SERVICE_URL}/api/v1/mail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_SERVICE_TOKEN ? { Authorization: `Bearer ${JWT_SERVICE_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Mail service responded with ${res.status}`);
      }
      logger.info({ message: 'Invoice email sent', invoiceId: invoice.id });
    } catch (error) {
      logger.error({
        message: 'Failed to send invoice email',
        error,
        invoiceId: invoice.id,
        mailServiceUrl: MAIL_SERVICE_URL,
      });
      throw error;
    }
  }

  private async sendInvoiceSms(invoice: Invoice): Promise<void> {
    const payload: SmsPayload = {
      to: invoice.userPhone!,
      message: `Invoice ${invoice.invoiceNumber} for ${invoice.currency} ${invoice.total.toFixed(2)} is now available. Due: ${invoice.dueDate.toISOString().split('T')[0]}`,
    };
    try {
      const res = await fetch(`${SMS_SERVICE_URL}/api/v1/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_SERVICE_TOKEN ? { Authorization: `Bearer ${JWT_SERVICE_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`SMS service responded with ${res.status}`);
      }
      logger.info({ message: 'Invoice SMS sent', invoiceId: invoice.id });
    } catch (error) {
      logger.error({
        message: 'Failed to send invoice SMS',
        error,
        invoiceId: invoice.id,
        smsServiceUrl: SMS_SERVICE_URL,
      });
      throw error;
    }
  }

  private async sendReceiptEmail(receipt: Receipt): Promise<void> {
    const payload: MailPayload = {
      to: receipt.userEmail!,
      subject: `Receipt ${receipt.receiptNumber} - Payment Confirmed`,
      body: this.formatReceiptEmailBody(receipt),
    };
    try {
      const res = await fetch(`${MAIL_SERVICE_URL}/api/v1/mail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_SERVICE_TOKEN ? { Authorization: `Bearer ${JWT_SERVICE_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Mail service responded with ${res.status}`);
      }
      logger.info({ message: 'Receipt email sent', receiptId: receipt.id });
    } catch (error) {
      logger.error({
        message: 'Failed to send receipt email',
        error,
        receiptId: receipt.id,
        mailServiceUrl: MAIL_SERVICE_URL,
      });
      throw error;
    }
  }

  private async sendReceiptSms(receipt: Receipt): Promise<void> {
    const payload: SmsPayload = {
      to: receipt.userPhone!,
      message: `Receipt ${receipt.receiptNumber}: Payment of ${receipt.currency} ${receipt.amount.toFixed(2)} confirmed. Thank you!`,
    };
    try {
      const res = await fetch(`${SMS_SERVICE_URL}/api/v1/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_SERVICE_TOKEN ? { Authorization: `Bearer ${JWT_SERVICE_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`SMS service responded with ${res.status}`);
      }
      logger.info({ message: 'Receipt SMS sent', receiptId: receipt.id });
    } catch (error) {
      logger.error({
        message: 'Failed to send receipt SMS',
        error,
        receiptId: receipt.id,
        smsServiceUrl: SMS_SERVICE_URL,
      });
      throw error;
    }
  }

  private formatInvoiceEmailBody(invoice: Invoice): string {
    const itemsHtml = invoice.items
      .map(
        (i) =>
          `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${i.unitPrice.toFixed(2)}</td><td>${i.total.toFixed(2)}</td></tr>`,
      )
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
}

export const deliveryService = new DeliveryService();
