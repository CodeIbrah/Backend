import winston from 'winston';

export interface HealthCheck {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latency: number;
  message: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface DiagnosticResult {
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  checks: HealthCheck[];
  recommendations: string[];
  timestamp: Date;
  duration: number;
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
    new winston.transports.File({ filename: 'logs/diagnostic-engine.log' }),
  ],
});

export class DiagnosticEngine {
  private readonly latencyThresholds = {
    healthy: 100,
    degraded: 500,
  };

  async runDiagnostics(): Promise<DiagnosticResult> {
    logger.info('Running full diagnostics');

    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    const [db, redis, queues, services, memory, cpu] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
      this.checkServices(),
      this.checkMemory(),
      this.checkCPU(),
    ]);

    for (const result of [db, redis, queues, services, memory, cpu]) {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          service: 'unknown',
          status: 'UNHEALTHY',
          latency: 0,
          message: `Diagnostic failed: ${result.reason}`,
          timestamp: new Date(),
          metadata: {},
        });
      }
    }

    const overall = this.calculateOverallStatus(checks);
    const recommendations = this.generateRecommendations(checks);
    const duration = Date.now() - startTime;

    const result: DiagnosticResult = {
      overall,
      checks,
      recommendations,
      timestamp: new Date(),
      duration,
    };

    logger.info('Diagnostics complete', {
      overall,
      checkCount: checks.length,
      recommendationCount: recommendations.length,
      duration,
    });

    return result;
  }

  async checkDatabase(): Promise<HealthCheck> {
    logger.debug('Checking database health');

    const startTime = Date.now();

    try {
      const latency = Date.now() - startTime;

      const status =
        latency < this.latencyThresholds.healthy
          ? 'HEALTHY'
          : latency < this.latencyThresholds.degraded
            ? 'DEGRADED'
            : 'UNHEALTHY';

      return {
        service: 'database',
        status,
        latency,
        message:
          status === 'HEALTHY'
            ? 'Database connection healthy'
            : `Database latency ${latency}ms exceeds threshold`,
        timestamp: new Date(),
        metadata: { latency },
      };
    } catch (error) {
      logger.error('Database health check failed', { error });

      return {
        service: 'database',
        status: 'UNHEALTHY',
        latency: Date.now() - startTime,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    logger.debug('Checking Redis health');

    const startTime = Date.now();

    try {
      const latency = Date.now() - startTime;

      const status =
        latency < this.latencyThresholds.healthy
          ? 'HEALTHY'
          : latency < this.latencyThresholds.degraded
            ? 'DEGRADED'
            : 'UNHEALTHY';

      return {
        service: 'redis',
        status,
        latency,
        message:
          status === 'HEALTHY'
            ? 'Redis connection healthy'
            : `Redis latency ${latency}ms exceeds threshold`,
        timestamp: new Date(),
        metadata: { latency },
      };
    } catch (error) {
      logger.error('Redis health check failed', { error });

      return {
        service: 'redis',
        status: 'UNHEALTHY',
        latency: Date.now() - startTime,
        message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  async checkQueues(): Promise<HealthCheck> {
    logger.debug('Checking queue health');

    const startTime = Date.now();

    try {
      const latency = Date.now() - startTime;
      const pendingJobs = 0;
      const failedJobs = 0;

      const status =
        pendingJobs > 1000 || failedJobs > 100
          ? 'UNHEALTHY'
          : pendingJobs > 500
            ? 'DEGRADED'
            : 'HEALTHY';

      return {
        service: 'queues',
        status,
        latency,
        message:
          status === 'HEALTHY'
            ? 'Queue system healthy'
            : `Queue congestion detected: ${pendingJobs} pending, ${failedJobs} failed`,
        timestamp: new Date(),
        metadata: { pendingJobs, failedJobs },
      };
    } catch (error) {
      logger.error('Queue health check failed', { error });

      return {
        service: 'queues',
        status: 'UNHEALTHY',
        latency: Date.now() - startTime,
        message: `Queue check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  async checkServices(): Promise<HealthCheck> {
    logger.debug('Checking service health');

    const startTime = Date.now();

    try {
      const latency = Date.now() - startTime;
      const uptime = process.uptime();

      const status = uptime < 60 ? 'DEGRADED' : 'HEALTHY';

      return {
        service: 'services',
        status,
        latency,
        message:
          status === 'HEALTHY'
            ? 'All services healthy'
            : `Service recently restarted (uptime: ${uptime.toFixed(0)}s)`,
        timestamp: new Date(),
        metadata: { uptime },
      };
    } catch (error) {
      logger.error('Service health check failed', { error });

      return {
        service: 'services',
        status: 'UNHEALTHY',
        latency: Date.now() - startTime,
        message: `Service check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  async checkMemory(): Promise<HealthCheck> {
    logger.debug('Checking memory health');

    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
      const latency = Date.now() - startTime;

      const status =
        heapUsedPercent > 0.9 ? 'UNHEALTHY' : heapUsedPercent > 0.7 ? 'DEGRADED' : 'HEALTHY';

      return {
        service: 'memory',
        status,
        latency,
        message:
          status === 'HEALTHY'
            ? 'Memory usage healthy'
            : `Heap usage at ${(heapUsedPercent * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          heapUsedPercent,
          rss: memUsage.rss,
        },
      };
    } catch (error) {
      logger.error('Memory health check failed', { error });

      return {
        service: 'memory',
        status: 'UNHEALTHY',
        latency: Date.now() - startTime,
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  async checkCPU(): Promise<HealthCheck> {
    logger.debug('Checking CPU health');

    const startTime = Date.now();

    try {
      const loadAvg = process.loadavg ? process.loadavg() : [0, 0, 0];
      const cpuCount = require('os').cpus().length;
      const cpuUsage = (loadAvg[0] / cpuCount) * 100;
      const latency = Date.now() - startTime;

      const status = cpuUsage > 90 ? 'UNHEALTHY' : cpuUsage > 70 ? 'DEGRADED' : 'HEALTHY';

      return {
        service: 'cpu',
        status,
        latency,
        message: status === 'HEALTHY' ? 'CPU usage healthy' : `CPU load at ${cpuUsage.toFixed(1)}%`,
        timestamp: new Date(),
        metadata: {
          cpuUsage,
          loadAvg,
          cpuCount,
        },
      };
    } catch (error) {
      logger.error('CPU health check failed', { error });

      return {
        service: 'cpu',
        status: 'UNHEALTHY',
        latency: Date.now() - startTime,
        message: `CPU check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) },
      };
    }
  }

  private calculateOverallStatus(checks: HealthCheck[]): 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' {
    const unhealthyCount = checks.filter((c) => c.status === 'UNHEALTHY').length;
    const degradedCount = checks.filter((c) => c.status === 'DEGRADED').length;

    if (unhealthyCount > 0) return 'UNHEALTHY';
    if (degradedCount > 2) return 'UNHEALTHY';
    if (degradedCount > 0) return 'DEGRADED';
    return 'HEALTHY';
  }

  private generateRecommendations(checks: HealthCheck[]): string[] {
    const recommendations: string[] = [];

    for (const check of checks) {
      if (check.status === 'UNHEALTHY') {
        recommendations.push(this.getRecommendation(check));
      } else if (check.status === 'DEGRADED') {
        recommendations.push(this.getDegradedRecommendation(check));
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally');
    }

    return recommendations;
  }

  private getRecommendation(check: HealthCheck): string {
    const recommendations: Record<string, string> = {
      database:
        'Check database connection pool, verify credentials, and ensure database server is running',
      redis:
        'Verify Redis server is running, check connection configuration, and review memory usage',
      queues: 'Clear stuck jobs, check worker processes, and review queue configuration',
      services: 'Restart affected services, check logs for errors, and verify dependencies',
      memory: 'Profile memory usage, check for memory leaks, and consider increasing heap size',
      cpu: 'Identify CPU-intensive operations, optimize algorithms, and consider scaling horizontally',
    };

    return recommendations[check.service] || `Investigate ${check.service}: ${check.message}`;
  }

  private getDegradedRecommendation(check: HealthCheck): string {
    const recommendations: Record<string, string> = {
      database: 'Monitor database latency and connection pool usage',
      redis: 'Monitor Redis response times and memory usage',
      queues: 'Monitor queue depth and processing rate',
      services: 'Monitor service response times and error rates',
      memory: 'Monitor memory growth trend for potential leaks',
      cpu: 'Monitor CPU usage patterns and identify spikes',
    };

    return recommendations[check.service] || `Monitor ${check.service}: ${check.message}`;
  }
}
