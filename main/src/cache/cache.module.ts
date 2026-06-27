import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CacheService,
      useFactory: (configService: ConfigService): CacheService => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const enabled = configService.get<boolean>('CACHE_ENABLED', true);
        if (!redisUrl || !enabled) {
          return new CacheService(null as unknown as import('ioredis').Redis);
        }
        return new CacheService(redisUrl);
      },
      inject: [ConfigService],
    },
  ],
  exports: [CacheService],
})
export class CacheModule implements OnModuleDestroy {
  constructor(private readonly cacheService: CacheService) {}

  async onModuleDestroy(): Promise<void> {
    await this.cacheService.disconnect();
  }
}
