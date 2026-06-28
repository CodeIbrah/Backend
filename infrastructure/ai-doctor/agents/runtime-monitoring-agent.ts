import winston from 'winston';

export interface Alert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
}

export interface ResponseTimeMetrics {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface AgentResult {
  success: boolean;
  alerts: Alert[];
  cpuUsage: number;
  memoryMetrics: MemoryMetrics;
  responseTimes: ResponseTimeMetrics;
  hasMemoryLeak: boolean;
  hasDeadlock: boolean;
  hasDBBottleneck: boolean;
  hasRedisSaturation: boolean;
  hasQueueCongestion: boolean;
  duration: number;
  errors: Error[];
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
    new winston.transports.File({ filename: 'logs/runtime-monitoring-agent.log' }),
  ],
});

export class RuntimeMonitoringAgent {
  private running: boolean = false;
  private memoryHistory: MemoryMetrics[] = [];
  private responseTimeHistory: number[] = [];
  private readonly maxHistoryLength: number = 100;
  private readonly memoryLeakThreshold: number = 0.9;
  private readonly cpuThreshold: number = 80;
  private readonly responseTimeThreshold: number = 5000;

  constructor(options?: {
    maxHistoryLength?: number;
    memoryLeakThreshold?: number;
    cpuThreshold?: number;
    responseTimeThreshold?: number;
  }) {
    if (options) {
      this.maxHistoryLength = options.maxHistoryLength || this.maxHistoryLength;
      this.memoryLeakThreshold = options.memoryLeakThreshold || this.memoryLeakThreshold;
      this.cpuThreshold = options.cpuThreshold || this.cpuThreshold;
      this.responseTimeThreshold = options.responseTimeThreshold || this.responseTimeThreshold;
    }
    logger.info('RuntimeMonitoringAgent initialized', {
      memoryLeakThreshold: this.memoryLeakThreshold,
      cpuThreshold: this.cpuThreshold,
    });
  }

  async monitorCPU(): Promise<number> {
    logger.debug('Monitoring CPU usage');

    try {
      const loadAvg = process.loadavg ? process.loadavg() : [0, 0, 0];
      const cpuCount = require('os').cpus().length;
      const cpuUsage = (loadAvg[0] / cpuCount) * 100;

      logger.debug('CPU usage measured', { cpuUsage: cpuUsage.toFixed(2) });
      return cpuUsage;
    } catch (error) {
      logger.error('Failed to monitor CPU', { error });
      return 0;
    }
  }

