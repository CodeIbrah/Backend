import { Router } from 'express';
import smsRoutes from './sms.routes';

const router = Router();
router.use(smsRoutes);

export default router;
