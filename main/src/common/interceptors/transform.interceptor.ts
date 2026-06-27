import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface RequestWithUrl {
  url: string;
}

export interface ResponseWrapper<T> {
  data: T;
  meta?: {
    timestamp: string;
    path: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseWrapper<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseWrapper<T>> {
    const request = context.switchToHttp().getRequest<RequestWithUrl>();

    return next.handle().pipe(
      map((data: T) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      })),
    );
  }
}
