import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { WinstonModule } from 'nest-winston';
import { AppConfigModule } from './config/app.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { LoggingModule } from './logging/logging.module';
import { ReportsModule } from './reports/reports.module';
import { AiDoctorModule } from './ai-doctor/ai-doctor.module';
import { QueueModule } from './queue/queue.module';
import { OpsModule } from './modules/ops/ops.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { HealthController } from './modules/health/health.controller';
import { MetricsController } from './modules/metrics/metrics.controller';

import { WebsocketModule } from './websocket/websocket.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TerminusModule,
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'debug',
      format:
        process.env.LOG_FORMAT === 'json'
          ? undefined
          : undefined,
      defaultMeta: { service: process.env.OTEL_SERVICE_NAME || 'backend-template' },
      transports: [
        new (require('winston').transports).Console({
          format: require('nest-winston').utilities.format.nestLike(process.env.APP_NAME, {
            colors: true,
            prettyPrint: true,
          }),
        }),
      ],
    }),
    AuthModule,
    UsersModule,
    AnalyticsModule,
    TelemetryModule,
    LoggingModule,
    ReportsModule,
    AiDoctorModule,
    QueueModule,
    OpsModule,
    ActivityLogModule,
    WebsocketModule,
    PaymentsModule,
    InvoicesModule,
  ],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
