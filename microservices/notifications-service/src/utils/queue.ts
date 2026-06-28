import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';

let _redis: Redis | null = null;
let _redisFailed = false;

function getRedis(): Redis | null {
  if (_redisFailed) return null;
  if (!_redis) {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    _redis = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          _redisFailed = true;
          logger.error('Redis unavailable after 3 retries — notifications queue disabled');
          _redis?.disconnect();
          _redis = null;
          return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true,
    });
    _redis.on('error', (err: Error) => {
      if (!_redisFailed) {
        logger.error(`Redis connection error: ${err.message}`);
      }
    });
    _redis.connect().catch(() => {
      _redisFailed = true;
      logger.warn('Redis not available — notifications queue will be disabled');
    });
  }
  return _redis;
}

interface NotificationJobData {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
}

let _queue: Queue<NotificationJobData> | null = null;

export function getNotificationQueue(): Queue<NotificationJobData> | null {
  const conn = getRedis();
  if (!conn) return null;
  if (!_queue) {
    _queue = new Queue<NotificationJobData>('notifications', {
      connection: conn,
    });
  }
  return _queue;
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

export async function processNotificationJob(): Promise<Worker | null> {
  const conn = getRedis();
  if (!conn) {
    logger.warn('BullMQ worker not started — Redis unavailable');
    return null;
  }

  const worker = new Worker<NotificationJobData>('notifications', handleNotificationJob, {
    connection: conn,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info({ message: 'Notification job completed', jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error({ message: 'Notification job failed', jobId: job?.id, error: err.message });
  });

  worker.on('error', (err) => {
    logger.debug(`Worker connection error: ${err.message}`);
  });

  logger.info('BullMQ notification worker started');
  return worker;
}
