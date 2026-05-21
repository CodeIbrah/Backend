# Nombre

Observability Skill

# Objetivo

Implementar y gestionar la observabilidad completa del sistema backend-template mediante métricas, logging estructurado, traces distribuidos, dashboards y propagación de correlation IDs para permitir monitoreo, debugging y análisis de rendimiento en todos los servicios.

# Responsabilidades

- **Métricas**: Instrumentar y exponer métricas de aplicación y sistema vía Prometheus, incluyendo contadores, gauges, histogramas y summaries para requests, errores, latencia y recursos.
- **Logging Estructurado**: Configurar y mantener Winston logging con formato JSON, niveles apropiados, correlationId, traceId, spanId y contexto de solicitud en todos los servicios (main, auth-service, users-service, notifications-service).
- **Traces Distribuidos**: Implementar OpenTelemetry para tracing distribuido entre servicios, propagación de contexto vía headers HTTP, y export a Jaeger para visualización.
- **Dashboards**: Crear y mantener dashboards en Grafana para visión general del sistema, métricas por servicio, alertas y KPIs de negocio.
- **Correlation IDs**: Garantizar propagación consistente de correlationId a través de todos los servicios, colas BullMQ, y llamadas a base de datos para trazabilidad completa de solicitudes.
- **Alertas**: Configurar reglas de alerta en Prometheus Alertmanager basadas en umbrales de métricas y patrones de anomalía.
- **Integración de Pipelines**: Conectar logs (Winston → Promtail → Loki), métricas (app → Prometheus → Grafana), y traces (OpenTelemetry → Jaeger) en un pipeline cohesivo.
- **Sampling y Retención**: Configurar políticas de sampling para traces y retención para logs y métricas según costo y necesidad.

# Inputs

- Eventos de aplicación desde NestJS (requests, responses, errors, business events)
- Métricas de sistema desde contenedores Docker (CPU, memoria, red, disco)
- Métricas de PostgreSQL (queries, conexiones, locks, buffers)
- Métricas de Redis (operaciones, memoria, conexiones, keys)
- Métricas de BullMQ (jobs, workers, failures, processing time)
- Logs de contenedores Docker
- Traces de solicitudes entre servicios
- Health checks de servicios

# Outputs

- Métricas expuestas en formato Prometheus en /metrics endpoint por servicio
- Logs estructurados en JSON enviados a Loki vía Promtail
- Traces distribuidos exportados a Jaeger vía OTLP
- Dashboards en Grafana con paneles configurados
- Alertas generadas por Prometheus Alertmanager
- Correlation IDs propagados en headers y contexto de solicitud
- Reportes de observabilidad para análisis post-mortem

# Herramientas usadas

- **Winston** (packages/shared-logger): Logging estructurado con transports múltiples
- **OpenTelemetry** (packages/shared-telemetry): Instrumentación automática y SDK de tracing
- **Prometheus** (puerto 9090): Recolección y almacenamiento de métricas time-series
- **Grafana** (puerto 3000): Dashboards y visualización
- **Loki** (puerto 3100): Almacenamiento y consulta de logs
- **Promtail**: Agente de recolección de logs para Loki
- **Jaeger** (puerto 16686): Visualización de traces distribuidos
- **OTLP**: Protocolo de export (HTTP puerto 4318, gRPC puerto 4317)
- **Prometheus Node Exporter**: Métricas de sistema operativo
- **docker-compose.yml**: Orquestación de stack de observabilidad

# Workflows

