import { Router } from 'express';
import invoiceRoutes from './invoice.routes';

const router = Router();
router.use(invoiceRoutes);

export default router;
