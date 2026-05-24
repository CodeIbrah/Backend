import { prisma, Prisma } from '@backend/shared-prisma';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

export interface CreateUserInput {
  email: string;
  name: string;
  role?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

class UsersService {
  async findAll(
    page = 1,
    limit = 10,
    filters?: UserFilters
  ): Promise<PaginatedResult<{ id: string; email: string; name: string | null; role: string; isActive: boolean; createdAt: string; updatedAt: string }>> {
    const span = tracer.startSpan('users.findAll');

    try {
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const where: Prisma.UserWhereInput = {};
      if (filters?.search) {
        where.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters?.role) where.role = filters.role as any;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      span.setAttribute('total', total);
      span.setAttribute('returnedCount', items.length);
      span.addEvent('Users retrieved successfully');

      return {
        items: items.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve users', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<{ id: string; email: string; name: string | null; role: string; isActive: boolean; createdAt: string; updatedAt: string } | null> {
    const span = tracer.startSpan('users.findOne');

    try {
      span.setAttribute('userId', id);

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (user) {
        span.addEvent('User found');
        return {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      }

      span.addEvent('User not found');
      return null;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve user', error, userId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async findByEmail(email: string) {
    const span = tracer.startSpan('users.findByEmail');
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      span.setAttribute('found', !!user);
      return user;
    } finally {
      span.end();
    }
  }

  async create(input: CreateUserInput) {
    const span = tracer.startSpan('users.create');

    try {
      span.setAttribute('email', input.email);
      span.setAttribute('name', input.name);

      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: (input.role || 'USER') as any,
          password: '',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      span.setAttribute('userId', user.id);
      span.addEvent('User created successfully');

      logger.info({ message: 'User created', userId: user.id, email: user.email });

      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create user', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async update(id: string, input: UpdateUserInput) {
    const span = tracer.startSpan('users.update');

    try {
      span.setAttribute('userId', id);

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        span.addEvent('User not found');
        return null;
      }

      if (input.email && input.email !== existingUser.email) {
        const duplicateEmail = await prisma.user.findUnique({
          where: { email: input.email },
        });
        if (duplicateEmail) {
          throw new Error('User with this email already exists');
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(input.email && { email: input.email }),
          ...(input.name && { name: input.name }),
          ...(input.role && { role: input.role as any }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      span.addEvent('User updated successfully');
      logger.info({ message: 'User updated', userId: id });

      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to update user', error, userId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async remove(id: string): Promise<boolean> {
    const span = tracer.startSpan('users.remove');

    try {
      span.setAttribute('userId', id);

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        span.addEvent('User not found for deletion');
        return false;
      }

      await prisma.user.delete({ where: { id } });

      span.addEvent('User deleted successfully');
      logger.info({ message: 'User deleted', userId: id });

      return true;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to delete user', error, userId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async toggleActive(id: string): Promise<{ id: string; isActive: boolean } | null> {
    const span = tracer.startSpan('users.toggleActive');
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, isActive: true },
      });

      span.addEvent('User active status toggled');
      return updated;
    } finally {
      span.end();
    }
  }
}

export const usersService = new UsersService();
