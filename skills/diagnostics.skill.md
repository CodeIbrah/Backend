# Nombre

Diagnostics Skill

# Objetivo

Realizar diagnósticos runtime del sistema backend-template analizando CPU, memoria, latencia, cuellos de botella y métricas de rendimiento para identificar degradaciones, anomalías y oportunidades de optimización en los servicios NestJS, PostgreSQL, Redis y BullMQ.

# Responsabilidades

- **Diagnóstico Runtime**: Ejecutar diagnósticos en vivo sobre los servicios en ejecución (main:3010, auth-service:3001, users-service:3002, notifications-service:3003) capturando métricas en tiempo real.
- **Análisis de CPU**: Monitorear utilización de CPU por contenedor, detectar picos, identificar procesos con alto consumo y correlacionar con operaciones específicas (consultas Prisma, procesamiento BullMQ, serialización JSON).
- **Análisis de Memoria**: Tracking de RSS, heap used, heap total, external memory; detección de memory leaks mediante análisis de tasa de crecimiento de heap y frecuencia de garbage collection.
- **Análisis de Latencia**: Medición de percentiles p50, p95, p99 por endpoint, detección de degradación progresiva, identificación de endpoints con latencia anómala.
- **Detección de Cuellos de Botella**: Identificar puntos de congestión en PostgreSQL (slow queries, lock contention, pool exhaustion), Redis (saturación de memoria, tasa de evicción), BullMQ (backlog de jobs, tasa de fallos) y red (conexiones activas, throughput).
- **Análisis de Deadlocks**: Detectar bloqueos circulares en PostgreSQL y deadlocks a nivel de aplicación mediante análisis de traces y métricas de espera.
- **Diagnóstico de Contenedores**: Evaluar salud de contenedores Docker, reinicios, consumo de recursos vs límites asignados.
- **Generación de Recomendaciones**: Producir recomendaciones accionables basadas en hallazgos diagnósticos con prioridad y estimación de impacto.

# Inputs

- Métricas de Prometheus (puerto 9090): CPU, memoria, latencia, error rate, throughput
- Logs de contenedores Docker vía Promtail/Loki
- Health checks de servicios (wget en /api/v1/health)
- Métricas de PostgreSQL: slow queries, lock waits, pool de conexiones
- Métricas de Redis: memoria usada, clientes conectados, tasa de evicción, hit rate
- Métricas de BullMQ: jobs activos, waiting, failed, processing time
- Node.js internal metrics: heap usage, GC stats, event loop lag
- Datos de Grafana dashboards (puerto 3000)

# Outputs

- Diagnóstico estructurado en formato JSON con métricas actuales, tendencias y anomalías
- Reporte de salud del sistema con score por componente
- Identificación de cuellos de botella con severidad y recomendaciones
- Análisis de memoria con detección de leaks potenciales
- Análisis de latencia con percentiles y endpoints problemáticos
- Recomendaciones de optimización priorizadas
- Alertas al Runtime Monitoring Agent para métricas fuera de umbral
- Datos al Reporting Skill para generación de reportes

# Herramientas usadas

- **Prometheus** (puerto 9090): Recolección de métricas de sistema y aplicación
- **Grafana** (puerto 3000): Dashboards de visualización y alertas
- **Loki** (puerto 3100): Consulta de logs para correlación con métricas
- **Docker**: Inspección de contenedores, stats, logs
- **Node.js**: `process.memoryUsage()`, `v8.getHeapStatistics()`, `perf_hooks`
- **Prisma**: Query logging, slow query detection
- **shared-telemetry** (packages/shared-telemetry): Métricas de aplicación instrumentadas
- **shared-logger** (packages/shared-logger): Logs estructurados para diagnóstico
- **BullMQ**: Métricas de colas y workers

# Workflows

## Workflow 1: Diagnóstico Completo del Sistema

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Iniciar    │───▶│  Recopilar  │───▶│  Analizar    │───▶│  Correlar    │───▶│  Generar    │
│  Diagnóstico│    │  Métricas   │    │  Componentes │    │  Hallazgos   │    │  Reporte    │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  pnpm doctor        Prometheus,            CPU, memoria,         Cruzar métricas      JSON con score,
  o trigger          Docker stats,          latencia, DB,         con logs y           anomalías,
  automático         Node.js metrics        Redis, BullMQ         traces               recomendaciones
