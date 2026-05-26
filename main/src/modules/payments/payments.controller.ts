import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  PaymentOrchestratorService,
  CheckoutRequest,
  CheckoutResponse,
} from './services/payment-orchestrator.service';
import { PaymentClientService, PaymentResponse } from './services/payment-client.service';

class CheckoutRequestBody implements CheckoutRequest {
  userId!: string;
  userEmail!: string;
  userPhone!: string;
  amount!: number;
  currency!: string;
  method!: string;
  description!: string;
  items!: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  metadata?: Record<string, unknown>;
}

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly orchestrator: PaymentOrchestratorService,
    private readonly paymentClient: PaymentClientService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full checkout flow',
    description:
      'Orchestrates the complete payment flow: extract data, create payment, process payment, create invoice + receipt, send via email/SMS',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout completed successfully',
  })
  @ApiResponse({
    status: 502,
    description: 'One or more microservices unavailable',
  })
  async checkout(@Body() body: CheckoutRequestBody): Promise<CheckoutResponse> {
    this.logger.info(
      `[PaymentsController] Checkout request for user ${body.userId}, amount ${body.amount} ${body.currency}`,
    );

    return this.orchestrator.executeCheckout(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@Param('id') id: string): Promise<PaymentResponse> {
    return this.paymentClient.getPayment(id);
  }
}
