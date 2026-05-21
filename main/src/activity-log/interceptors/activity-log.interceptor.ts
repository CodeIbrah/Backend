import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from '../activity-log.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly options?: { logGetRequests?: boolean },
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method;
    const path = request.url;
    const userId = request.user?.sub;
    const ipAddress =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const traceId = request.headers['x-trace-id'] || request.id;

    const shouldLog =
      this.options?.logGetRequests || method !== 'GET';

    if (!shouldLog) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.activityLogService
          .logActivity({
            userId,
            type: this.mapMethodToActivityType(method),
            action: `${method} ${path}`,
            resource: path.split('?')[0],
            description: `${method} ${path} - ${statusCode} (${duration}ms)`,
            metadata: {
              method,
              path,
              statusCode,
              duration,
              query: request.query,
            },
            ipAddress,
            userAgent,
            traceId,
            severity: this.mapStatusToSeverity(statusCode),
          })
          .catch(() => {});
      }),
    );
  }

  private mapMethodToActivityType(method: string): any {
    const typeMap: Record<string, string> = {
      POST: 'USER_CREATED',
      PUT: 'USER_UPDATED',
      PATCH: 'USER_UPDATED',
      DELETE: 'USER_DELETED',
    };
    return typeMap[method] || 'USER_UPDATED';
  }

  private mapStatusToSeverity(statusCode: number): any {
    if (statusCode >= 500) return 'ERROR';
    if (statusCode >= 400) return 'WARNING';
    return 'INFO';
  }
}
