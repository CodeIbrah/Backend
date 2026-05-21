import PDFDocument from 'pdfkit';
import { Invoice, Receipt, InvoiceItem } from '../types';

function sanitizePdfText(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, 5000);
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '\u20ac',
    GBP: '\u00a3',
    MXN: 'MX$',
    COP: 'COP$',
    BRL: 'R$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

function addInvoiceItems(doc: PDFKit.PDFDocument, items: InvoiceItem[], y: number): number {
  let currentY = y;

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Description', 50, currentY, { width: 200 });
  doc.text('Qty', 260, currentY, { width: 40, align: 'center' });
  doc.text('Unit Price', 310, currentY, { width: 80, align: 'right' });
  doc.text('Total', 400, currentY, { width: 80, align: 'right' });
  currentY += 15;

  doc.moveTo(50, currentY).lineTo(530, currentY).stroke();
  currentY += 5;

  doc.font('Helvetica');
  for (const item of items) {
    doc.text(sanitizePdfText(item.description), 50, currentY, { width: 200 });
    doc.text(String(item.quantity), 260, currentY, { width: 40, align: 'center' });
    doc.text(formatCurrency(item.unitPrice, 'USD'), 310, currentY, { width: 80, align: 'right' });
    doc.text(formatCurrency(item.total, 'USD'), 400, currentY, { width: 80, align: 'right' });
    currentY += 18;
  }

  return currentY;
}

export function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica');
  doc.text(`Invoice Number: ${sanitizePdfText(invoice.invoiceNumber)}`, 50, doc.y);
  doc.text(`Date: ${invoice.issuedAt.toISOString().split('T')[0]}`, 50, doc.y);
  doc.text(`Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`, 50, doc.y);
  doc.text(`Status: ${sanitizePdfText(invoice.status)}`, 50, doc.y);
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold').text(`Bill To: User ${sanitizePdfText(invoice.userId)}`, 50, doc.y);
      doc.moveDown(0.5);

      let y = doc.y + 10;
      y = addInvoiceItems(doc, invoice.items, y);

      y += 10;
      doc.moveTo(50, y).lineTo(530, y).stroke();
      y += 10;

      doc.fontSize(11).font('Helvetica');
      doc.text(`Subtotal:`, 350, y, { width: 100, align: 'right' });
      doc.text(formatCurrency(invoice.subtotal, invoice.currency), 460, y, { width: 70, align: 'right' });
      y += 16;
      doc.text(`Tax:`, 350, y, { width: 100, align: 'right' });
      doc.text(formatCurrency(invoice.tax, invoice.currency), 460, y, { width: 70, align: 'right' });
      y += 16;
      if (invoice.discount > 0) {
        doc.text(`Discount:`, 350, y, { width: 100, align: 'right' });
        doc.text(`-${formatCurrency(invoice.discount, invoice.currency)}`, 460, y, { width: 70, align: 'right' });
        y += 16;
      }
      y += 5;
      doc.moveTo(350, y).lineTo(530, y).stroke();
      y += 8;
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`Total:`, 350, y, { width: 100, align: 'right' });
      doc.text(formatCurrency(invoice.total, invoice.currency), 460, y, { width: 70, align: 'right' });

      if (invoice.notes) {
        y += 30;
        doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, y);
        y += 14;
        doc.font('Helvetica').text(sanitizePdfText(invoice.notes), 50, y, { width: 480 });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function generateReceiptPDF(receipt: Receipt): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(24).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica');
      doc.text(`Receipt Number: ${sanitizePdfText(receipt.receiptNumber)}`, 50, doc.y);
      doc.text(`Date: ${receipt.issuedAt.toISOString().split('T')[0]}`, 50, doc.y);
      doc.text(`Payment ID: ${sanitizePdfText(receipt.paymentId)}`, 50, doc.y);
      if (receipt.invoiceId) {
        doc.text(`Invoice ID: ${sanitizePdfText(receipt.invoiceId)}`, 50, doc.y);
      }
      doc.text(`Status: ${sanitizePdfText(receipt.status)}`, 50, doc.y);
      doc.moveDown(0.5);

      doc.fontSize(12).font('Helvetica-Bold').text(`Paid By: User ${sanitizePdfText(receipt.userId)}`, 50, doc.y);
      doc.moveDown(1);

      doc.fontSize(11).font('Helvetica');
      doc.text(`Description:`, 50, doc.y);
      doc.font('Helvetica').text(sanitizePdfText(receipt.description), 50, doc.y, { width: 480 });
      doc.moveDown(0.5);

      doc.font('Helvetica').text(`Payment Method: ${sanitizePdfText(receipt.method)}`, 50, doc.y);
      doc.moveDown(0.5);

      const y = doc.y + 20;
      doc.moveTo(50, y).lineTo(530, y).stroke();

      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`Amount Paid:`, 350, y + 10, { width: 100, align: 'right' });
      doc.text(formatCurrency(receipt.amount, receipt.currency), 460, y + 10, { width: 70, align: 'right' });

      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text('Thank you for your payment!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
