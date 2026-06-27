import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> => this.pingDatabase('database'),
    ]);
  }

  /**
   * Readiness probe — checks dependencies are ready for traffic.
   * Used by Kubernetes readinessProbe.
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for K8s' })
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> => this.pingDatabase('database'),
    ]);
  }

  /**
   * Liveness probe — lightweight check that the process is alive.
   * Used by Kubernetes livenessProbe.
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for K8s' })
  checkLive(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  private async pingDatabase(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { [key]: { status: 'up' } };
    } catch (err) {
      this.logger.warn(`Health check failed for ${key}: ${(err as Error).message}`);
      return { [key]: { status: 'down', message: (err as Error).message } };
    }
  }
}
