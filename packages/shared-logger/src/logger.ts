import winston, { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import morgan from 'morgan';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'authorization'];

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  traceId?: string;
  context?: string;
  [key: string]: unknown;
}

export function formatLogEntry(
  level: string,
  message: string,
  traceId?: string,
  service?: string,
  context?: string,
  metadata?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (service) entry.service = service;
  if (traceId) entry.traceId = traceId;
  if (context) entry.context = context;
  if (metadata) {
    Object.assign(entry, metadata);
  }

  return entry;
}

export function sanitizeSecrets(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeSecrets(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeSecrets(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function createLogger(serviceName: string): winston.Logger {
  const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format((info) => {
      info.service = serviceName;
      return info;
    })(),
    format.json()
  );

  const consoleTransport = new transports.Console({
    format: logFormat,
  });

  const fileTransport = new DailyRotateFile({
    filename: `logs/${serviceName}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  });

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    transports: [consoleTransport, fileTransport],
  });
}

export function requestLogger(): morgan.FormatFn {
  return morgan('combined', {
    stream: {
      write: (message: string) => {
        const trimmed = message.trim();
        if (trimmed) {
          console.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'HTTP Request',
              context: 'request',
              raw: trimmed,
            })
          );
        }
      },
    },
  });
}

export function errorLogger(): winston.Logger {
  const logger = createLogger('error-handler');

  return logger.child({
    context: 'error',
  });
}

export function traceLogger(): winston.Logger {
  return createLogger('tracer').child({
    context: 'trace',
  });
}
