import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUser {
  id: string;
  email: string;
  roles?: string[];
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUser | undefined,
    ctx: ExecutionContext,
  ): CurrentUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUser | undefined;

    if (data && user) {
      return user[data] as string | undefined;
    }

    return user;
  },
);
