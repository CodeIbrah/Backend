import { Module, OnModuleDestroy, Provider, Inject } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsProcessor } from './analytics.processor';

const redisProvider: Provider = {
  provide: 'ANALYTICS_REDIS',
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    });
  },
  inject: [ConfigService],
};

const queueProvider: Provider = {
  provide: 'ANALYTICS_QUEUE',
  useFactory: (redis: Redis) => {
    return new Queue('analytics-events', { connection: redis });
  },
  inject: ['ANALYTICS_REDIS'],
};

const workerProvider: Provider = {
  provide: 'ANALYTICS_WORKER',
  useFactory: (redis: Redis, processor: AnalyticsProcessor) => {
    const worker = new Worker(
      'analytics-events',
      (job) => processor.process(job),
      {
        connection: redis,
        concurrency: 5,
      },
    );

    worker.on('error', (err) => {
      console.error('Analytics worker error:', err);
    });

    return worker;
  },
  inject: ['ANALYTICS_REDIS', AnalyticsProcessor],
};

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AnalyticsController],
  providers: [redisProvider, queueProvider, workerProvider, AnalyticsService, AnalyticsProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule implements OnModuleDestroy {
  constructor(
    @Inject('ANALYTICS_WORKER') private readonly analyticsWorker: Worker,
    @Inject('ANALYTICS_QUEUE') private readonly analyticsQueue: Queue,
    @Inject('ANALYTICS_REDIS') private readonly redis: Redis,
  ) {}

  async onModuleDestroy() {
    await this.analyticsWorker.close();
    await this.analyticsQueue.close();
    await this.redis.quit();
  }
}
