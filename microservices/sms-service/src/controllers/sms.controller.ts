import { Request, Response } from 'express';
import { smsService } from '../services/sms.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { validateSendSms, validatePagination } from '../validators/sms.validator';
import { logger } from '../logging/logger';

export async function sendSmsHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateSendSms(req.body);
    if (!validation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', validation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const record = await smsService.send(validation.data);
    logger.info({ message: 'SMS sent', smsId: record.id, to: validation.data.to });
    res.status(201).json(successResponse(record, 'SMS sent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to send SMS', error });
    res.status(500).json(errorResponse('SEND_SMS_FAILED', (error as Error).message));
  }
}

export async function listSmsHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePagination(req.query);
    if (!validation.success) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', validation.error.issues.map((e) => e.message).join(', ')));
      return;
    }

    const result = await smsService.findAll(validation.data.page, validation.data.limit);
    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list SMS', error });
    res.status(500).json(errorResponse('LIST_SMS_FAILED', (error as Error).message));
  }
}

export async function getSmsHandler(req: Request, res: Response): Promise<void> {
  try {
    const record = await smsService.findOne(req.params.id);
    if (!record) {
      res.status(404).json(errorResponse('NOT_FOUND', `SMS ${req.params.id} not found`));
      return;
    }
    res.status(200).json(successResponse(record));
  } catch (error) {
    logger.error({ message: 'Failed to get SMS', error });
    res.status(500).json(errorResponse('GET_SMS_FAILED', (error as Error).message));
  }
}
