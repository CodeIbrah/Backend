import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AuditController],
  providers: [
    {
      provide: AuditService,
      useFactory: (configService: ConfigService) => {
        const enabled = configService.get<boolean>('AUDIT_ENABLED', true);
        return new AuditService(enabled);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
