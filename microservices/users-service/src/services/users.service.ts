import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

class UsersService {
  private store = new Map<string, User>();

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<User>> {
    const span = tracer.startSpan('users.findAll');

    try {
      span.setAttribute('page', page);
      span.setAttribute('limit', limit);

      const allUsers = Array.from(this.store.values());
      const total = allUsers.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = allUsers.slice(start, end);

      span.setAttribute('total', total);
      span.setAttribute('returnedCount', items.length);
      span.addEvent('Users retrieved successfully');

      return { items, total, page, limit };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve users', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async findOne(id: string): Promise<User | undefined> {
    const span = tracer.startSpan('users.findOne');

    try {
      span.setAttribute('userId', id);

      const user = this.store.get(id);

      if (user) {
        span.addEvent('User found');
      } else {
        span.addEvent('User not found');
      }

      return user;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to retrieve user', error, userId: id });
      throw error;
    } finally {
      span.end();
    }
  }

  async create(input: CreateUserInput): Promise<User> {
    const span = tracer.startSpan('users.create');

    try {
      span.setAttribute('email', input.email);
      span.setAttribute('name', input.name);

      const existingUser = Array.from(this.store.values()).find(
        (u) => u.email === input.email
      );

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const now = new Date().toISOString();
      const user: User = {
        id: crypto.randomUUID(),
        email: input.email,
        name: input.name,
        role: input.role || 'user',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      this.store.set(user.id, user);

      span.setAttribute('userId', user.id);
      span.addEvent('User created successfully');

      logger.info({ message: 'User created', userId: user.id, email: user.email });

      return user;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to create user', error });
      throw error;
    } finally {
      span.end();
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<User | undefined> {
    const span = tracer.startSpan('users.update');

    try {
      span.setAttribute('userId', id);

      const user = this.store.get(id);

      if (!user) {
        span.addEvent('User not found');
        return undefined;
      }

      if (input.email) {
        const existingUser = Array.from(this.store.values()).find(
          (u) => u.email === input.email && u.id !== id
        );

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        user.email = input.email;
      }

      if (input.name) user.name = input.name;
      if (input.role) user.role = input.role;
      if (input.isActive !== undefined) user.isActive = input.isActive;

      user.updatedAt = new Date().toISOString();

      this.store.set(id, user);

      span.addEvent('User updated successfully');

      logger.info({ message: 'User updated', userId: id });

      return user;
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

      const deleted = this.store.delete(id);

      if (deleted) {
        span.addEvent('User deleted successfully');
        logger.info({ message: 'User deleted', userId: id });
      } else {
        span.addEvent('User not found for deletion');
      }

      return deleted;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      logger.error({ message: 'Failed to delete user', error, userId: id });
      throw error;
    } finally {
      span.end();
    }
  }
}

export const usersService = new UsersService();
