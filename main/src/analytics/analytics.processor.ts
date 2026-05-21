import { Injectable, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AnalyticsEventType } from '@prisma/client';

@Injectable()
export class AnalyticsProcessor {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: Logger,
  ) {}

  async process(job: Job<{ type: AnalyticsEventType; data: any; timestamp: Date }>): Promise<void> {
    const { type, data, timestamp } = job.data;

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          type,
          userId: data?.userId ?? null,
          metadata: data ?? {},
          service: data?.service ?? null,
          traceId: data?.traceId ?? null,
          timestamp: timestamp ?? new Date(),
        },
      });

      this.logger.debug('Analytics event saved', {
        jobId: job.id,
        type,
      });
    } catch (error) {
      this.logger.error('Failed to save analytics event', {
        jobId: job.id,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
