import winston from 'winston';

export interface ErrorEntry {
  id: string;
  message: string;
  stack: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  service: string;
  traceId: string;
  context: Record<string, unknown>;
  timestamp: Date;
  analyzed: boolean;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error-collector.log' }),
  ],
});

export class ErrorCollector {
  private errors: ErrorEntry[] = [];
  private maxErrors: number;

  constructor(maxErrors: number = 10000) {
    this.maxErrors = maxErrors;
    logger.info('ErrorCollector initialized', { maxErrors });
  }

  collect(error: Error, context: Record<string, unknown> = {}): void {
    const entry: ErrorEntry = {
      id: this.generateId(),
      message: error.message,
      stack: error.stack || '',
      severity: 'MEDIUM',
      service: (context.service as string) || 'unknown',
      traceId: (context.traceId as string) || this.generateTraceId(),
      context,
      timestamp: new Date(),
      analyzed: false,
    };

    this.errors.unshift(entry);

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    logger.error('Error collected', {
      errorId: entry.id,
      message: entry.message,
      service: entry.service,
      severity: entry.severity,
    });
  }

  getRecentErrors(limit: number = 50): ErrorEntry[] {
    logger.debug('Getting recent errors', { limit });
    return this.errors.slice(0, limit);
  }

  getErrorsByService(service: string): ErrorEntry[] {
    logger.debug('Getting errors by service', { service });
    return this.errors.filter((e) => e.service === service);
  }

  getErrorsBySeverity(severity: string): ErrorEntry[] {
    logger.debug('Getting errors by severity', { severity });
    return this.errors.filter(
      (e) => e.severity === severity.toUpperCase(),
    );
  }

  markAnalyzed(id: string): void {
    const entry = this.errors.find((e) => e.id === id);
    if (entry) {
      entry.analyzed = true;
      logger.debug('Error marked as analyzed', { errorId: id });
    }
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
