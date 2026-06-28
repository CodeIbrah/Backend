import { Router } from 'express';
import { sendSmsHandler, listSmsHandler, getSmsHandler } from '../controllers/sms.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/api/v1/sms/send', authMiddleware, sendSmsHandler);
router.get('/api/v1/sms', authMiddleware, listSmsHandler);
router.get('/api/v1/sms/:id', authMiddleware, getSmsHandler);

export default router;
