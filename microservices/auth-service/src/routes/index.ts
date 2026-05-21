import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

router.use(authRoutes);

export default router;
