import { Router } from 'express';
import {
  verifyTokenHandler,
  validatePermissionHandler,
  healthHandler,
} from '../controllers/auth.controller';

const router = Router();

router.post('/api/v1/auth/verify', verifyTokenHandler);
router.post('/api/v1/auth/validate', validatePermissionHandler);
router.get('/api/v1/auth/health', healthHandler);

export default router;
