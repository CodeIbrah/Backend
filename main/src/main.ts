import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import * as cors from 'cors';
import * as csurf from 'csurf';
import * as compression from 'compression';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  // --- HTTPS / TLS 1.2+ support ---
  // Provide SSL_KEY_PATH and SSL_CERT_PATH env vars to enable HTTPS.
  // TLS termination typically happens at the reverse proxy (nginx, Cloud Run, ELB)
  // in production; this enables direct TLS when needed.
  const httpsOptions = loadTlsOptions();
  const listenProtocol = httpsOptions ? 'HTTPS' : 'HTTP';

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    abortOnError: false,
    ...(httpsOptions ? { httpsOptions } : {}),
  });

  const configService = app.get<ConfigService>(ConfigService);
  const logger = app.get<Logger>(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);

  // ---- Security headers (HSTS included, TLS 1.2+) ----
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.setGlobalPrefix('api/v1');

  // Compression (gzip/brotli)
  app.use(compression());

  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  app.use(
    cors({
      origin: corsOrigin === '*' ? ['http://localhost:3000'] : corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );

  // CSRF protection - disabled in development
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  if (nodeEnv === 'production') {
    app.use(
      csurf({
        cookie: {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        },
      }),
    );
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('APP_NAME', 'Backend API'))
    .setDescription('Enterprise Backend API')
    .setVersion(configService.get<string>('APP_VERSION', '1.0.0'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 3000);
  const httpServer = app.getHttpServer() as { close: (callback?: () => void) => void };  

  try {
    await app.listen(port);
    logger.log(`Application is running on port ${port} (${listenProtocol})`, 'Bootstrap');
  } catch (err) {
    logger.error(`Failed to start on port ${port}: ${(err as Error).message}`, 'Bootstrap');
    process.exit(1);
  }

  const signals = ['SIGINT', 'SIGTERM'] as const;
  for (const signal of signals) {
    process.on(signal, (): void => {
      logger.log(`Received ${signal}, starting graceful shutdown...`, 'Bootstrap');
      void app.close();
      httpServer.close();
      process.exit(0);
    });
  }
}

/**
 * Load TLS options from environment variables.
 * Provide SSL_KEY_PATH and SSL_CERT_PATH pointing to PEM files.
 * Optionally SSL_CA_PATH for intermediate CA bundles.
 */
function loadTlsOptions(): { key: string; cert: string; ca?: string } | null {
  const keyPath = process.env['SSL_KEY_PATH'];
  const certPath = process.env['SSL_CERT_PATH'];

  if (!keyPath || !certPath) return null;

  try {
    const key = fs.readFileSync(keyPath, 'utf-8');
    const cert = fs.readFileSync(certPath, 'utf-8');
    const caPath = process.env['SSL_CA_PATH'];
    const ca = caPath ? fs.readFileSync(caPath, 'utf-8') : undefined;
    console.log(`[Bootstrap] TLS certificates loaded (key: ${keyPath}, cert: ${certPath})`);
    return { key, cert, ca };
  } catch (err) {
    console.warn(`[Bootstrap] Failed to load TLS certificates: ${(err as Error).message}. Falling back to HTTP.`);
    return null;
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});