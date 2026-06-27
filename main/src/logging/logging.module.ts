import { Module } from '@nestjs/common';

/**
 * LoggingModule serves as the registration container for Winston-based logging infrastructure.
 *
 * The actual WinstonModule.forRoot() configuration is done in AppModule.
 * The LoggingInterceptor (provides structured request/response logging with correlation IDs)
 * is registered globally via APP_INTERCEPTOR in AppModule.
 *
 * This module exists for future logging-related providers (e.g. custom log formatters,
 * log-level management, remote log shipping).
 */
@Module({})
export class LoggingModule {}
