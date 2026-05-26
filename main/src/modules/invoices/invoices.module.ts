import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { InvoiceClientService } from './services/invoice-client.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [InvoiceClientService],
  exports: [InvoiceClientService],
})
export class InvoicesModule {}
