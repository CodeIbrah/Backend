import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { ActivityLogService } from '../activity-log.service';

interface RequestWithUser {
  method: string;
  url: string;
  ip: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  id?: string;
  user?: { sub?: string };
  correlationId?: string;
  query: Record<string, unknown>;
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly options?: { logGetRequests?: boolean },
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();

    const method = request.method;
    const path = request.url;
    const userId = request.user?.sub;
    const ipAddress: string | undefined =
      request.ip ||
      (Array.isArray(request.headers['x-forwarded-for'])
        ? request.headers['x-forwarded-for'][0]
        : request.headers['x-forwarded-for']) ||
      request.socket?.remoteAddress;
    const userAgent = request.headers['user-agent'] as string | undefined;
    const traceId = (request.headers['x-trace-id'] as string | undefined) || request.id;

    const shouldLog = this.options?.logGetRequests || method !== 'GET';

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

  private mapMethodToActivityType(method: string): string {
    const typeMap: Record<string, string> = {
      POST: 'USER_CREATED',
      PUT: 'USER_UPDATED',
      PATCH: 'USER_UPDATED',
      DELETE: 'USER_DELETED',
    };
    return typeMap[method] || 'USER_UPDATED';
  }

  private mapStatusToSeverity(statusCode: number): string {
    if (statusCode >= 500) return 'ERROR';
    if (statusCode >= 400) return 'WARNING';
    return 'INFO';
  }
}
