import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
}

const DEFAULT_TTL = 300; // 5 minutes
const DEFAULT_PREFIX = 'cache:';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private _client: Redis | null = null;
  private _enabled = false;

  constructor(redisUrl: string);
  constructor(client: Redis);
  constructor(connection: string | Redis) {
    if (typeof connection === 'string') {
      if (!connection) {
        this.logger.warn('Cache disabled: no Redis URL configured');
        return;
      }
      try {
        this._client = new Redis(connection, {
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) return null;
            return Math.min(times * 200, 2000);
          },
          enableOfflineQueue: false,
        });
        this._client.on('error', (err: Error) => {
          this.logger.warn(`Cache Redis error: ${err.message}. Cache degraded.`);
        });
        this._enabled = true;
      } catch {
        this.logger.warn('Cache disabled: Redis connection failed');
      }
    } else if (connection) {
      this._client = connection;
      this._enabled = true;
    } else {
      this.logger.warn('Cache disabled: no Redis instance provided');
    }
  }

  get enabled(): boolean {
    return this._enabled && this._client !== null;
  }

  private getClient(): Redis | null {
    if (!this._enabled || !this._client) return null;
    return this._client;
  }

  private buildKey(key: string, prefix = DEFAULT_PREFIX): string {
    return `${prefix}${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      const raw = await client.get(this.buildKey(key));
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache get error for key "${key}": ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown, options?: CacheOptions): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      const cacheKey = this.buildKey(key, options?.prefix);
      const ttl = options?.ttl ?? DEFAULT_TTL;
      const serialized = JSON.stringify(value);
      await client.setex(cacheKey, ttl, serialized);
      return true;
    } catch (err) {
      this.logger.warn(`Cache set error for key "${key}": ${(err as Error).message}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.del(this.buildKey(key));
      return true;
    } catch (err) {
      this.logger.warn(`Cache del error for key "${key}": ${(err as Error).message}`);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const client = this.getClient();
    if (!client) return 0;
    try {
      let cursor = '0';
      let deleted = 0;
      do {
        const result = await client.scan(cursor, 'MATCH', this.buildKey(pattern), 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          const count = await client.del(...keys);
          deleted += count;
        }
      } while (cursor !== '0');
      return deleted;
    } catch (err) {
      this.logger.warn(`Cache invalidate error for pattern "${pattern}": ${(err as Error).message}`);
      return 0;
    }
  }

  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fallback();
    await this.set(key, value, options);
    return value;
  }

  async disconnect(): Promise<void> {
    const client = this.getClient();
    if (client) {
      try {
        await client.quit();
      } catch {
        // ignore quit errors
      }
      this._enabled = false;
    }
  }
}
