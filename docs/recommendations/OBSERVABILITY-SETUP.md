# Configuración de Observabilidad — Backend Template

> Guía para implementar logging, métricas, tracing y alertas en el sistema.

---

## Índice

- [1. Estrategia de Logging](#1-estrategia-de-logging)
- [2. Métricas con Prometheus](#2-métricas-con-prometheus)
- [3. Tracing Distribuido (OpenTelemetry)](#3-tracing-distribuido-opentelemetry)
- [4. Dashboards en Grafana](#4-dashboards-en-grafana)
- [5. Alertas](#5-alertas)
- [6. Correlación de Datos](#6-correlación-de-datos)

---

## 1. Estrategia de Logging

### 1.1 Winston — Logger Centralizado

```typescript
// common/logger/winston-logger.ts
import winston from 'winston';
import 'winston-loki'; // Para enviar logs a Grafana Loki

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'backend-template',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION ?? 'unknown',
  },
  transports: [
    // Consola (siempre activo)
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              const extra = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} [${level}] ${service}: ${message}${extra}`;
            }),
          ),
    }),
  ],
});

// Adjuntar Loki solo en producción
if (process.env.NODE_ENV === 'production' && process.env.LOKI_URL) {
  logger.add(new winston.transports.Loki({
    host: process.env.LOKI_URL,
    labels: { service: 'backend-template', env: process.env.NODE_ENV },
    json: true,
    basicAuth: process.env.LOKI_AUTH,
    interval: 5, // Enviar cada 5 segundos
  }));
}
```

### 1.2 Logs Estructurados — Formato JSON

```typescript
// Ejemplo de log bien estructurado
logger.info({
  event: 'user.created',
  userId: 'usr_abc123',
  email: 'user@example.com',
  role: 'USER',
  requestId: 'req_xyz789',
  duration: 45, // ms
});

// Log de error con contexto
logger.error({
  event: 'order.payment_failed',
  orderId: 'ord_456',
  userId: 'usr_abc123',
  error: {
    type: 'StripeCardError',
    code: 'card_declined',
    message: 'La tarjeta fue rechazada',
  },
  amount: 2999,
  currency: 'MXN',
  requestId: 'req_xyz789',
});
```

### 1.3 Niveles de Log

| Nivel   | Uso                                            | Ejemplo                              |
| ------- | ---------------------------------------------- | ------------------------------------ |
| `error` | Fallos que requieren atención inmediata        | Conexión DB caída, pago fallido      |
| `warn`  | Situaciones anómalas pero no críticas          | Rate limit接近, query lenta          |
| `info`  | Eventos importantes del negocio                | Usuario creado, order completada     |
| `http`  | Logs de peticiones HTTP (Morgan)               | `GET /api/v1/users 200 45ms`         |
| `debug` | Información detallada para desarrollo          | Valores de variables, flujo interno  |

### 1.4 Morgan + Winston

```typescript
// common/logger/http-logger.ts
import morgan from 'morgan';
import { logger } from './winston-logger';

const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Skip logs de health check en producción
function skip(req: Request): boolean {
  if (process.env.NODE_ENV === 'test') return true;
  return req.url === '/health' && req.method === 'GET';
}