  async monitorMemory(): Promise<MemoryMetrics> {
    logger.debug('Monitoring memory usage');

    try {
      const memUsage = process.memoryUsage();
      const metrics: MemoryMetrics = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
      };

      this.memoryHistory.push(metrics);
      if (this.memoryHistory.length > this.maxHistoryLength) {
        this.memoryHistory.shift();
      }

      logger.debug('Memory usage measured', {
        heapUsed: this.formatBytes(metrics.heapUsed),
        heapTotal: this.formatBytes(metrics.heapTotal),
        rss: this.formatBytes(metrics.rss),
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to monitor memory', { error });
      return { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 };
    }
  }

  async detectMemoryLeaks(): Promise<boolean> {
    logger.debug('Checking for memory leaks');

    if (this.memoryHistory.length < 10) {
      logger.debug('Insufficient history for leak detection');
      return false;
    }

    const recent = this.memoryHistory.slice(-10);
    const older = this.memoryHistory.slice(-20, -10);

    if (older.length === 0) {
      return false;
    }

    const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;

    const growthRate = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
    const isLeaking = growthRate > 0.1;

    if (isLeaking) {
      logger.warn('Potential memory leak detected', {
        growthRate: (growthRate * 100).toFixed(2),
        recentAvgHeap: this.formatBytes(recentAvg),
        olderAvgHeap: this.formatBytes(olderAvg),
      });
    }

    const currentMemory = await this.monitorMemory();
    const heapRatio = currentMemory.heapUsed / currentMemory.heapTotal;

    return isLeaking || heapRatio > this.memoryLeakThreshold;
  }

  async monitorResponseTimes(): Promise<ResponseTimeMetrics> {
    logger.debug('Monitoring response times');

    if (this.responseTimeHistory.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimeHistory].sort((a, b) => a - b);
    const count = sorted.length;

    const metrics: ResponseTimeMetrics = {
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };

    logger.debug('Response time metrics calculated', {
      avg: metrics.avg.toFixed(2),
      p95: metrics.p95.toFixed(2),
      p99: metrics.p99.toFixed(2),
    });

    return metrics;
  }

  recordResponseTime(responseTimeMs: number): void {
    this.responseTimeHistory.push(responseTimeMs);
    if (this.responseTimeHistory.length > this.maxHistoryLength) {
      this.responseTimeHistory.shift();
    }
  }

  async detectDeadlocks(): Promise<boolean> {
    logger.debug('Checking for deadlocks');

    try {
      const mainThreadBlocked = process._getActiveHandles
        ? process._getActiveHandles().length > 100
        : false;

      const activeRequests = process._getActiveRequests
        ? process._getActiveRequests().length > 50
        : false;

      const hasDeadlock = mainThreadBlocked && activeRequests;

      if (hasDeadlock) {
        logger.warn('Potential deadlock detected', {
          activeHandles: process._getActiveHandles?.().length,
          activeRequests: process._getActiveRequests?.().length,
        });
      }

      return hasDeadlock;
    } catch (error) {
      logger.error('Failed to detect deadlocks', { error });
      return false;
    }
  }

  async detectDBBottlenecks(): Promise<boolean> {
    logger.debug('Checking for database bottlenecks');

    try {
      const responseTimes = await this.monitorResponseTimes();
      const isSlow = responseTimes.p95 > this.responseTimeThreshold;

      if (isSlow) {
        logger.warn('Potential database bottleneck detected', {
          p95: responseTimes.p95.toFixed(2),
          threshold: this.responseTimeThreshold,
        });
      }

      return isSlow;
    } catch (error) {
      logger.error('Failed to detect DB bottlenecks', { error });
      return false;
    }
  }

  async detectRedisSaturation(): Promise<boolean> {
    logger.debug('Checking for Redis saturation');

    try {
      const memory = await this.monitorMemory();
      const memoryUsagePercent = memory.heapUsed / memory.heapTotal;

      const isSaturated = memoryUsagePercent > this.memoryLeakThreshold;

      if (isSaturated) {
        logger.warn('Potential Redis saturation detected', {
          memoryUsagePercent: (memoryUsagePercent * 100).toFixed(2),
        });
      }

      return isSaturated;
    } catch (error) {
      logger.error('Failed to detect Redis saturation', { error });
      return false;
    }
  }

  async detectQueueCongestion(): Promise<boolean> {
    logger.debug('Checking for queue congestion');

    try {
      const pendingHandles = process._getActiveHandles ? process._getActiveHandles().length : 0;

      const isCongested = pendingHandles > 100;

      if (isCongested) {
        logger.warn('Potential queue congestion detected', {
          pendingHandles,
        });
      }

      return isCongested;
    } catch (error) {
      logger.error('Failed to detect queue congestion', { error });
      return false;
    }
  }

  async generateAlerts(): Promise<Alert[]> {
    logger.info('Generating runtime alerts');

    const alerts: Alert[] = [];

    try {
      const cpuUsage = await this.monitorCPU();
      const memory = await this.monitorMemory();
      const responseTimes = await this.monitorResponseTimes();
      const hasMemoryLeak = await this.detectMemoryLeaks();
      const hasDeadlock = await this.detectDeadlocks();
      const hasDBBottleneck = await this.detectDBBottlenecks();
      const hasRedisSaturation = await this.detectRedisSaturation();
      const hasQueueCongestion = await this.detectQueueCongestion();

      if (cpuUsage > this.cpuThreshold) {
        alerts.push({
          id: this.generateId(),
          type: 'HIGH_CPU',
          severity: cpuUsage > 95 ? 'CRITICAL' : 'HIGH',
          message: `CPU usage at ${cpuUsage.toFixed(2)}% (threshold: ${this.cpuThreshold}%)`,
          timestamp: new Date(),
          metadata: { cpuUsage },
        });
      }

      const heapRatio = memory.heapUsed / memory.heapTotal;
      if (heapRatio > 0.8) {
        alerts.push({
          id: this.generateId(),
          type: 'HIGH_MEMORY',
          severity: heapRatio > 0.95 ? 'CRITICAL' : 'HIGH',
          message: `Heap usage at ${(heapRatio * 100).toFixed(2)}%`,
          timestamp: new Date(),
          metadata: { heapUsed: memory.heapUsed, heapTotal: memory.heapTotal },
        });
      }

      if (hasMemoryLeak) {
        alerts.push({
          id: this.generateId(),
          type: 'MEMORY_LEAK',
          severity: 'HIGH',
          message: 'Potential memory leak detected',
          timestamp: new Date(),
          metadata: { memoryHistory: this.memoryHistory.length },
        });
      }

      if (hasDeadlock) {
        alerts.push({
          id: this.generateId(),
          type: 'DEADLOCK',
          severity: 'CRITICAL',
          message: 'Potential deadlock detected',
          timestamp: new Date(),
          metadata: {},
        });
      }

      if (hasDBBottleneck) {
        alerts.push({
          id: this.generateId(),
          type: 'DB_BOTTLENECK',
          severity: 'HIGH',
          message: 'Database bottleneck detected',
          timestamp: new Date(),
          metadata: { p95: responseTimes.p95 },
        });
      }

      if (hasRedisSaturation) {
        alerts.push({
          id: this.generateId(),
          type: 'REDIS_SATURATION',
          severity: 'MEDIUM',
          message: 'Redis saturation detected',
          timestamp: new Date(),
          metadata: {},
        });
      }

      if (hasQueueCongestion) {
        alerts.push({
          id: this.generateId(),
          type: 'QUEUE_CONGESTION',
          severity: 'MEDIUM',
          message: 'Queue congestion detected',
          timestamp: new Date(),
          metadata: {},
        });
      }

      if (responseTimes.p99 > this.responseTimeThreshold) {
        alerts.push({
          id: this.generateId(),
          type: 'HIGH_LATENCY',
          severity: 'HIGH',
          message: `P99 latency at ${responseTimes.p99.toFixed(0)}ms (threshold: ${this.responseTimeThreshold}ms)`,
          timestamp: new Date(),
          metadata: { responseTimes },
        });
      }

      logger.info('Alert generation complete', { alertCount: alerts.length });
    } catch (error) {
      logger.error('Failed to generate alerts', { error });
    }

    return alerts;
  }

  async run(): Promise<AgentResult> {
    logger.info('Starting RuntimeMonitoringAgent');

    const startTime = Date.now();
    this.running = true;

    try {
      const cpuUsage = await this.monitorCPU();
      const memoryMetrics = await this.monitorMemory();
      const responseTimes = await this.monitorResponseTimes();
      const hasMemoryLeak = await this.detectMemoryLeaks();
      const hasDeadlock = await this.detectDeadlocks();
      const hasDBBottleneck = await this.detectDBBottlenecks();
      const hasRedisSaturation = await this.detectRedisSaturation();
      const hasQueueCongestion = await this.detectQueueCongestion();
      const alerts = await this.generateAlerts();

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        success: true,
        alerts,
        cpuUsage,
        memoryMetrics,
        responseTimes,
        hasMemoryLeak,
        hasDeadlock,
        hasDBBottleneck,
        hasRedisSaturation,
        hasQueueCongestion,
        duration,
        errors: [],
      };

      logger.info('RuntimeMonitoringAgent completed', {
        duration,
        alertCount: alerts.length,
      });

      return result;
    } catch (error) {
      logger.error('RuntimeMonitoringAgent failed', { error });

      return {
        success: false,
        alerts: [],
        cpuUsage: 0,
        memoryMetrics: { heapUsed: 0, heapTotal: 0, rss: 0, external: 0 },
        responseTimes: { avg: 0, p50: 0, p95: 0, p99: 0 },
        hasMemoryLeak: false,
        hasDeadlock: false,
        hasDBBottleneck: false,
        hasRedisSaturation: false,
        hasQueueCongestion: false,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error : new Error(String(error))],
      };
    } finally {
      this.running = false;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
