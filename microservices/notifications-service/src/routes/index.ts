import { Router } from 'express';
import notificationsRoutes from './notifications.routes';

const router = Router();

router.use(notificationsRoutes);

export default router;
