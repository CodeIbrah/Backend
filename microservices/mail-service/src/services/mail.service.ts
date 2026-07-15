import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { MailPayload, MailRecord, MailStatus, PaginatedResult } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';
import { templateService } from './template.service';
import { TemplateId } from '../templates';
import { PrismaService } from './prisma.service';

class MailService {
  private prisma: PrismaService;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.prisma = PrismaService.getInstance();
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.example.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    return this.transporter;
  }

  async send(payload: MailPayload): Promise<MailRecord> {
    const span = tracer.startSpan('mail.send');
    try {
      span.setAttribute('to', payload.to);
      span.setAttribute('subject', payload.subject);

      let body = payload.body || '';
      let subject = payload.subject;
      let attachments = payload.attachments;

      if (payload.templateId) {
        const rendered = templateService.render(payload.templateId as TemplateId, payload.templateData || {});
        body = rendered.html;
        subject = rendered.subject;

        if (payload.templateId === 'payment-receipt' && payload.templateData) {
          const pdfAttachment = this.buildPdfAttachment(payload.templateData);
          if (pdfAttachment) {
            attachments = [...(attachments || []), pdfAttachment];
          }
        }
      }

      const record: MailRecord = {
        id: uuidv4(),
        to: payload.to,
        subject,
        body,
        status: MailStatus.PENDING,
        sentAt: null,
        error: null,
        createdAt: new Date(),
      };

      await this.prisma.client.email.create({
        data: {
          id: record.id,
          to: record.to,
          subject: record.subject,
          body: record.body,
          status: record.status,
          sentAt: record.sentAt,
          error: record.error,
        },
      });

      await this.deliver(record, attachments);

      await this.prisma.client.email.update({
        where: { id: record.id },
        data: {
          status: record.status,
          sentAt: record.sentAt,
          error: record.error,
        },
      });

      span.setAttribute('mailId', record.id);
      span.setAttribute('status', record.status);
      span.addEvent('Mail processed');

      logger.info({
        message: 'Mail processed',
        mailId: record.id,
        to: payload.to,
        subject,
        status: record.status,
        templateUsed: payload.templateId || null,
      });

      return record;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to send mail', error, to: payload.to });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<MailRecord>> {
    const skip = (page - 1) * limit;
    const [emails, total] = await Promise.all([
      this.prisma.client.email.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.email.count(),
    ]);

    const items: MailRecord[] = emails.map((e) => ({
      id: e.id,
      to: e.to,
      subject: e.subject,
      body: e.body,
      status: e.status as MailStatus,
      sentAt: e.sentAt,
      error: e.error,
      createdAt: e.createdAt,
    }));

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<MailRecord | null> {
    const email = await this.prisma.client.email.findUnique({ where: { id } });
    if (!email) return null;
    return {
      id: email.id,
      to: email.to,
      subject: email.subject,
      body: email.body,
      status: email.status as MailStatus,
      sentAt: email.sentAt,
      error: email.error,
      createdAt: email.createdAt,
    };
  }

  private async deliver(
    record: MailRecord,
    attachments?: MailPayload['attachments'],
  ): Promise<void> {
    const span = tracer.startSpan('mail.deliver');
    try {
      const smtpHost = process.env.SMTP_HOST || 'smtp.example.com';

      if (!smtpHost || smtpHost === 'smtp.example.com') {
        logger.warn({
          message: 'SMTP not configured, simulating mail delivery',
          mailId: record.id,
          to: record.to,
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
        record.status = MailStatus.SENT;
        record.sentAt = new Date();
        span.addEvent('Mail delivery simulated (SMTP not configured)');
        return;
      }

      const transporter = this.getTransporter();

      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@example.com',
        to: record.to,
        subject: record.subject,
        html: record.body,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          encoding: 'base64',
        }));
      }

      await transporter.sendMail(mailOptions);

      record.status = MailStatus.SENT;
      record.sentAt = new Date();
      span.addEvent('Mail delivered via SMTP');
    } catch (error) {
      record.status = MailStatus.FAILED;
      record.error = (error as Error).message;
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Mail delivery failed', error, mailId: record.id });
    } finally {
      span.end();
    }
  }

  private buildPdfAttachment(
    templateData: Record<string, unknown>,
  ): { filename: string; content: string } | null {
    const invoiceNumber = templateData.invoiceNumber;
    if (!invoiceNumber) {
      return null;
    }

    return {
      filename: `receipt-${String(invoiceNumber)}.pdf`,
      content: '',
    };
  }
}

export const mailService = new MailService();
