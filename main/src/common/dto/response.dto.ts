import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty()
  data: T;

  @ApiProperty({
    example: {
      timestamp: '2024-01-01T00:00:00.000Z',
      path: '/api/v1/resource',
    },
  })
  meta: {
    timestamp: string;
    path: string;
    [key: string]: unknown;
  };
}

export function createResponse<T>(data: T, path: string): ResponseDto<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      path,
    },
  };
}
