import { Injectable, Logger } from '@nestjs/common';

export interface GrpcClientOptions {
  url: string;
  packageName: string;
  serviceName: string;
  protoPath: string;
  credentials?: 'insecure' | 'ssl';
}

@Injectable()
export class GrpcClientService {
  private readonly logger = new Logger(GrpcClientService.name);
  private clients = new Map<string, unknown>();

  /**
   * Register a gRPC service client.
   * The actual connection is lazy-established on first call.
   */
  registerClient(options: GrpcClientOptions): void {
    const key = `${options.packageName}.${options.serviceName}`;
    if (this.clients.has(key)) {
      this.logger.warn(`gRPC client already registered: ${key}`);
      return;
    }

    this.logger.log(
      `gRPC client registered: ${key} -> ${options.url} (proto: ${options.protoPath})`,
    );

    // Store options; actual client creation would happen here in production.
    // For the template, we store the configuration as the integration point.
    this.clients.set(key, options);
  }

  /**
   * Get a registered client by package.service name.
   * Returns the client options; actual gRPC client would be created here.
   */
  getClient(packageName: string, serviceName: string): GrpcClientOptions | null {
    const key = `${packageName}.${serviceName}`;
    const client = this.clients.get(key);
    if (!client) {
      this.logger.warn(`gRPC client not found: ${key}`);
      return null;
    }
    return client as GrpcClientOptions;
  }

  /**
   * Check if a client is registered.
   */
  hasClient(packageName: string, serviceName: string): boolean {
    return this.clients.has(`${packageName}.${serviceName}`);
  }

  /**
   * List all registered gRPC clients.
   */
  listClients(): string[] {
    return Array.from(this.clients.keys());
  }
}
