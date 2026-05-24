import { v4 as uuidv4 } from 'uuid';
import { MailPayload, MailRecord, MailStatus, PaginatedResult } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

class MailService {
  private store = new Map<string, MailRecord>();

  async send(payload: MailPayload): Promise<MailRecord> {
    const span = tracer.startSpan('mail.send');
    try {
      span.setAttribute('to', payload.to);
      span.setAttribute('subject', payload.subject);

      const record: MailRecord = {
        id: uuidv4(),
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        status: MailStatus.PENDING,
        sentAt: null,
        error: null,
        createdAt: new Date(),
      };

      await this.deliver(record);

      this.store.set(record.id, record);

      span.setAttribute('mailId', record.id);
      span.setAttribute('status', record.status);
      span.addEvent('Mail processed');

      logger.info({
        message: 'Mail processed',
        mailId: record.id,
        to: payload.to,
        subject: payload.subject,
        status: record.status,
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
    const items = Array.from(this.store.values());
    const total = items.length;
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total, page, limit };
  }

  async findOne(id: string): Promise<MailRecord | null> {
    return this.store.get(id) || null;
  }

  private async deliver(record: MailRecord): Promise<void> {
    const span = tracer.startSpan('mail.deliver');
    try {
      const smtpHost = process.env.SMTP_HOST || 'smtp.example.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpUser = process.env.SMTP_USER || '';
      const smtpPass = process.env.SMTP_PASS || '';
      const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';

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

      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
      });

      await transporter.sendMail({
        from: fromEmail,
        to: record.to,
        subject: record.subject,
        html: record.body,
      });

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
}

export const mailService = new MailService();
