import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('PrismaService');

  /**
   * Connection pool tuning is configured via DATABASE_URL query params:
   *   DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30
   *
   *   - connection_limit: max connections in the pool (default: 20)
   *   - pool_timeout:     max time (seconds) to wait for a connection (default: 30)
   *
   * Prisma uses PgBouncer-compatible PgBond pooling (external pooler not required).
   * See: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
   */

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (err) {
      this.logger.warn(
        `Database connection failed: ${(err as Error).message}. App will start without DB.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}
