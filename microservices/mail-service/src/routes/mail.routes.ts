import { Router } from 'express';
import {
  sendMailHandler,
  listMailsHandler,
  getMailHandler,
} from '../controllers/mail.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/api/v1/mail/send', authMiddleware, sendMailHandler);
router.get('/api/v1/mail', authMiddleware, listMailsHandler);
router.get('/api/v1/mail/:id', authMiddleware, getMailHandler);

export default router;
