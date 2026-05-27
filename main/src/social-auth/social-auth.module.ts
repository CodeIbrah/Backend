import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';
import { GoogleProvider } from './providers/google.provider';
import { MetaProvider } from './providers/meta.provider';
import { MicrosoftProvider } from './providers/microsoft.provider';
import { GitHubProvider } from './providers/github.provider';
import { GitLabProvider } from './providers/gitlab.provider';
import { AppleProvider } from './providers/apple.provider';

@Module({
  imports: [
    PrismaModule,
    ActivityLogModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SocialAuthController],
  providers: [
    SocialAuthService,
    GoogleProvider,
    MetaProvider,
    MicrosoftProvider,
    GitHubProvider,
    GitLabProvider,
    AppleProvider,
  ],
  exports: [SocialAuthService],
})
export class SocialAuthModule {}
