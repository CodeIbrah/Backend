import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsGateway } from './analytics.gateway';

@Module({
  imports: [ConfigModule],
  providers: [AnalyticsGateway],
  exports: [AnalyticsGateway],
})
export class WebsocketModule {}

export { AnalyticsGateway };