## Workflow 1: Propagación de Correlation ID

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Request    │───▶│  Generar/   │───▶│  Propagar a  │───▶│  Incluir en  │───▶│  Registrar  │
│  Entra      │    │  Extraer    │    │  Servicios   │    │  Logs y      │    │  en Logs    │
│  via Nginx  │    │  CorrId     │    │  Downstream  │    │  Métricas    │    │  y Traces   │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Request entra**: Nginx recibe request, genera o extrae X-Correlation-ID header
2. **Generar/Extraer**: Si header existe, usarlo; si no, generar UUID v4
3. **Propagar**: Incluir correlationId en headers de llamadas HTTP entre servicios
4. **Incluir en Logs**: Winston logger incluye correlationId en cada log entry
5. **Incluir en Métricas**: Labels de Prometheus incluyen correlationId para correlación
6. **Incluir en Traces**: OpenTelemetry usa correlationId como resource attribute
7. **Propagar a BullMQ**: Incluir correlationId en job data para trazabilidad async

## Workflow 2: Pipeline de Observabilidad

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  METRICS PIPELINE                                                 │  │
│  │  App → Prometheus Client → /metrics → Prometheus → Grafana       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  LOGS PIPELINE                                                    │  │
│  │  App → Winston → stdout → Promtail → Loki → Grafana              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TRACES PIPELINE                                                  │  │
│  │  App → OpenTelemetry SDK → OTLP → Jaeger → Grafana               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CORRELATION                                                      │  │
│  │  correlationId → logs + metrics + traces → unified view          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Workflow 3: Configuración de Dashboard

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Definir    │───▶│  Configurar │───▶│  Provisionar │───▶│  Validar    │
│  Paneles    │    │  Data       │    │  en Grafana  │    │  y Ajustar  │
│  Requeridos │    │  Sources    │    │  vía YAML    │    │  Umbrales   │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Dashboards requeridos:

1. **System Overview**: CPU, memoria, latencia, error rate, throughput de todos los servicios
2. **Service Detail**: Métricas detalladas por servicio (main, auth, users, notifications)
3. **Database**: PostgreSQL queries, conexiones, locks, buffer hit ratio
4. **Cache**: Redis operaciones, memoria, hit rate, eviction rate
5. **Queues**: BullMQ jobs por estado, processing time, failure rate
6. **Traces**: Trace duration, span count, error rate por servicio
7. **Logs**: Log volume por nivel, errores recientes, patrones de error
8. **Business**: KPIs de negocio (usuarios activos, requests por tipo, conversiones)

# Casos de uso

## Caso 1: Debugging de Request Multi-Servicio

**Escenario**: Request a POST /api/v1/orders falla intermitentemente.

**Flujo**:
1. Usuario reporta error, proporciona correlationId: corr-abc-123
2. Buscar en Grafana/Loki: `{correlationId="corr-abc-123"}`
3. Ver trace en Jaeger con traceId asociado
4. Reconstruir flujo: nginx → main → users-service → PostgreSQL → notifications-service → BullMQ
5. Identificar span con error: PostgreSQL query timeout en users-service
6. Ver métricas de PostgreSQL en ese momento: pool al 100%
7. Conclusión: timeout causado por pool exhaustion, no bug en código

## Caso 2: Monitoreo de SLA

**Escenario**: Verificar que p95 de latencia se mantiene bajo 1s para endpoints críticos.

**Flujo**:
1. Configurar dashboard con histogram_quantile(0.95, rate(...))
2. Configurar alerta en Prometheus: p95 > 1s por 5 minutos
3. Configurar panel de SLA compliance: % de requests bajo umbral
4. Revisar daily via reporte automático

## Caso 3: Análisis Post-Mortem

**Escenario**: Incidente de 33 minutos de downtime requiere análisis completo.

**Flujo**:
1. Extraer todos los logs del período del incidente vía LogQL
2. Extraer traces del período vía Jaeger API
3. Extraer métricas del período vía PromQL
4. Correlar todo mediante correlationId y timestamps
5. Generar timeline del incidente
6. Identificar punto de inicio, propagación y resolución

# Alertas

