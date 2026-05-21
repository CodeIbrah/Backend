import { Module, OnModuleDestroy, Provider, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

const redisProvider: Provider = {
  provide: 'QUEUE_REDIS',
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

const analyticsQueueProvider: Provider = {
  provide: 'ANALYTICS_EVENTS_QUEUE',
  useFactory: (redis: Redis) => {
    return new Queue('analytics-events', { connection: redis });
  },
  inject: ['QUEUE_REDIS'],
};

const notificationsQueueProvider: Provider = {
  provide: 'NOTIFICATIONS_QUEUE',
  useFactory: (redis: Redis) => {
    return new Queue('notifications', { connection: redis });
  },
  inject: ['QUEUE_REDIS'],
};

const emailJobsQueueProvider: Provider = {
  provide: 'EMAIL_JOBS_QUEUE',
  useFactory: (redis: Redis) => {
    return new Queue('email-jobs', { connection: redis });
  },
  inject: ['QUEUE_REDIS'],
};

const errorProcessingQueueProvider: Provider = {
  provide: 'ERROR_PROCESSING_QUEUE',
  useFactory: (redis: Redis) => {
    return new Queue('error-processing', { connection: redis });
  },
  inject: ['QUEUE_REDIS'],
};

const aiDiagnosticsQueueProvider: Provider = {
  provide: 'AI_DIAGNOSTICS_QUEUE',
  useFactory: (redis: Redis) => {
    return new Queue('ai-diagnostics', { connection: redis });
  },
  inject: ['QUEUE_REDIS'],
};

@Module({
  imports: [ConfigModule],
  providers: [
    redisProvider,
    analyticsQueueProvider,
    notificationsQueueProvider,
    emailJobsQueueProvider,
    errorProcessingQueueProvider,
    aiDiagnosticsQueueProvider,
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule implements OnModuleDestroy {
  constructor(
    @Inject('ANALYTICS_EVENTS_QUEUE') private readonly analyticsEventsQueue: Queue,
    @Inject('NOTIFICATIONS_QUEUE') private readonly notificationsQueue: Queue,
    @Inject('EMAIL_JOBS_QUEUE') private readonly emailJobsQueue: Queue,
    @Inject('ERROR_PROCESSING_QUEUE') private readonly errorProcessingQueue: Queue,
    @Inject('AI_DIAGNOSTICS_QUEUE') private readonly aiDiagnosticsQueue: Queue,
    @Inject('QUEUE_REDIS') private readonly redis: Redis,
  ) {}

  async onModuleDestroy() {
    await Promise.all([
      this.analyticsEventsQueue.close(),
      this.notificationsQueue.close(),
      this.emailJobsQueue.close(),
      this.errorProcessingQueue.close(),
      this.aiDiagnosticsQueue.close(),
    ]);
    await this.redis.quit();
  }
}
