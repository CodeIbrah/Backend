import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppConfigModule } from './config/app.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LoggingModule } from './logging/logging.module';
import { ReportsModule } from './reports/reports.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { HealthController } from './modules/health/health.controller';
import { MetricsController } from './modules/metrics/metrics.controller';
import { OpsModule } from './modules/ops/ops.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Optional modules — imported for registration; they self-configure via factory providers
import { WebsocketModule } from './websocket/websocket.module';
import { CacheModule } from './cache/cache.module';
import { AuditModule } from './audit/audit.module';
import { GrpcModule } from './grpc/grpc.module';
import { SocialAuthModule } from './social-auth/social-auth.module';
import { CipherModule } from './cipher/cipher.module';

@Module({
  imports: [
    // --- Core ---
    AppConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TerminusModule,

    // --- Logging ---
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'debug',
      defaultMeta: { service: process.env.OTEL_SERVICE_NAME || 'backend-template' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}] ${ctx} ${message}${metaStr}`;
            }),
          ),
        }),
      ],
    }),

    // --- Domain modules ---
    AuthModule,
    UsersModule,
    LoggingModule,
    ReportsModule,
    ActivityLogModule,
    OpsModule,

    // --- Optional: Analytics WebSocket (real-time event broadcasting) ---
    // Requires: @nestjs/platform-socket.io, @nestjs/websockets
    // Disable: remove WebsocketModule from imports
    WebsocketModule,

    // --- Optional: Redis cache layer ---
    // Requires: REDIS_URL env, ioredis
    // Disable: set CACHE_ENABLED=false or remove REDIS_URL
    CacheModule,

    // --- Optional: DB audit trail ---
    // Tracks CRUD operations on entities via AuditService.log()
    // Disable: set AUDIT_ENABLED=false
    AuditModule,

    // --- Optional: gRPC server/client ---
    // Requires: GRPC_ENABLED=true and GRPC_PORT (default 50051)
    // Disable: set GRPC_ENABLED=false or remove GrpcModule
    GrpcModule.forRoot(),

    // --- Field-level encryption (AES-256-GCM) ---
    // Encrypts sensitive fields at rest (tokens, PII, API keys).
    // Requires ENCRYPTION_KEY env var (min 32 chars).
    CipherModule,

    // --- Social login (Google, Meta, Microsoft, GitHub, GitLab, Apple) ---
    // Each provider auto-detects its env vars; only configured ones are active.
    SocialAuthModule,

    // --- Telemetry (gracefully degrades if OTel is unavailable) ---
    TelemetryModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