export const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip },
);
```

---

## 2. Métricas con Prometheus

### 2.1 Configuración de Métricas

```typescript
// common/metrics/prometheus.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import client from 'prom-client';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly registry: client.Registry;

  // Métricas HTTP
  public readonly httpRequestDuration: client.Histogram;
  public readonly httpRequestTotal: client.Counter;
  public readonly httpRequestErrors: client.Counter;

  // Métricas de negocio
  public readonly activeUsers: client.Gauge;
  public readonly ordersTotal: client.Counter;
  public readonly revenueTotal: client.Counter;

  // Métricas de sistema
  public readonly dbQueryDuration: client.Histogram;
  public readonly queueSize: client.Gauge;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry });

    // HTTP
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duración de peticiones HTTP en segundos',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total de peticiones HTTP',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new client.Counter({
      name: 'http_requests_errors_total',
      help: 'Total de peticiones HTTP con error',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    // DB
    this.dbQueryDuration = new client.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duración de queries a base de datos',
      labelNames: ['model', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    // Negocio
    this.activeUsers = new client.Gauge({
      name: 'active_users',
      help: 'Número de usuarios activos',
      registers: [this.registry],
    });

    this.ordersTotal = new client.Counter({
      name: 'orders_total',
      help: 'Total de órdenes creadas',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.revenueTotal = new client.Counter({
      name: 'revenue_total_mxn',
      help: 'Ingresos totales en MXN',
      registers: [this.registry],
    });

    this.queueSize = new client.Gauge({
      name: 'queue_size',
      help: 'Tamaño de las colas BullMQ',
      labelNames: ['queue'],
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    // Registrar métricas cada 15s
    setInterval(() => this.collectBusinessMetrics(), 15_000);
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  private async collectBusinessMetrics(): Promise<void> {
    try {
      const [activeUsers, pendingOrders] = await Promise.all([
        prisma.user.count({ where: { lastActiveAt: { gte: fiveMinutesAgo() } } }),
        prisma.order.count({ where: { status: 'PENDING' } }),
      ]);

      this.activeUsers.set(activeUsers);
    } catch (error) {
      logger.error({ event: 'metrics.collection_failed', error });
    }
  }
}
```

### 2.2 Endpoint de Métricas

```typescript
// metrics.controller.ts
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: PrometheusService) {}

  @Get()
  @SkipThrottle() // No aplicar rate limiting
  async getMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }
}
```

### 2.3 Histograma de Duración — Interceptor

```typescript
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: PrometheusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.route?.path ?? 'unknown';

    const end = this.metrics.httpRequestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = context.switchToHttp().getResponse().statusCode;
          end({ status });
          this.metrics.httpRequestTotal.inc({ method, route, status });
        },
        error: (err) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          end({ status });
          this.metrics.httpRequestTotal.inc({ method, route, status });
          this.metrics.httpRequestErrors.inc({ method, route, status });
        },
      }),
    );
  }
}
```

### 2.4 Métricas Personalizadas de Negocio

```typescript
// Negocio: actualizar métricas en servicios
@Injectable()
export class OrdersService {
  constructor(private readonly metrics: PrometheusService) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const order = await prisma.order.create({ data: dto });

    // Actualizar métricas de negocio
    this.metrics.ordersTotal.inc({ status: order.status });
    this.metrics.revenueTotal.inc(order.total);

    return order;
  }
}
```

---

## 3. Tracing Distribuido (OpenTelemetry)

### 3.1 Configuración OpenTelemetry

```typescript
// tracing/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'backend-template',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PrismaInstrumentation(),
  ],
});

export async function startTracing(): Promise<void> {
  try {
    await sdk.start();
    logger.info({ event: 'tracing.started', endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT });
  } catch (error) {
    logger.error({ event: 'tracing.start_failed', error });
  }
}

