import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
});

interface NotificationJobData {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
}

async function handleNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  const span = tracer.startSpan('notifications.processJob');

  try {
    const { notificationId, userId, type, message } = job.data;

    span.setAttribute('notificationId', notificationId);
    span.setAttribute('userId', userId);
    span.setAttribute('type', type);

    logger.info({
      message: 'Processing notification',
      notificationId,
      userId,
      type,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    span.addEvent('Notification processed successfully');

    logger.info({ message: 'Notification processed', notificationId });
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: 2, message: (error as Error).message });
    logger.error({ message: 'Failed to process notification job', error, jobId: job.id });
    throw error;
  } finally {
    span.end();
  }
}

export async function processNotificationJob(): Promise<Worker> {
  const worker = new Worker<NotificationJobData>(
    'notifications',
    handleNotificationJob,
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ message: 'Notification job completed', jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error({ message: 'Notification job failed', jobId: job?.id, error: err.message });
  });

  worker.on('error', (err) => {
    logger.error({ message: 'Worker error', error: err.message });
  });

  return worker;
}
