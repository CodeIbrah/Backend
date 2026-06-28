export enum AnalyticsEvent {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  FAILED_AUTH = 'FAILED_AUTH',
  ENDPOINT_CALL = 'ENDPOINT_CALL',
  USER_ACTIVITY = 'USER_ACTIVITY',
  API_LATENCY = 'API_LATENCY',
  ERROR = 'ERROR',
  SERVICE_CALL = 'SERVICE_CALL',
}

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  data: any;
  timestamp: Date;
}

export interface AnalyticsServiceConfig {
  flushIntervalMs?: number;
  maxBufferSize?: number;
}

export interface AnalyticsOverview {
  totalEvents: number;
  eventsByType: Record<string, number>;
  timeRange: { start: Date; end: Date };
}

export interface AnalyticsUsage {
  endpointCalls: number;
  userActivities: number;
  uniqueUsers: number;
}

export interface AnalyticsErrors {
  totalErrors: number;
  errorsByType: Record<string, number>;
  recentErrors: AnalyticsEventData[];
}

export interface AnalyticsPerformance {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalCalls: number;
}

export class AnalyticsService {
  private buffer: AnalyticsEventData[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private config: Required<AnalyticsServiceConfig>;

  constructor(config?: AnalyticsServiceConfig) {
    this.config = {
      flushIntervalMs: config?.flushIntervalMs ?? 30000,
      maxBufferSize: config?.maxBufferSize ?? 1000,
    };

    this.startAutoFlush();
  }

  trackEvent(event: AnalyticsEvent, data: any): void {
    const eventData: AnalyticsEventData = {
      event,
      data,
      timestamp: new Date(),
    };

    this.buffer.push(eventData);

    if (this.buffer.length >= this.config.maxBufferSize) {
      this.flush();
    }
  }

  async getOverview(): Promise<AnalyticsOverview> {
    const eventsByType: Record<string, number> = {};

    for (const item of this.buffer) {
      const key = item.event;
      eventsByType[key] = (eventsByType[key] || 0) + 1;
    }

    return {
      totalEvents: this.buffer.length,
      eventsByType,
      timeRange: {
        start: this.buffer[0]?.timestamp ?? new Date(),
        end: this.buffer[this.buffer.length - 1]?.timestamp ?? new Date(),
      },
    };
  }

  async getUsage(): Promise<AnalyticsUsage> {
    const endpointCalls = this.buffer.filter(
      (e) => e.event === AnalyticsEvent.ENDPOINT_CALL,
    ).length;
    const userActivities = this.buffer.filter(
      (e) => e.event === AnalyticsEvent.USER_ACTIVITY,
    ).length;

    return {
      endpointCalls,
      userActivities,
      uniqueUsers: 0,
    };
  }

  async getErrors(): Promise<AnalyticsErrors> {
    const errors = this.buffer.filter(
      (e) => e.event === AnalyticsEvent.ERROR || e.event === AnalyticsEvent.FAILED_AUTH,
    );

    const errorsByType: Record<string, number> = {};
    for (const item of errors) {
      const key = item.event;
      errorsByType[key] = (errorsByType[key] || 0) + 1;
    }

    return {
      totalErrors: errors.length,
      errorsByType,
      recentErrors: errors.slice(-10),
    };
  }

  async getPerformance(): Promise<AnalyticsPerformance> {
    const latencyEvents = this.buffer.filter((e) => e.event === AnalyticsEvent.API_LATENCY);
    const latencies = latencyEvents.map((e) => e.data?.latency ?? 0).sort((a, b) => a - b);

    const total = latencies.length || 1;

    return {
      averageLatency: latencies.reduce((a, b) => a + b, 0) / total,
      p95Latency: latencies[Math.floor(total * 0.95)] ?? 0,
      p99Latency: latencies[Math.floor(total * 0.99)] ?? 0,
      totalCalls: latencyEvents.length,
    };
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = [...this.buffer];
    this.buffer = [];

    // Stub: Replace with actual persistence logic
    // e.g., send to analytics backend, write to database, etc.
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);
  }

  dispose(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}
