import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as crypto from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const now = Date.now();

    // Correlation ID: use incoming X-Correlation-ID or generate one
    const correlationId = headers['x-correlation-id'] as string || crypto.randomUUID();
    request.correlationId = correlationId;

    this.logger.info('Incoming request', {
      correlationId,
      method,
      url,
      ip,
      userAgent: headers['user-agent'] || undefined,
    });

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
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