export async function shutdownTracing(): Promise<void> {
  await sdk.shutdown();
}
```

### 3.2 Spans Personalizados

```typescript
// common/tracing/trace.decorator.ts
import { trace, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('backend-template');

export function Trace(name?: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const spanName = name ?? `${target.constructor.name}.${propertyKey}`;

      return tracer.startActiveSpan(spanName, async (span: Span) => {
        try {
          const result = await original.apply(this, args);
          span.setStatus({ code: 1 }); // OK
          return result;
        } catch (error) {
          span.setStatus({
            code: 2, // ERROR
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}

// Uso
@Trace()
async processPayment(orderId: string): Promise<PaymentResult> {
  // Este método se registrará como un span
}
```

### 3.3 Atributos de Span

```typescript
@Trace()
async createOrder(dto: CreateOrderDto): Promise<Order> {
  const span = trace.getActiveSpan();

  // Añadir atributos de negocio
  span?.setAttribute('order.amount', dto.total);
  span?.setAttribute('order.currency', 'MXN');
  span?.setAttribute('order.items_count', dto.items.length);
  span?.setAttribute('user.id', dto.userId);

  const order = await prisma.order.create({
    data: dto,
    select: { id: true, total: true, status: true },
  });

  // Añadir atributos después de crear
  span?.setAttribute('order.id', order.id);

  return order;
}
```

---

## 4. Dashboards en Grafana

### 4.1 Paneles Clave

| Panel                   | Métrica                           | Visualización      |
| ----------------------- | --------------------------------- | ------------------ |
| **RPS**                 | `rate(http_requests_total[5m])`   | Gráfico de líneas  |
| **Latencia p95/p99**    | `histogram_quantile(0.95, ...)`   | Gráfico de líneas  |
| **Tasa de error**       | `rate(http_requests_errors[5m])`  | Stat / Líneas      |
| **Uso de CPU/RAM**      | `nodejs_heap_*`, `process_cpu*`   | Gauge / Líneas     |
| **Queries DB lentas**   | `db_query_duration_seconds`       | Heatmap            |
| **Colas BullMQ**        | `queue_size`                      | Stat / Líneas      |
| **Usuarios activos**    | `active_users`                    | Stat               |
| **Ingresos**            | `revenue_total_mxn`               | Stat               |

### 4.2 Ejemplo de Panel de Latencia

```promql
# p95 de latencia HTTP
histogram_quantile(
  0.95,
  sum by (le, route) (
    rate(http_request_duration_seconds_bucket{route!~"/metrics|/health"}[5m])
  )
)

# p99
histogram_quantile(
  0.99,
  sum by (le) (
    rate(http_request_duration_seconds_bucket[5m])
  )
)
```

### 4.3 Dashboard JSON Snippet

```json
{
  "title": "Backend Template — API Overview",
  "panels": [
    {
      "title": "Requests per second",
      "type": "timeseries",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m]))",
          "legendFormat": "RPS"
        }
      ]
    },
    {
      "title": "Error Rate (%)",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(http_requests_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100",
          "legendFormat": "Error %"
        }
      ],
      "thresholds": [
        { "value": 1, "color": "green" },
        { "value": 5, "color": "yellow" },
        { "value": 10, "color": "red" }
      ]
    }
  ]
}
```

---

## 5. Alertas

### 5.1 AlertManager — Reglas

```yaml
# prometheus/alerts.yml
groups:
  - name: backend-template
    rules:
      # Alta tasa de errores
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_errors_total[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Tasa de error superior al 5%"
          description: "La tasa de error ha sido del {{ $value | humanizePercentage }} en los últimos 5 minutos"

      # Latencia alta
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latencia p95 superior a 2s"
          description: "La latencia p95 es de {{ $value }}s"

      # Servicio caído
      - alert: InstanceDown
        expr: up{job="backend-template"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Instancia caída"
          description: "La instancia {{ $labels.instance }} no responde"

      # Pool de conexiones DB alto
      - alert: DBConnectionPoolHigh
        expr: db_connections_active / db_connections_max > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pool de conexiones DB al {{ $value | humanizePercentage }}"
          description: "El pool de conexiones está al {{ $value | humanizePercentage }}"

      # Heap cercano al límite
      - alert: MemoryPressure
        expr: nodejs_heap_size_used_bytes / nodejs_heap_size_limit_bytes > 0.85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Heap al {{ $value | humanizePercentage }}"
          description: "El heap de Node.js está al {{ $value | humanizePercentage }} del límite"
```

### 5.2 Canales de Alerta

```yaml
# alertmanager/config.yml
route:
  receiver: "slack-ops"
  routes:
    - match:
        severity: critical
      receiver: "pagerduty-critical"
      continue: true
    - match:
        severity: warning
      receiver: "slack-ops"

receivers:
  - name: "slack-ops"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/xxx/yyy/zzz"
        channel: "#ops-alerts"
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .CommonAnnotations.description }}'
        color: '{{ if eq .CommonLabels.severity "critical" }}danger{{ else }}warning{{ end }}'

  - name: "pagerduty-critical"
    pagerduty_configs:
      - routing_key: "your-pagerduty-key"
        severity: critical
        description: '{{ .CommonAnnotations.summary }}'
```

### 5.3 Health Check Endpoint

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const allHealthy = checks.every((c) => c.status === 'healthy');
    const httpStatus = allHealthy ? 200 : 503;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { name: 'database', status: 'healthy' };
    } catch {
      return { name: 'database', status: 'unhealthy', error: 'Cannot connect to database' };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    try {
      await redis.ping();
      return { name: 'redis', status: 'healthy' };
    } catch {
      return { name: 'redis', status: 'unhealthy', error: 'Cannot connect to Redis' };
    }
  }

  private async checkQueue(): Promise<HealthCheckResult> {
    try {
      const queue = new Queue('health-check', { connection: redis });
      const counts = await queue.getJobCounts();
      const failed = counts.failed ?? 0;
      return {
        name: 'queue',
        status: failed < 100 ? 'healthy' : 'degraded',
        details: { failedJobs: failed },
      };
    } catch {
      return { name: 'queue', status: 'unhealthy', error: 'Queue check failed' };
    }
  }
}
```

---

## 6. Correlación de Datos

### 6.1 Correlation ID

```typescript
// Middleware para correlation ID
function correlationId(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) ?? crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}

// Incluir en todos los logs
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format((info) => {
      info.correlationId = getCurrentCorrelationId();
      return info;
    })(),
  ),
});
```

### 6.2 Ejemplo de Correlación

```json
{
  "timestamp": "2026-06-29T10:15:32.123Z",
  "level": "error",
  "service": "backend-template",
  "correlationId": "corr-abc-123",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "event": "order.payment_failed",
  "orderId": "ord_456",
  "error": {
    "type": "StripeCardError",
    "message": "card_declined"
  }
}
```

---

> **Referencias**: [OpenTelemetry Docs](https://opentelemetry.io/docs/), [Prometheus Best Practices](https://prometheus.io/docs/practices/), [Grafana Dashboard Docs](https://grafana.com/docs/grafana/latest/dashboards/).
