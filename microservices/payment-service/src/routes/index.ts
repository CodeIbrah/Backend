import { Router } from 'express';
import paymentRoutes from './payment.routes';
import invoiceRoutes from './invoice.routes';
import receiptRoutes from './receipt.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use(paymentRoutes);
router.use(invoiceRoutes);
router.use(receiptRoutes);
router.use(adminRoutes);

export default router;
