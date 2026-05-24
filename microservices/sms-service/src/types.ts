export interface SmsPayload {
  to: string;
  message: string;
}

export interface SmsRecord {
  id: string;
  to: string;
  message: string;
  status: SmsStatus;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
}

export enum SmsStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
