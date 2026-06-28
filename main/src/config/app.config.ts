import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import * as path from 'path';

const DEFAULT_SECRETS = [
  'change-me-in-production',
  'secret',
  'password',
  '123456',
  'jwt-secret',
  'your-secret-key',
];

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  APP_NAME: Joi.string().required(),
  APP_VERSION: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  OTEL_SERVICE_NAME: Joi.string().required(),
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
  LOG_LEVEL: Joi.string().default('debug'),
  LOG_FORMAT: Joi.string().valid('json', 'pretty').default('json'),

  // Encryption
  ENCRYPTION_KEY: Joi.string().min(0).default(''),

  // TLS (optional — no validation required for file paths)
  SSL_KEY_PATH: Joi.string().optional().allow(''),
  SSL_CERT_PATH: Joi.string().optional().allow(''),
  SSL_CA_PATH: Joi.string().optional().allow(''),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', path.resolve(__dirname, '../../../.env')],
      validationSchema: envSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    if (nodeEnv === 'production') {
      if (DEFAULT_SECRETS.includes(jwtSecret?.toLowerCase() || '')) {
        throw new Error(
          'CRITICAL: JWT_SECRET is set to a default value in production. ' +
            'Generate a strong secret using: openssl rand -hex 32',
        );
      }

      if ((jwtSecret?.length || 0) < 32) {
        throw new Error(
          'CRITICAL: JWT_SECRET must be at least 32 characters in production. ' +
            'Generate a strong secret using: openssl rand -hex 32',
        );
      }
    }
  }
}