- **CRITICAL**: Servicio down (health check fail por 3 intentos) → Page on-call
- **HIGH**: Error rate >5% por 5 minutos → Alerta Slack + email
- **HIGH**: p99 latencia >5s por 5 minutos → Alerta Slack
- **MEDIUM**: Log volume spike >200% vs baseline → Alerta Slack
- **MEDIUM**: Trace error rate >1% → Alerta Slack
- **LOW**: Métrica fuera de baseline histórico → Registro para revisión
- **INFO**: Deployment completado, baseline recalculado → Solo logging

## Reglas de Alerta Prometheus

```yaml
groups:
  - name: backend-template-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High error rate on {{ $labels.service }}"

      - alert: HighLatencyP99
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High p99 latency on {{ $labels.service }}"

      - alert: ServiceDown
        expr: up{job=~"main|auth-service|users-service|notifications-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
```

# Integraciones

- **shared-logger** (packages/shared-logger): Configuración central de Winston logging
- **shared-telemetry** (packages/shared-telemetry): Instrumentación OpenTelemetry
- **shared-analytics** (packages/shared-analytics): Métricas de negocio y usuario
- **shared-reports** (packages/shared-reports): Generación de reportes desde datos de observabilidad
- **Error Analysis Skill**: Usa logs y traces para análisis de errores
- **Diagnostics Skill**: Usa métricas para diagnóstico runtime
- **Tracing Skill**: Implementación específica de tracing distribuido
- **Analytics Skill**: Métricas de usuario y evento
- **Reporting Skill**: Datos para reportes automáticos
- **Docker Compose**: Stack completo de observabilidad (Prometheus, Grafana, Loki, Jaeger)
- **Nginx Gateway**: Propagación de correlationId en reverse proxy

# Ejemplos

## Ejemplo 1: Log Estructurado con Correlation ID

**Input** (código NestJS):
```typescript
import { LoggerService } from '@nestjs/common';
import { CorrelationIdService } from './correlation-id.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: LoggerService,
    private readonly correlationId: CorrelationIdService,
  ) {}

  async findOne(id: string) {
    this.logger.log('Finding user', { userId: id });
    const user = await this.prisma.user.findUnique({ where: { id } });
    this.logger.log('User found', { userId: id, found: !!user });
    return user;
  }
}
```

**Output** (log JSON):
```json
{
  "timestamp": "2026-05-21T10:15:32.123Z",
  "level": "info",
  "message": "Finding user",
  "correlationId": "corr-abc-123",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "service": "users-service",
  "userId": "user-456",
  "endpoint": "GET /api/v1/users/user-456",
  "requestId": "req-789"
}
```

## Ejemplo 2: Query LogQL para Debugging

```logql
# Todos los logs de un correlationId específico
{job="backend-template"} |= "corr-abc-123" | json | line_format "{{.timestamp}} [{{.level}}] {{.service}}: {{.message}}"

# Errores en auth-service en última hora
{job="backend-template", service="auth-service"} |= "level\":\"error" | json | line_format "{{.message}}"

# Logs con latencia > 1s
{job="backend-template"} | json | duration > 1000 | line_format "{{.correlationId}} - {{.endpoint}} - {{.duration}}ms"

# Patrón de errores de autenticación
{job="backend-template"} |~ "(Unauthorized|Forbidden|Invalid.*token)" | json | line_format "{{.service}}: {{.message}}"
```

## Ejemplo 3: Query PromQL para Métricas

```promql
# Request rate por servicio
rate(http_requests_total{service=~"main|auth-service|users-service|notifications-service"}[5m])

# Error rate por servicio
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# Latencia p95 por endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="main"}[5m]))

# Active connections PostgreSQL
pg_stat_activity_count{datname="backend_db", state="active"}

# Redis hit rate
rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m])) * 100

# BullMQ queue depth
bullmq_jobs_waiting{queue="notifications"}
```

## Ejemplo 4: Configuración OpenTelemetry

```typescript
// packages/shared-telemetry/src/otel-config.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function createTelemetrySDK(serviceName: string) {
  return new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
    }),
  });
}
```
