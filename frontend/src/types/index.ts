export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER' | 'MODERATOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  action: string;
  resource: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  requestsPerMinute: number;
}

export interface HealthStatus {
  status: string;
  info: Record<string, unknown>;
  error: Record<string, unknown>;
  details: Record<string, unknown>;
}

export interface OpsStatus {
  uptime: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  cpu: { usage: number };
}

export interface Report {
  id: string;
  filename: string;
  type: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: { timestamp: string; path: string };
}
