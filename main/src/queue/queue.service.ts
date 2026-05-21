import { Injectable, Inject } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class QueueService {
  constructor(
    @Inject('ANALYTICS_EVENTS_QUEUE') private readonly analyticsQueue: Queue,
    @Inject('NOTIFICATIONS_QUEUE') private readonly notificationsQueue: Queue,
    @Inject('EMAIL_JOBS_QUEUE') private readonly emailJobsQueue: Queue,
    @Inject('ERROR_PROCESSING_QUEUE') private readonly errorProcessingQueue: Queue,
    @Inject('AI_DIAGNOSTICS_QUEUE') private readonly aiDiagnosticsQueue: Queue,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  private getQueueByName(queueName: string): Queue {
    const queues: Record<string, Queue> = {
      'analytics-events': this.analyticsQueue,
      notifications: this.notificationsQueue,
      'email-jobs': this.emailJobsQueue,
      'error-processing': this.errorProcessingQueue,
      'ai-diagnostics': this.aiDiagnosticsQueue,
    };
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }
    return queue;
  }

  async addAnalyticsEvent(data: any): Promise<Job> {
    this.logger.info('Adding analytics event to queue', { data });
    return this.analyticsQueue.add('analytics-event', data);
  }

  async addNotification(data: any): Promise<Job> {
    this.logger.info('Adding notification to queue', { data });
    return this.notificationsQueue.add('notification', data);
  }

  async addEmailJob(data: any): Promise<Job> {
    this.logger.info('Adding email job to queue', { data });
    return this.emailJobsQueue.add('email-job', data);
  }

  async addErrorProcessing(data: any): Promise<Job> {
    this.logger.info('Adding error processing job to queue', { data });
    return this.errorProcessingQueue.add('error-processing', data);
  }

  async addAIDiagnostic(data: any): Promise<Job> {
    this.logger.info('Adding AI diagnostic job to queue', { data });
    return this.aiDiagnosticsQueue.add('ai-diagnostic', data);
  }

  async getQueueStatus(queueName: string): Promise<{ name: string; count: number; isActive: boolean }> {
    const queue = this.getQueueByName(queueName);
    const counts = await queue.getJobCounts();
    const total = counts.waiting + counts.active + counts.delayed;
    return {
      name: queueName,
      count: total,
      isActive: counts.active > 0,
    };
  }

  async clearQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    await queue.obliterate({ force: true });
    this.logger.info('Queue cleared', { queueName });
  }

  async retryFailed(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    const failedJobs = await queue.getJobs(['failed']);
    for (const job of failedJobs) {
      await job.retry();
    }
    this.logger.info('Failed jobs retried', { queueName, count: failedJobs.length });
  }
}
