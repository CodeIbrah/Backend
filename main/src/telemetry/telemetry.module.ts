import { Module, OnApplicationShutdown } from '@nestjs/common';
import { initOpenTelemetry, shutdownOpenTelemetry } from './otel';

@Module({})
export class TelemetryModule implements OnApplicationShutdown {
  constructor() {
    initOpenTelemetry().catch(() => {
      console.warn('[TelemetryModule] OpenTelemetry not available, skipping');
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await shutdownOpenTelemetry();
  }
}
