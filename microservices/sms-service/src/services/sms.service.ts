import { v4 as uuidv4 } from 'uuid';
import { SmsPayload, SmsRecord, SmsStatus, PaginatedResult } from '../types';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

class SmsService {
  private store = new Map<string, SmsRecord>();

  async send(payload: SmsPayload): Promise<SmsRecord> {
    const span = tracer.startSpan('sms.send');
    try {
      span.setAttribute('to', payload.to);

      const record: SmsRecord = {
        id: uuidv4(),
        to: payload.to,
        message: payload.message,
        status: SmsStatus.PENDING,
        sentAt: null,
        error: null,
        createdAt: new Date(),
      };

      await this.deliver(record);

      this.store.set(record.id, record);

      span.setAttribute('smsId', record.id);
      span.setAttribute('status', record.status);
      span.addEvent('SMS processed');

      logger.info({
        message: 'SMS processed',
        smsId: record.id,
        to: payload.to,
        status: record.status,
      });

      return record;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to send SMS', error, to: payload.to });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<SmsRecord>> {
    const items = Array.from(this.store.values());
    const total = items.length;
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total, page, limit };
  }

  async findOne(id: string): Promise<SmsRecord | null> {
    return this.store.get(id) || null;
  }

  private async deliver(record: SmsRecord): Promise<void> {
    const span = tracer.startSpan('sms.deliver');
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
      const authToken = process.env.TWILIO_AUTH_TOKEN || '';
      const fromNumber = process.env.TWILIO_FROM_NUMBER || '';

      if (!accountSid || !authToken) {
        logger.warn({
          message: 'Twilio not configured, simulating SMS delivery',
          smsId: record.id,
          to: record.to,
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
        record.status = SmsStatus.SENT;
        record.sentAt = new Date();
        span.addEvent('SMS delivery simulated (Twilio not configured)');
        return;
      }

      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      await client.messages.create({
        body: record.message,
        from: fromNumber,
        to: record.to,
      });

      record.status = SmsStatus.SENT;
      record.sentAt = new Date();
      span.addEvent('SMS delivered via Twilio');
    } catch (error) {
      record.status = SmsStatus.FAILED;
      record.error = (error as Error).message;
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'SMS delivery failed', error, smsId: record.id });
    } finally {
      span.end();
    }
  }
}

export const smsService = new SmsService();
