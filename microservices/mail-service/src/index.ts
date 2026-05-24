import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Registry } from 'prom-client';

import { logger } from './logging/logger';
import './telemetry/tracer';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { successResponse } from './utils/response';

const app = express();
const PORT = parseInt(process.env.PORT || '3007', 10);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');

app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
}));
app.use(compression());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

const metricsRegistry = new Registry();

app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(
    successResponse({
      service: 'mail-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  );
});

app.use(routes);
app.use(errorMiddleware);

const server = app.listen(PORT, () => {
  logger.info(`Mail service listening on port ${PORT}`);
});

function gracefulShutdown(signal: string): void {
  logger.info({ message: `Received ${signal}. Starting graceful shutdown...` });
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  logger.error({ message: 'Uncaught exception', error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error({ message: 'Unhandled rejection', reason: String(reason) });
  gracefulShutdown('unhandledRejection');
});

export default app;
