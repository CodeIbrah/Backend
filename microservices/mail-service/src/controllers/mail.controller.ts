import { Request, Response } from 'express';
import { mailService } from '../services/mail.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { validateSendMail, validatePagination } from '../validators/mail.validator';
import { logger } from '../logging/logger';

export async function sendMailHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateSendMail(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const record = await mailService.send(validation.data);
    logger.info({ message: 'Mail sent', mailId: record.id, to: validation.data.to });
    res.status(201).json(successResponse(record, 'Mail sent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to send mail', error });
    res.status(500).json(errorResponse('SEND_MAIL_FAILED', (error as Error).message));
  }
}

export async function listMailsHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validatePagination(req.query);
    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e) => e.message).join(', '),
          ),
        );
      return;
    }

    const result = await mailService.findAll(validation.data.page, validation.data.limit);
    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list mails', error });
    res.status(500).json(errorResponse('LIST_MAILS_FAILED', (error as Error).message));
  }
}

export async function getMailHandler(req: Request, res: Response): Promise<void> {
  try {
    const record = await mailService.findOne(req.params.id);
    if (!record) {
      res.status(404).json(errorResponse('NOT_FOUND', `Mail ${req.params.id} not found`));
      return;
    }
    res.status(200).json(successResponse(record));
  } catch (error) {
    logger.error({ message: 'Failed to get mail', error });
    res.status(500).json(errorResponse('GET_MAIL_FAILED', (error as Error).message));
  }
}
