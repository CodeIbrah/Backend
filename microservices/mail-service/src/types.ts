export interface MailPayload {
  to: string;
  subject: string;
  body?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface MailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: MailStatus;
  sentAt: Date | null;
  error: string | null;
  createdAt: Date;
}

export enum MailStatus {
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
