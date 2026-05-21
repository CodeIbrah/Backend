import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';
import { notificationQueue, processNotificationJob } from '../utils/queue';

export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
}

export interface PaginatedResult {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

class NotificationsService {
  private store = new Map<string, Notification>();

  async send(userId: string, type: NotificationType, message: string): Promise<Notification> {
    const span = tracer.startSpan('notifications.send');

    try {
      span.setAttribute('userId', userId);
      span.setAttribute('type', type);

      const now = new Date().toISOString();
      const notification: Notification = {
        id: crypto.randomUUID(),
        userId,
        type,
        message,
        status: 'PENDING',
        createdAt: now,
      };

      this.store.set(notification.id, notification);

      await notificationQueue.add('send-notification', {
        notificationId: notification.id,
        userId,
        type,
        message,
      });

      span.setAttribute('notificationId', notification.id);
      span.addEvent('Notification queued successfully');

      logger.info({ message: 'Notification queued', notificationId: notification.id, userId, type });

      return notification;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to send notification', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async findAll(userId: string, page = 1, limit = 10): Promise<PaginatedResult> {
    const span = tracer.startSpan('notifications.findAll');

    try {
      span.setAttribute('userId', userId);
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const allNotifications = Array.from(this.store.values()).filter(
        (n) => n.userId === userId
      );
      const total = allNotifications.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const notifications = allNotifications.slice(start, end);

      span.setAttribute('total', total);
      span.setAttribute('returnedCount', notifications.length);
      span.addEvent('Notifications retrieved successfully');

      return { notifications, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve notifications', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<Notification | null> {
    const span = tracer.startSpan('notifications.findOne');

    try {
      span.setAttribute('notificationId', id);

      const notification = this.store.get(id) || null;

      if (notification) {
        span.addEvent('Notification found');
      } else {
        span.addEvent('Notification not found');
      }

      return notification;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve notification', error, notificationId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async remove(id: string): Promise<void> {
    const span = tracer.startSpan('notifications.remove');

    try {
      span.setAttribute('notificationId', id);

      const deleted = this.store.delete(id);

      if (deleted) {
        span.addEvent('Notification deleted successfully');
        logger.info({ message: 'Notification deleted', notificationId: id });
      } else {
        span.addEvent('Notification not found for deletion');
        throw new Error(`Notification with id ${id} not found`);
      }
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to delete notification', error, notificationId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async sendBulk(inputs: SendNotificationInput[]): Promise<Notification[]> {
    const span = tracer.startSpan('notifications.sendBulk');

    try {
      span.setAttribute('count', inputs.length);

      const notifications: Notification[] = [];
      const now = new Date().toISOString();

      for (const input of inputs) {
        const notification: Notification = {
          id: crypto.randomUUID(),
          userId: input.userId,
          type: input.type,
          message: input.message,
          status: 'PENDING',
          createdAt: now,
        };

        this.store.set(notification.id, notification);
        notifications.push(notification);

        await notificationQueue.add('send-notification', {
          notificationId: notification.id,
          userId: input.userId,
          type: input.type,
          message: input.message,
        });
      }

      span.setAttribute('createdCount', notifications.length);
      span.addEvent('Bulk notifications queued successfully');

      logger.info({ message: 'Bulk notifications queued', count: notifications.length });

      return notifications;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to send bulk notifications', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async processQueue(): Promise<void> {
    const span = tracer.startSpan('notifications.processQueue');

    try {
      await processNotificationJob();
      span.addEvent('BullMQ worker started');
      logger.info('BullMQ notification worker started');
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to start notification worker', error });
    } finally {
      span.end();
    }
  }
}

export const notificationsService = new NotificationsService();
