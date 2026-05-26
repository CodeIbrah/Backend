import { Injectable, HttpException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export interface CreatePaymentDto {
  amount: number;
  currency: string;
  method: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  description: string;
  transactionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ProcessPaymentResponse {
  id: string;
  status: string;
  transactionId: string | null;
  completedAt: string | null;
}

interface ApiResponse<T> {
  data: T;
}

@Injectable()
export class PaymentClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {
    this.baseUrl = this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:3004';
  }

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
    correlationId?: string,
  ): Promise<PaymentResponse> {
    this.logger.info(`[PaymentClient] Creating payment for user ${userId} via ${this.baseUrl}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ApiResponse<PaymentResponse>>(
          `${this.baseUrl}/api/v1/payments`,
          { userId, ...dto },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId ?? '',
              Authorization: `Bearer ${this.configService.get<string>('INTERNAL_API_KEY', 'internal-key')}`,
            },
          },
        ),
      );

      this.logger.info(`[PaymentClient] Payment created: ${data.data.id}`);
      return data.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      this.logger.error(`[PaymentClient] Failed to create payment: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new HttpException(
        error.response?.data ?? 'Payment service unavailable',
        error.response?.status ?? 503,
      );
    }
  }

  async processPayment(paymentId: string, correlationId?: string): Promise<ProcessPaymentResponse> {
    this.logger.info(`[PaymentClient] Processing payment ${paymentId} via ${this.baseUrl}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ApiResponse<ProcessPaymentResponse>>(
          `${this.baseUrl}/api/v1/payments/${paymentId}/process`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId ?? '',
              Authorization: `Bearer ${this.configService.get<string>('INTERNAL_API_KEY', 'internal-key')}`,
            },
          },
        ),
      );

      this.logger.info(`[PaymentClient] Payment processed: ${paymentId} -> ${data.data.status}`);
      return data.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      this.logger.error(`[PaymentClient] Failed to process payment: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new HttpException(
        error.response?.data ?? 'Payment service unavailable',
        error.response?.status ?? 503,
      );
    }
  }

  async getPayment(paymentId: string, correlationId?: string): Promise<PaymentResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ApiResponse<PaymentResponse>>(
          `${this.baseUrl}/api/v1/payments/${paymentId}`,
          {
            headers: {
              'X-Correlation-ID': correlationId ?? '',
              Authorization: `Bearer ${this.configService.get<string>('INTERNAL_API_KEY', 'internal-key')}`,
            },
          },
        ),
      );
      return data.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      this.logger.error(`[PaymentClient] Failed to get payment: ${error.message}`);
      throw new HttpException(
        error.response?.data ?? 'Payment service unavailable',
        error.response?.status ?? 503,
      );
    }
  }
}
