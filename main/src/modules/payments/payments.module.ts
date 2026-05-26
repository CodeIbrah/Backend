import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentClientService } from './services/payment-client.service';
import { PaymentOrchestratorService } from './services/payment-orchestrator.service';
import { InvoiceClientService } from '../invoices/services/invoice-client.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentClientService, PaymentOrchestratorService, InvoiceClientService],
  exports: [PaymentClientService, PaymentOrchestratorService],
})
export class PaymentsModule {}
