import { Injectable, HttpException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

interface ApiResponse<T> {
  data: T;
}

export interface WebhookResponse {
  invoice: InvoiceResponse;
  receipt: ReceiptResponse;
}

export interface CreateInvoiceFromPaymentDto {
  userId: string;
  userEmail: string;
  userPhone: string;
  paymentId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  tax?: number;
  discount?: number;
  currency?: string;
  channel?: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  userId: string;
  paymentId: string;
  status: string;
  total: number;
  currency: string;
}

export interface ReceiptResponse {
  id: string;
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  currency: string;
}

@Injectable()
export class InvoiceClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {
    this.baseUrl = this.configService.get<string>('INVOICE_SERVICE_URL') || 'http://localhost:3006';
  }

  async createInvoiceFromPayment(
    dto: CreateInvoiceFromPaymentDto,
    correlationId?: string,
  ): Promise<InvoiceResponse> {
    this.logger.info(`[InvoiceClient] Creating invoice from payment ${dto.paymentId}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ApiResponse<InvoiceResponse>>(
          `${this.baseUrl}/api/v1/invoices/from-payment`,
          dto,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId ?? '',
              Authorization: `Bearer ${this.configService.get<string>('INTERNAL_API_KEY', 'internal-key')}`,
            },
          },
        ),
      );

      this.logger.info(`[InvoiceClient] Invoice created: ${data.data.invoiceNumber}`);
      return data.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      this.logger.error(`[InvoiceClient] Failed to create invoice: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new HttpException(
        error.response?.data ?? 'Invoice service unavailable',
        error.response?.status ?? 503,
      );
    }
  }

  async sendPaymentWebhook(
    payload: {
      event: string;
      paymentId: string;
      userId: string;
      userEmail: string;
      userPhone: string;
      amount: number;
      currency: string;
      description: string;
      items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
    correlationId?: string,
  ): Promise<{ invoice: InvoiceResponse; receipt: ReceiptResponse }> {
    this.logger.info(`[InvoiceClient] Sending payment webhook for ${payload.paymentId}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<ApiResponse<WebhookResponse>>(
          `${this.baseUrl}/api/v1/invoices/webhook`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId ?? '',
              Authorization: `Bearer ${this.configService.get<string>('INTERNAL_API_KEY', 'internal-key')}`,
            },
          },
        ),
      );

      this.logger.info(
        `[InvoiceClient] Webhook processed: invoice=${data.data.invoice.id}, receipt=${data.data.receipt.id}`,
      );
      return data.data;
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      this.logger.error(`[InvoiceClient] Webhook failed: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new HttpException(
        error.response?.data ?? 'Invoice service unavailable',
        error.response?.status ?? 503,
      );
    }
  }

  async getInvoice(invoiceId: string, correlationId?: string): Promise<InvoiceResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ApiResponse<InvoiceResponse>>(
          `${this.baseUrl}/api/v1/invoices/${invoiceId}`,
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
      this.logger.error(`[InvoiceClient] Failed to get invoice: ${error.message}`);
      throw new HttpException(
        error.response?.data ?? 'Invoice service unavailable',
        error.response?.status ?? 503,
      );
    }
  }
}
