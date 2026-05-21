import { Router } from 'express';
import {
  sendNotificationHandler,
  listNotificationsHandler,
  getNotificationHandler,
  deleteNotificationHandler,
  sendBulkNotificationsHandler,
} from '../controllers/notifications.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/api/v1/notifications', authMiddleware, sendNotificationHandler);
router.get('/api/v1/notifications', authMiddleware, listNotificationsHandler);
router.get('/api/v1/notifications/:id', authMiddleware, getNotificationHandler);
router.delete('/api/v1/notifications/:id', authMiddleware, deleteNotificationHandler);
router.post('/api/v1/notifications/bulk', authMiddleware, sendBulkNotificationsHandler);

export default router;
