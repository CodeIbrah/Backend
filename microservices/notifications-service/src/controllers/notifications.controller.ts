import { z } from 'zod';
import { Request, Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validateSendNotification,
  validateBulkNotifications,
  validateNotificationId,
  validatePagination,
  validateUserId,
} from '../validators/notifications.validator';
import { logger } from '../logging/logger';

export async function sendNotificationHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateSendNotification(req.body);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const { userId, type, message } = validation.data;
    const notification = await notificationsService.send(userId, type, message);

    logger.info({ message: 'Notification sent', notificationId: notification.id, userId });

    res.status(201).json(successResponse(notification, 'Notification sent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to send notification', error });
    res.status(500).json(errorResponse('SEND_NOTIFICATION_FAILED', (error as Error).message));
  }
}

export async function listNotificationsHandler(req: Request, res: Response): Promise<void> {
  try {
    const paginationValidation = validatePagination(req.query);

    if (!paginationValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            paginationValidation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const userIdValidation = validateUserId(req.query.userId as string);

    if (!userIdValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            userIdValidation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const { page, limit } = paginationValidation.data;
    const userId = userIdValidation.data;
    const result = await notificationsService.findAll(userId, page, limit);

    res
      .status(200)
      .json(paginatedResponse(result.notifications, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list notifications', error });
    res.status(500).json(errorResponse('LIST_NOTIFICATIONS_FAILED', (error as Error).message));
  }
}

export async function getNotificationHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateNotificationId(req.params.id);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const notification = await notificationsService.findOne(req.params.id);

    if (!notification) {
      res
        .status(404)
        .json(
          errorResponse(
            'NOTIFICATION_NOT_FOUND',
            `Notification with id ${req.params.id} not found`,
          ),
        );
      return;
    }

    res.status(200).json(successResponse(notification));
  } catch (error) {
    logger.error({ message: 'Failed to get notification', error });
    res.status(500).json(errorResponse('GET_NOTIFICATION_FAILED', (error as Error).message));
  }
}

export async function deleteNotificationHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateNotificationId(req.params.id);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    await notificationsService.remove(req.params.id);

    logger.info({ message: 'Notification deleted', notificationId: req.params.id });

    res.status(200).json(successResponse(null, 'Notification deleted successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to delete notification', error });
    res.status(500).json(errorResponse('DELETE_NOTIFICATION_FAILED', (error as Error).message));
  }
}

export async function sendBulkNotificationsHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateBulkNotifications(req.body);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const notifications = await notificationsService.sendBulk(validation.data);

    logger.info({ message: 'Bulk notifications sent', count: notifications.length });

    res.status(201).json(successResponse(notifications, 'Bulk notifications sent successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to send bulk notifications', error });
    res.status(500).json(errorResponse('SEND_BULK_NOTIFICATIONS_FAILED', (error as Error).message));
  }
}
