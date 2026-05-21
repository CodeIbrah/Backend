import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalyticsService } from '../analytics.service';
import { AnalyticsEventType } from '@prisma/client';

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(private readonly analyticsService: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - startTime;
        const userId = request.user?.id ?? null;
        const statusCode = response.statusCode;

        this.analyticsService.trackEvent(AnalyticsEventType.ENDPOINT_CALL, {
          method,
          path: url,
          statusCode,
          duration,
          userId,
          endpoint: `${method} ${url}`,
          latency: duration,
          service: process.env.OTEL_SERVICE_NAME,
          traceId: request.headers['x-trace-id'] ?? null,
        });
      }),
    );
  }
}
