import { Module, OnModuleDestroy, Provider, Inject, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

const redisProvider: Provider = {
  provide: 'QUEUE_REDIS',
  useFactory: (configService: ConfigService) => {
    const redis = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10),
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', () => {
      // Silently handle Redis errors in dev mode
    });

    return redis;
  },
  inject: [ConfigService],
};

const createQueueProvider = (name: string, queueName: string): Provider => ({
  provide: name,
  useFactory: (redis: Redis) => {
    return new Queue(queueName, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    });
  },
  inject: ['QUEUE_REDIS'],
});

@Module({
  imports: [ConfigModule],
  providers: [
    redisProvider,
    createQueueProvider('ANALYTICS_EVENTS_QUEUE', 'analytics-events'),
    createQueueProvider('NOTIFICATIONS_QUEUE', 'notifications'),
    createQueueProvider('EMAIL_JOBS_QUEUE', 'email-jobs'),
    createQueueProvider('ERROR_PROCESSING_QUEUE', 'error-processing'),
    createQueueProvider('AI_DIAGNOSTICS_QUEUE', 'ai-diagnostics'),
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule implements OnModuleDestroy {
  constructor(
    @Optional() @Inject('ANALYTICS_EVENTS_QUEUE') private readonly analyticsEventsQueue?: Queue,
    @Optional() @Inject('NOTIFICATIONS_QUEUE') private readonly notificationsQueue?: Queue,
    @Optional() @Inject('EMAIL_JOBS_QUEUE') private readonly emailJobsQueue?: Queue,
    @Optional() @Inject('ERROR_PROCESSING_QUEUE') private readonly errorProcessingQueue?: Queue,
    @Optional() @Inject('AI_DIAGNOSTICS_QUEUE') private readonly aiDiagnosticsQueue?: Queue,
    @Optional() @Inject('QUEUE_REDIS') private readonly redis?: Redis,
  ) {}

  async onModuleDestroy() {
    const queues = [
      this.analyticsEventsQueue,
      this.notificationsQueue,
      this.emailJobsQueue,
      this.errorProcessingQueue,
      this.aiDiagnosticsQueue,
    ].filter(Boolean);

    await Promise.all(queues.map((q) => q!.close().catch(() => {})));
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // Ignore quit errors
      }
    }
  }
}
