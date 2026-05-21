import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';

@Module({
  controllers: [OpsController],
})
export class OpsModule {}
