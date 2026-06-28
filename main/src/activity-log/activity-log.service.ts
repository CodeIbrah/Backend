import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLog, ActivityType, ActivitySeverity, Prisma } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { QueryActivityDto } from './dto/query-activity.dto';

interface LogActivityData {
  userId?: string;
  type: string;
  action: string;
  resource?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  severity?: string;
}

interface ActivityFilters {
  type?: ActivityType;
  severity?: ActivitySeverity;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  async logActivity(data: LogActivityData): Promise<ActivityLog> {
    try {
      const activity = await this.prisma.activityLog.create({
        data: {
          userId: data.userId || null,
          type: data.type as ActivityType,
          severity: (data.severity as ActivitySeverity) || ActivitySeverity.INFO,
          action: data.action,
          resource: data.resource || null,
          description: data.description || null,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          traceId: data.traceId || null,
        },
      });

      this.logger.debug(`Activity logged: ${data.action} for user ${data.userId || 'anonymous'}`);

      return activity;
    } catch (error) {
      this.logger.error(`Failed to log activity: ${data.action}`, { error });
      throw error;
    }
  }

  async logLogin(
    userId: string,
    success: boolean,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.logActivity({
      userId,
      type: success ? ActivityType.LOGIN : ActivityType.LOGIN_FAILED,
      action: success ? 'User login successful' : 'User login failed',
      description: success
        ? `User ${userId} logged in successfully`
        : `Failed login attempt for user ${userId}`,
      metadata: metadata || {},
      severity: success ? ActivitySeverity.INFO : ActivitySeverity.WARNING,
    });
  }

  async logLogout(userId: string): Promise<void> {
    await this.logActivity({
      userId,
      type: ActivityType.LOGOUT,
      action: 'User logout',
      description: `User ${userId} logged out`,
      severity: ActivitySeverity.INFO,
    });
  }

  async logPayment(
    userId: string,
    paymentId: string,
    type: 'PAYMENT_CREATED' | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED',
    amount: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const activityTypeMap = {
      PAYMENT_CREATED: ActivityType.PAYMENT_CREATED,
      PAYMENT_COMPLETED: ActivityType.PAYMENT_COMPLETED,
      PAYMENT_FAILED: ActivityType.PAYMENT_FAILED,
      PAYMENT_REFUNDED: ActivityType.PAYMENT_REFUNDED,
    };

    const severityMap = {
      PAYMENT_CREATED: ActivitySeverity.INFO,
      PAYMENT_COMPLETED: ActivitySeverity.INFO,
      PAYMENT_FAILED: ActivitySeverity.ERROR,
      PAYMENT_REFUNDED: ActivitySeverity.WARNING,
    };

    await this.logActivity({
      userId,
      type: activityTypeMap[type],
      action: type.replace(/_/g, ' ').toLowerCase(),
      resource: `payment:${paymentId}`,
      description: `Payment ${type.toLowerCase()} for user ${userId}, amount: ${amount}`,
      metadata: { paymentId, amount, ...metadata },
      severity: severityMap[type],
    });
  }

  async logInvoice(
    userId: string,
    invoiceId: string,
    action: 'INVOICE_GENERATED' | 'INVOICE_DOWNLOADED',
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const activityTypeMap = {
      INVOICE_GENERATED: ActivityType.INVOICE_GENERATED,
      INVOICE_DOWNLOADED: ActivityType.INVOICE_DOWNLOADED,
    };

    await this.logActivity({
      userId,
      type: activityTypeMap[action],
      action: action.replace(/_/g, ' ').toLowerCase(),
      resource: `invoice:${invoiceId}`,
      description: `Invoice ${action.toLowerCase()} for user ${userId}`,
      metadata: { invoiceId, ...metadata },
      severity: ActivitySeverity.INFO,
    });
  }

  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.logActivity({
      userId,
      type: this.mapUserActionToType(action),
      action,
      resource,
      description: `User action: ${action} on ${resource}`,
      metadata,
      severity: ActivitySeverity.INFO,
    });
  }

  async getUserActivities(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: ActivityFilters,
  ): Promise<{ activities: ActivityLog[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...this.buildWhereClause(filters),
    };

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { activities, total };
  }

  async getSystemActivities(
    page: number = 1,
    limit: number = 20,
    filters?: ActivityFilters,
  ): Promise<{ activities: ActivityLog[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return { activities, total };
  }

  async getActivitiesByType(type: ActivityType, limit: number = 50): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: { type },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getRecentCriticalActivities(limit: number = 20): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: {
        severity: {
          in: [ActivitySeverity.CRITICAL, ActivitySeverity.ERROR],
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getActivityStats(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<{
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byUser: Record<string, number>;
    total: number;
  }> {
    const where: Record<string, Record<string, Date>> = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const activities = await this.prisma.activityLog.findMany({
      where,
      select: {
        type: true,
        severity: true,
        userId: true,
      },
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    for (const activity of activities) {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
      bySeverity[activity.severity] = (bySeverity[activity.severity] || 0) + 1;
      if (activity.userId) {
        byUser[activity.userId] = (byUser[activity.userId] || 0) + 1;
      }
    }

    return {
      byType,
      bySeverity,
      byUser,
      total: activities.length,
    };
  }

  async exportActivities(filters?: QueryActivityDto): Promise<ActivityLog[]> {
    const where = this.buildWhereClause({
      type: filters?.type,
      severity: filters?.severity,
      userId: filters?.userId,
      dateFrom: filters?.dateFrom,
      dateTo: filters?.dateTo,
      search: filters?.search,
    });

    return this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async getActivityById(id: string): Promise<ActivityLog> {
    const activity = await this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity log with ID ${id} not found`);
    }

    return activity;
  }

  private buildWhereClause(filters?: ActivityFilters): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.createdAt = dateFilter;
    }

    if (filters?.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { resource: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private mapUserActionToType(action: string): ActivityType {
    const actionMap: Record<string, ActivityType> = {
      create: ActivityType.USER_CREATED,
      update: ActivityType.USER_UPDATED,
      delete: ActivityType.USER_DELETED,
      'role-change': ActivityType.ROLE_CHANGED,
      'password-change': ActivityType.PASSWORD_CHANGED,
      'settings-update': ActivityType.SETTINGS_UPDATED,
      'data-export': ActivityType.DATA_EXPORTED,
      'permission-grant': ActivityType.PERMISSION_GRANTED,
      'permission-revoke': ActivityType.PERMISSION_REVOKED,
      'api-key-create': ActivityType.API_KEY_CREATED,
      'api-key-revoke': ActivityType.API_KEY_REVOKED,
      'config-change': ActivityType.CONFIG_CHANGED,
    };

    return actionMap[action] || ActivityType.USER_UPDATED;
  }
}
