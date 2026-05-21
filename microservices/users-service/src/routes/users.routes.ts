import { Router } from 'express';
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/api/v1/users', authMiddleware, listUsersHandler);
router.get('/api/v1/users/:id', authMiddleware, getUserHandler);
router.post('/api/v1/users', authMiddleware, createUserHandler);
router.patch('/api/v1/users/:id', authMiddleware, updateUserHandler);
router.delete('/api/v1/users/:id', authMiddleware, deleteUserHandler);

export default router;
