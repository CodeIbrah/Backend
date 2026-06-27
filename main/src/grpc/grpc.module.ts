import { Module, DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GrpcServerService } from './grpc-server.service';
import { GrpcClientService } from './grpc-client.service';

@Module({})
export class GrpcModule implements OnModuleDestroy {
  private static serverService: GrpcServerService | null = null;

  /**
   * Register the gRPC server so the main NestJS app also listens as a gRPC endpoint.
   * Enabled when GRPC_ENABLED=true and GRPC_PORT is set.
   */
  static forRoot(): DynamicModule {
    return {
      module: GrpcModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: GrpcServerService,
          useFactory: (configService: ConfigService): GrpcServerService => {
            const enabled = configService.get<boolean>('GRPC_ENABLED', false);
            if (!enabled) {
              return new GrpcServerService(null as unknown as number);
            }
            const port = configService.get<number>('GRPC_PORT', 50051);
            return new GrpcServerService(port);
          },
          inject: [ConfigService],
        },
        {
          provide: GrpcClientService,
          useFactory: (): GrpcClientService => new GrpcClientService(),
        },
      ],
      exports: [GrpcServerService, GrpcClientService],
    };
  }

  constructor() {
    // gRPC server is auto-started by GrpcServerService
  }

  async onModuleDestroy(): Promise<void> {
    await GrpcModule.serverService?.onModuleDestroy();
  }
}
