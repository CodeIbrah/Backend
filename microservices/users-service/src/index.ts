import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Registry } from 'prom-client';
import { connectPrisma, disconnectPrisma, prisma } from '@backend/shared-prisma';

import { logger } from './logging/logger';
import './telemetry/tracer';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { successResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

app.use(helmet());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
  }),
);
app.use(compression());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const metricsRegistry = new Registry();

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json(
      successResponse({
        service: 'users-service',
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    );
  } catch {
    res.status(503).json(
      successResponse({
        service: 'users-service',
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
    );
  }
});

app.use(routes);

app.use(errorMiddleware);

let server: ReturnType<typeof app.listen>;

async function start() {
  try {
    await connectPrisma();
    server = app.listen(PORT, () => {
      logger.info(`Users service listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start users service: ${(err as Error).message}`);
    process.exit(1);
  }
}

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();

export default app;
