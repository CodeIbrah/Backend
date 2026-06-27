import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Inject } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as crypto from 'crypto';

interface RequestWithHeaders {
  method: string;
  url: string;
  ip: string;
  headers: Record<string, string | string[] | undefined>;
  correlationId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const { method, url, ip, headers } = request;
    const now = Date.now();

    const correlationId = (headers['x-correlation-id'] as string | undefined) || crypto.randomUUID();
    request.correlationId = correlationId;

    this.logger.info('Incoming request', {
      correlationId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'] as string | undefined,
    });

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const responseTime = Date.now() - now;
        response.setHeader('X-Correlation-ID', correlationId);
        this.logger.info('Request completed', {
          correlationId,
          method,
          url,
          statusCode: response.statusCode,
          responseTime: `${responseTime}ms`,
        });
      }),
    );
  }
}
