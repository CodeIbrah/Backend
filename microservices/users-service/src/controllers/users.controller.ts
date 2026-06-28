import { z } from 'zod';
import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserId,
  validatePagination,
} from '../validators/users.validator';
import { logger } from '../logging/logger';
import { Role } from '@backend/shared-prisma';

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  try {
    const paginationValidation = validatePagination(req.query);

    if (!paginationValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            paginationValidation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const { page, limit } = paginationValidation.data;
    const result = await usersService.findAll(page, limit);

    res.status(200).json(paginatedResponse(result.items, result.total, result.page, result.limit));
  } catch (error) {
    logger.error({ message: 'Failed to list users', error });
    res.status(500).json(errorResponse('LIST_USERS_FAILED', (error as Error).message));
  }
}

export async function getUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateUserId(req.params.id);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const user = await usersService.findOne(req.params.id);

    if (!user) {
      res
        .status(404)
        .json(errorResponse('USER_NOT_FOUND', `User with id ${req.params.id} not found`));
      return;
    }

    res.status(200).json(successResponse(user));
  } catch (error) {
    logger.error({ message: 'Failed to get user', error });
    res.status(500).json(errorResponse('GET_USER_FAILED', (error as Error).message));
  }
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateCreateUser(req.body);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const createData = { ...validation.data, role: validation.data.role as Role | undefined };
    const user = await usersService.create(createData);

    logger.info({ message: 'User created', userId: user.id });

    res.status(201).json(successResponse(user, 'User created successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to create user', error });
    res.status(500).json(errorResponse('CREATE_USER_FAILED', (error as Error).message));
  }
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const idValidation = validateUserId(req.params.id);

    if (!idValidation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            idValidation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const validation = validateUpdateUser(req.body);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const updateData = { ...validation.data, role: validation.data.role as Role | undefined };
    const user = await usersService.update(req.params.id, updateData);

    if (!user) {
      res
        .status(404)
        .json(errorResponse('USER_NOT_FOUND', `User with id ${req.params.id} not found`));
      return;
    }

    logger.info({ message: 'User updated', userId: user.id });

    res.status(200).json(successResponse(user, 'User updated successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to update user', error });
    res.status(500).json(errorResponse('UPDATE_USER_FAILED', (error as Error).message));
  }
}

export async function deleteUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const validation = validateUserId(req.params.id);

    if (!validation.success) {
      res
        .status(400)
        .json(
          errorResponse(
            'VALIDATION_ERROR',
            validation.error.issues.map((e: z.ZodIssue) => e.message).join(', '),
          ),
        );
      return;
    }

    const deleted = await usersService.remove(req.params.id);

    if (!deleted) {
      res
        .status(404)
        .json(errorResponse('USER_NOT_FOUND', `User with id ${req.params.id} not found`));
      return;
    }

    logger.info({ message: 'User deleted', userId: req.params.id });

    res.status(200).json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    logger.error({ message: 'Failed to delete user', error });
    res.status(500).json(errorResponse('DELETE_USER_FAILED', (error as Error).message));
  }
}
