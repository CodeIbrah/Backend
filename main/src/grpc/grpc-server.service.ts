import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

export interface GrpcHealthCheckResponse {
  status: 'SERVING' | 'NOT_SERVING';
}

@Injectable()
export class GrpcServerService implements OnModuleDestroy {
  private readonly logger = new Logger(GrpcServerService.name);
  private readonly port: number | null;
  private server: { shutdown: () => Promise<void> } | null = null;
  private _enabled = false;

  constructor(port: number | null) {
    this.port = port;
    if (port === null || port <= 0) {
      this.logger.warn('gRPC server disabled: no port configured');
      return;
    }
    this._enabled = true;
    this.logger.log(`gRPC server configured on port ${port}`);
    // In production, this would start a proper gRPC server
    // For the template, we provide the integration point
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get grpcPort(): number | null {
    return this.port;
  }

  /**
   * Check if the gRPC server is serving.
   * This is the standard health check protocol response.
   */
  check(): GrpcHealthCheckResponse {
    if (!this._enabled) return { status: 'NOT_SERVING' };
    return { status: 'SERVING' };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.server) {
      await this.server.shutdown();
      this.logger.log('gRPC server shut down');
    }
  }
}
