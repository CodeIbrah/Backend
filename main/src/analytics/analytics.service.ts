import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AnalyticsEventType } from '@prisma/client';

interface AnalyticsMetadata {
  latency?: number;
  endpoint?: string;
  errorType?: string;
  [key: string]: unknown;
}

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
  private eventBuffer: Array<{ type: AnalyticsEventType; data: Record<string, unknown>; timestamp: Date }> = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 5000;
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: Logger,
    @Inject('ANALYTICS_QUEUE') private analyticsQueue: Queue,
  ) {}

  async onModuleInit() {
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }

  trackEvent(type: AnalyticsEventType, data: any): void {
    this.eventBuffer.push({ type, data, timestamp: new Date() });

    if (this.eventBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush().catch((err) => {
        this.logger.error('Failed to flush analytics buffer', { error: err });
      });
    }
  }

  async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    for (const event of events) {
      await this.analyticsQueue.add('process-event', {
        type: event.type,
        data: event.data,
        timestamp: event.timestamp,
      });
    }

    this.logger.debug('Flushed analytics buffer', { count: events.length });
  }

  async getOverview(): Promise<{
    totalEvents: number;
    eventsByType: Array<{ type: string; count: number }>;
    eventsByService: Array<{ service: string; count: number }>;
    recentEvents: Array<{
      id: string;
      type: string;
      userId: string | null;
      service: string | null;
      timestamp: Date;
    }>;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalEvents, eventsByType, eventsByService, recentEvents] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { timestamp: { gte: last24h } } }),

      this.prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { timestamp: { gte: last24h } },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      }),

      this.prisma.analyticsEvent.groupBy({
        by: ['service'],
        where: { timestamp: { gte: last24h }, service: { not: null } },
        _count: { service: true },
        orderBy: { _count: { service: 'desc' } },
      }),

      this.prisma.analyticsEvent.findMany({
        where: { timestamp: { gte: last24h } },
        select: { id: true, type: true, userId: true, service: true, timestamp: true },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
    ]);

    return {
      totalEvents,
      eventsByType: eventsByType.map((e) => ({ type: e.type, count: e._count.type })),
      eventsByService: eventsByService.map((e) => ({
        service: e.service ?? 'unknown',
        count: e._count.service,
      })),
      recentEvents,
    };
  }

  async getUsage(): Promise<{
    endpointCalls: number;
    avgLatency: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    activeUsers: number;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const endpointEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        type: AnalyticsEventType.ENDPOINT_CALL,
        timestamp: { gte: last24h },
        metadata: { path: ['endpoint'], not: undefined },
      },
      select: {
        metadata: true,
        userId: true,
      },
    });

    const endpointCalls = endpointEvents.length;

    const latencies = endpointEvents
      .map((e) => (e.metadata as AnalyticsMetadata)?.latency)
      .filter((l): l is number => typeof l === 'number');

    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    const endpointCounts = new Map<string, number>();
    for (const event of endpointEvents) {
      const endpoint = (event.metadata as AnalyticsMetadata)?.endpoint ?? 'unknown';
      endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
    }

    const topEndpoints = Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    const activeUsers = new Set(endpointEvents.filter((e) => e.userId).map((e) => e.userId)).size;

    return { endpointCalls, avgLatency, topEndpoints, activeUsers };
  }

  async getErrors(): Promise<{
    totalErrors: number;
    errorsByService: Array<{ service: string; count: number }>;
    errorsByType: Array<{ type: string; count: number }>;
    errorTrend: Array<{ date: string; count: number }>;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalErrors = await this.prisma.analyticsEvent.count({
      where: { type: AnalyticsEventType.ERROR, timestamp: { gte: last24h } },
    });

    const errorsByService = await this.prisma.analyticsEvent.groupBy({
      by: ['service'],
      where: { type: AnalyticsEventType.ERROR, timestamp: { gte: last24h }, service: { not: null } },
      _count: { service: true },
      orderBy: { _count: { service: 'desc' } },
    });

    const errorEvents = await this.prisma.analyticsEvent.findMany({
      where: { type: AnalyticsEventType.ERROR, timestamp: { gte: last24h } },
      select: { metadata: true },
    });

    const errorTypeCounts = new Map<string, number>();
    for (const event of errorEvents) {
      const errorType = (event.metadata as AnalyticsMetadata)?.errorType ?? 'Unknown';
      errorTypeCounts.set(errorType, (errorTypeCounts.get(errorType) || 0) + 1);
    }

    const errorsByType = Array.from(errorTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));

    const trendData = await this.prisma.analyticsEvent.groupBy({
      by: ['timestamp'],
      where: { type: AnalyticsEventType.ERROR, timestamp: { gte: last7d } },
      _count: { timestamp: true },
    });

    const dateMap = new Map<string, number>();
    for (const entry of trendData) {
      const date = entry.timestamp.toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + entry._count.timestamp);
    }

    const errorTrend = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      totalErrors,
      errorsByService: errorsByService.map((e) => ({
        service: e.service ?? 'unknown',
        count: e._count.service,
      })),
      errorsByType,
      errorTrend,
    };
  }

  async getPerformance(): Promise<{
    avgResponseTime: number;
    p50: number;
    p95: number;
    p99: number;
    slowestEndpoints: Array<{ endpoint: string; avgLatency: number }>;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        type: AnalyticsEventType.ENDPOINT_CALL,
        timestamp: { gte: last24h },
        metadata: { path: ['latency'], not: undefined },
      },
      select: { metadata: true },
    });

    const latencies = events
      .map((e) => (e.metadata as AnalyticsMetadata)?.latency)
      .filter((l): l is number => typeof l === 'number')
      .sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { avgResponseTime: 0, p50: 0, p95: 0, p99: 0, slowestEndpoints: [] };
    }

    const avgResponseTime = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    const endpointLatencies = new Map<string, number[]>();
    for (const event of events) {
      const endpoint = (event.metadata as AnalyticsMetadata)?.endpoint ?? 'unknown';
      const latency = (event.metadata as AnalyticsMetadata)?.latency;
      if (typeof latency === 'number') {
        if (!endpointLatencies.has(endpoint)) {
          endpointLatencies.set(endpoint, []);
        }
        const latencies = endpointLatencies.get(endpoint);
        if (latencies) latencies.push(latency);
      }
    }

    const slowestEndpoints = Array.from(endpointLatencies.entries())
      .map(([endpoint, lats]) => ({
        endpoint,
        avgLatency: lats.reduce((a, b) => a + b, 0) / lats.length,
      }))
      .sort((a, b) => b.avgLatency - a.avgLatency)
      .slice(0, 10);

    return { avgResponseTime, p50, p95, p99, slowestEndpoints };
  }
}
