import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'EXPORT' | 'CONFIG_CHANGE';
  entity: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  diff?: Record<string, { from: unknown; to: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly _enabled: boolean;

  constructor(enabled: boolean);
  constructor(prisma: PrismaService);
  constructor(private readonly prismaOrEnabled?: PrismaService | boolean) {
    this._enabled = true;
    if (typeof prismaOrEnabled === 'boolean') {
      this._enabled = prismaOrEnabled;
    }
    if (!this._enabled) {
      this.logger.warn('Audit trail disabled via AUDIT_ENABLED=false');
    }
  }

  private get prisma(): PrismaService | null {
    if (this.prismaOrEnabled instanceof PrismaService) {
      return this.prismaOrEnabled;
    }
    return null;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  async log(entry: AuditEntry): Promise<void> {
    if (!this._enabled) return;

    try {
      const prisma = this.prismaOrEnabled instanceof PrismaService ? this.prismaOrEnabled : null;
      if (!prisma || !('$queryRaw' in prisma)) return;

      // Calculate diff if both old and new values are provided
      const diff = entry.diff ?? this.computeDiff(entry.oldValue, entry.newValue);

      const details: Record<string, unknown> = {
        entity: entry.entity,
        entityId: entry.entityId,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        diff,
        metadata: entry.metadata ?? {},
      };

      await prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action: entry.action,
          resource: `${entry.entity}${entry.entityId ? `:${entry.entityId}` : ''}`,
          details: details as Prisma.InputJsonValue,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });

      this.logger.debug(
        `Audit logged: ${entry.action} on ${entry.entity}:${entry.entityId ?? '*'}`,
      );
    } catch (err) {
      this.logger.error(`Failed to log audit entry: ${(err as Error).message}`);
    }
  }

  async find(params: {
    entity?: string;
    action?: string;
    userId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: unknown[]; total: number }> {
    if (!this._enabled) return { entries: [], total: 0 };

    const prisma = this.prismaOrEnabled instanceof PrismaService ? this.prismaOrEnabled : null;
    if (!prisma) return { entries: [], total: 0 };

    const where: Record<string, unknown> = {};
    if (params.entity) where.resource = { contains: params.entity };
    if (params.action) where.action = params.action;
    if (params.userId) where.userId = params.userId;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as Record<string, unknown>).gte = params.from;
      if (params.to) (where.createdAt as Record<string, unknown>).lte = params.to;
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit ?? 50,
        skip: params.offset ?? 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { entries, total };
  }

  private computeDiff(
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
  ): Record<string, { from: unknown; to: unknown }> | undefined {
    if (!oldValue || !newValue) return undefined;

    const diff: Record<string, { from: unknown; to: unknown }> = {};
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
      if (key === 'updatedAt' || key === 'password') continue;
      const from = oldValue[key];
      const to = newValue[key];
      if (JSON.stringify(from) !== JSON.stringify(to)) {
        diff[key] = { from, to };
      }
    }

    return Object.keys(diff).length > 0 ? diff : undefined;
  }
}