```

### Pasos detallados:

1. **Recopilar**: Consultar Prometheus para métricas de los últimos 15 minutos, Docker stats para recursos por contenedor, Node.js metrics para heap y GC
2. **Analizar CPU**: Verificar uso >85%, identificar picos, correlacionar con operaciones
3. **Analizar Memoria**: Verificar heap used >80% de heap total, detectar crecimiento sostenido
4. **Analizar Latencia**: Calcular p50/p95/p99 por endpoint, detectar degradación vs baseline
5. **Analizar DB**: Slow queries (>1s), lock waits, pool usage >80%
6. **Analizar Redis**: Memory usage >80%, eviction rate >10/s, hit rate <90%
7. **Analizar BullMQ**: Failed jobs >5%, waiting jobs >100, processing time >baseline*2
8. **Correlar**: Cruzar hallazgos con logs de Loki para contexto
9. **Generar**: Producir reporte estructurado con score de salud

## Workflow 2: Análisis de Memory Leak

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Detectar   │───▶│  Medir      │───▶│  Calcular    │───▶│  Identificar │───▶│  Recomendar │
│  Crecimiento│    │  Heap       │    │  Tasa de     │    │  Fuente      │    │  Acción     │
│  de Heap    │    │  Over Time  │    │  Crecimiento │    │  del Leak    │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Detectar**: Monitorear heapUsed cada 10 segundos durante 5 minutos
2. **Medir**: Registrar heapUsed, heapTotal, external, RSS en cada intervalo
3. **Calcular**: Determinar tasa de crecimiento (MB/min), estimar tiempo hasta OOM
4. **Identificar**: Correlacionar crecimiento con operaciones específicas (ej: cada request a /api/v1/users incrementa heap en 2MB)
5. **Recomendar**: Sugerir acciones (restart programado, fix de código, aumento de límites)

## Workflow 3: Detección de Cuellos de Botella

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Monitorear │───▶│  Comparar   │───▶│  Identificar │───▶│  Priorizar  │
│  Métricas   │    │  vs Umbrales│    │  Bottleneck  │    │  por Impacto│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Matriz de Detección:

| Componente | Métrica | Umbral Warning | Umbral Critical |
|------------|---------|----------------|-----------------|
| CPU | Usage % | >75% | >90% |
| Memory | Heap used / heap total | >75% | >90% |
| Memory | RSS growth rate | >10MB/min | >50MB/min |
| Latency | p95 | >1s | >3s |
| Latency | p99 | >2s | >5s |
| PostgreSQL | Pool usage | >70% | >90% |
| PostgreSQL | Slow queries | >5/min | >20/min |
| Redis | Memory usage | >75% | >90% |
| Redis | Eviction rate | >5/s | >20/s |
| BullMQ | Failed jobs rate | >2% | >10% |
| BullMQ | Waiting jobs | >50 | >200 |

# Casos de uso

## Caso 1: Diagnóstico de Degradación de Latencia

**Escenario**: p95 de GET /api/v1/users incrementó de 200ms a 2s en última hora.

**Flujo**:
1. Diagnóstico detecta p95 > umbral (1s)
2. Analiza queries Prisma asociadas al endpoint
3. Identifica slow query: SELECT con JOIN faltante en relación
4. Correlaciona con aumento en pool de conexiones de PostgreSQL
5. Genera recomendación: agregar índice en columna de JOIN

**Output**:
```json
{
  "diagnosticId": "diag-20260521-001",
  "type": "LATENCY_DEGRADATION",
  "severity": "HIGH",
  "endpoint": "GET /api/v1/users",
  "metrics": {
    "p50": {"current": "180ms", "baseline": "120ms", "change": "+50%"},
    "p95": {"current": "2.1s", "baseline": "200ms", "change": "+950%"},
    "p99": {"current": "4.5s", "baseline": "350ms", "change": "+1185%"}
  },
  "rootCause": "Missing index on users.email causing full table scan",
  "affectedQueries": ["SELECT * FROM users WHERE email = $1"],
  "recommendation": "CREATE INDEX idx_users_email ON users(email)",
  "estimatedImpact": "p95 should return to <300ms after index creation"
}
```

## Caso 2: Detección de Memory Leak

**Escenario**: Heap de auth-service crece 50MB/min, OOM estimado en 12 minutos.

**Flujo**:
1. Runtime Monitoring detecta heapUsed > 1.5GB (umbral)
2. Diagnostics analiza tasa de crecimiento: 50MB/min
3. Correlaciona con endpoint POST /api/v1/auth/login
4. Identifica: tokens JWT no liberados en caché en memoria
5. Estima OOM en 12 minutos
6. Recomienda: graceful restart inmediato + fix de caché

## Caso 3: Cuello de Botella en BullMQ

**Escenario**: Cola de notificaciones con 500 jobs waiting, processing time 3x normal.

**Flujo**:
1. Diagnóstico detecta waiting jobs > 200 (critical)
2. Analiza processing time: 450ms vs baseline 150ms
3. Identifica causa: worker bloqueado en llamada HTTP externa lenta
4. Recomienda: agregar timeout HTTP, aumentar workers, implementar circuit breaker

# Alertas

- **CRITICAL**: Heap >90% o OOM inminente en <5 min → Trigger auto-recovery
- **HIGH**: CPU >90%, p99 >5s, DB pool >90% → Alerta inmediata
- **MEDIUM**: CPU >75%, p95 >1s, DB pool >70% → Alerta programada
- **LOW**: Tendencia de degradación detectada → Registro para análisis
- **INFO**: Diagnóstico completado sin anomalías → Solo logging

# Integraciones

- **Runtime Monitoring Agent**: Recibe triggers para diagnóstico on-demand
- **Error Analysis Skill**: Proporciona contexto de errores para correlación
- **Performance Skill**: Comparte hallazgos para optimización
- **Auto-Recovery Skill**: Proporciona datos para decisiones de recovery
- **Reporting Skill**: Genera reportes de diagnóstico
- **Prometheus**: Fuente principal de métricas
- **Grafana**: Dashboards para visualización
- **Loki**: Logs para correlación con métricas
- **Docker**: Stats de contenedores para análisis de recursos
- **Prisma**: Slow query log para análisis de base de datos
- **BullMQ**: Métricas de colas para análisis de procesamiento

# Ejemplos

## Ejemplo 1: Diagnóstico Completo

**Comando**: `pnpm doctor`

**Output**:
```json
{
  "diagnosticId": "diag-20260521-full-001",
  "timestamp": "2026-05-21T10:30:00.000Z",
  "healthScore": 72,
  "components": {
    "cpu": {
      "score": 85,
      "status": "healthy",
      "usage": "62%",
      "loadAverage": [2.1, 1.8, 1.5]
    },
    "memory": {
      "score": 45,
      "status": "warning",
      "heapUsed": "1.2GB",
      "heapTotal": "1.5GB",
      "growthRate": "15MB/min",
      "estimatedOOM": "20 minutes"
    },
    "latency": {
      "score": 60,
      "status": "warning",
      "p50": "180ms",
      "p95": "1.2s",
      "p99": "3.1s"
    },
    "database": {
      "score": 70,
      "status": "healthy",
      "poolUsage": "65%",
      "slowQueries": "3/min",
      "lockWaits": 0
    },
    "redis": {
      "score": 90,
      "status": "healthy",
      "memoryUsage": "45%",
      "hitRate": "97%",
      "evictionRate": "0/s"
    },
    "queues": {
      "score": 55,
      "status": "warning",
      "waitingJobs": 120,
      "failedJobs": 8,
      "processingTime": "320ms"
    }
  },
  "anomalies": [
    {
      "component": "memory",
      "type": "HEAP_GROWTH",
      "severity": "HIGH",
      "detail": "Heap growing at 15MB/min, OOM in ~20 min",
      "recommendation": "Investigate memory leak in auth-service"
    },
    {
      "component": "queues",
      "type": "QUEUE_BACKLOG",
      "severity": "MEDIUM",
      "detail": "120 jobs waiting in notifications queue",
      "recommendation": "Scale notification workers or investigate slow processing"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH",
      "action": "Trigger graceful restart of auth-service",
      "impact": "Prevent OOM crash",
      "risk": "LOW"
    },
    {
      "priority": "MEDIUM",
      "action": "Add 2 workers to notifications queue",
      "impact": "Reduce backlog by 60%",
      "risk": "LOW"
    }
  ]
}
```

## Ejemplo 2: Query PromQL para Diagnóstico

```promql
# CPU usage por contenedor
rate(container_cpu_usage_seconds_total{container=~"main|auth-service|users-service|notifications-service"}[5m]) * 100

# Memory usage
container_memory_usage_bytes{container=~"main|auth-service|users-service|notifications-service"} / 1024 / 1024

# Latencia p95 por endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="main"}[5m]))

# PostgreSQL connection pool usage
pg_stat_activity_count{datname="backend_db"} / pg_settings_max_connections * 100

# Redis memory usage
redis_memory_used_bytes / redis_memory_max_bytes * 100

# BullMQ job rates
rate(bullmq_jobs_completed_total{queue="notifications"}[5m])
rate(bullmq_jobs_failed_total{queue="notifications"}[5m])
```

## Ejemplo 3: Análisis de Event Loop Lag

```typescript
// Código de diagnóstico en shared-telemetry
import { monitorEventLoopDelay } from 'perf_hooks';

const histogram = monitorEventLoopDelay({ resolution: 10 });
histogram.enable();

// Cada 10 segundos
setInterval(() => {
  const p50 = histogram.percentile(50) / 1e6; // ms
  const p95 = histogram.percentile(95) / 1e6;
  const p99 = histogram.percentile(99) / 1e6;

  if (p99 > 100) {
    // Event loop lag crítico - posible bloqueo
    logger.warn('Event loop lag critical', { p50, p95, p99 });
  }

  histogram.reset();
}, 10000);
```
