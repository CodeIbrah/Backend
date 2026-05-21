export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  userId: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  traceId: string;
  service: string;
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  rootCause: string;
  suggestedFix: string;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  traceId: string;
  service: string;
  context: string;
  metadata: Record<string, unknown>;
}

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
  service: string;
}

export enum AIProviderType {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  OLLAMA = 'OLLAMA',
  LOCAL = 'LOCAL',
}

export interface AIResponse {
  diagnosis: string;
  rootCause: string;
  suggestedFix: string;
  priority: number;
  affectedFiles: string[];
  confidence: number;
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export interface QueueJob {
  id: string;
  queue: string;
  data: Record<string, unknown>;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt: Date | null;
  failedAt: Date | null;
}

export enum AlertChannel {
  DISCORD = 'DISCORD',
  SLACK = 'SLACK',
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
}

export interface AlertConfig {
  channel: AlertChannel;
  webhookUrl: string;
  enabled: boolean;
  filters: string[];
}

export interface ReportData {
  name: string;
  date: Date;
  changes: string[];
  errors: string[];
  tasksDone: string[];
  tasksPending: string[];
  tasksToDO: string[];
  context: string;
  summary: string;
}
