import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsEventType, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

type UserWithoutPassword = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  private readonly logger = {
    log: (message: string) => console.log(`[UsersService] ${message}`),
    error: (message: string) => console.error(`[UsersService] ${message}`),
    warn: (message: string) => console.warn(`[UsersService] ${message}`),
  };

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ users: UserWithoutPassword[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.ENDPOINT_CALL,
      metadata: { action: 'list_users', page, limit, total },
    });

    this.logger.log(`Fetched ${users.length} users (page ${page})`);

    return { users, total, page, limit };
  }

  async findOne(id: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({
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

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.ENDPOINT_CALL,
      userId: id,
      metadata: { action: 'get_user' },
    });

    this.logger.log(`Fetched user: ${id}`);

    return user;
  }

  async findByEmail(email: string): Promise<UserWithoutPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
    role?: Role;
  }): Promise<User> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || Role.USER,
      },
    });

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.USER_ACTIVITY,
      userId: user.id,
      metadata: { action: 'create_user', email: user.email },
    });

    this.logger.log(`Created user: ${user.email}`);

    return user;
  }

  async update(id: string, data: Partial<UserWithoutPassword>): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await this.findByEmail(data.email);
      if (emailTaken) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
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

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.USER_ACTIVITY,
      userId: id,
      metadata: { action: 'update_user', fields: Object.keys(data) },
    });

    this.logger.log(`Updated user: ${id}`);

    return user;
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.delete({ where: { id } });

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.USER_ACTIVITY,
      userId: id,
      metadata: { action: 'delete_user', email: existingUser.email },
    });

    this.logger.log(`Deleted user: ${id}`);
  }

  async toggleActive(id: string): Promise<UserWithoutPassword> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: !existingUser.isActive },
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

    await this.trackAnalyticsEvent({
      type: AnalyticsEventType.USER_ACTIVITY,
      userId: id,
      metadata: {
        action: 'toggle_active',
        isActive: user.isActive,
      },
    });

    this.logger.log(
      `Toggled user ${id} active status to ${user.isActive}`,
    );

    return user;
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  private async trackAnalyticsEvent(event: {
    type: AnalyticsEventType;
    userId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          metadata: event.metadata || {},
          service: this.configService.get<string>('OTEL_SERVICE_NAME'),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to track analytics event: ${event.type}`,
      );
    }
  }
}
