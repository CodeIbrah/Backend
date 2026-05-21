# Nombre

Performance Skill

# Objetivo

Analizar, optimizar y escalar el rendimiento del sistema backend-template mediante profiling, análisis de latencia, optimización de caché, optimización de colas y recomendaciones de scaling para garantizar respuesta rápida y eficiencia de recursos en todos los servicios.

# Responsabilidades

- **Profiling**: Ejecutar profiling de CPU y memoria en servicios NestJS para identificar funciones costosas, hot paths y oportunidades de optimización.
- **Análisis de Latencia**: Analizar latencia end-to-end de requests, identificar componentes lentos en la cadena de servicios y establecer baselines de rendimiento.
- **Optimización de Caché**: Diseñar y optimizar estrategias de caché con Redis, incluyendo cache keys, TTL, invalidation patterns, y cache-aside vs write-through.
- **Optimización de Colas**: Optimizar procesamiento de colas BullMQ, incluyendo concurrency, batch processing, retry strategies, y worker scaling.
- **Recomendaciones de Scaling**: Generar recomendaciones de scaling horizontal y vertical basadas en métricas de rendimiento, patrones de tráfico y análisis de capacidad.
- **Benchmarking**: Ejecutar benchmarks de endpoints críticos, comparar rendimiento entre versiones y detectar regresiones de rendimiento.
- **Resource Optimization**: Optimizar uso de recursos (CPU, memoria, conexiones) por servicio, identificar waste y recomendar ajustes.
- **Performance Budgets**: Definir y monitorear performance budgets por endpoint (p95 < 500ms, error rate < 0.1%) y alertar cuando se exceden.

# Inputs

- Métricas de latencia desde Prometheus (p50, p95, p99 por endpoint)
- Traces distribuidos desde Jaeger con duración de spans
- Métricas de Redis (hit rate, memory usage, operations/sec)
- Métricas de BullMQ (processing time, queue depth, worker utilization)
- Profiling data de Node.js (CPU profiles, heap snapshots)
- Métricas de PostgreSQL (query times, index usage, buffer hit ratio)
- Métricas de sistema (CPU, memory, network I/O por contenedor)
- Resultados de benchmarks de endpoints

# Outputs

- Reportes de profiling con hot paths y funciones costosas
- Análisis de latencia con breakdown por componente
- Recomendaciones de optimización de caché
- Recomendaciones de optimización de colas
- Planes de scaling con estimaciones de capacidad
- Resultados de benchmarking con comparativas
- Performance budgets y alertas de violación
- Recomendaciones de optimización de recursos

# Herramientas usadas

- **Node.js Profiler**: --prof flag, clinic.js, 0x para profiling de CPU
- **Node.js Heap Profiler**: --inspect para heap snapshots, memlab para análisis
- **Redis** (puerto 6379): Caché y optimización de acceso a datos
- **BullMQ**: Colas de jobs y procesamiento async
- **Prometheus** (puerto 9090): Métricas de rendimiento
- **Jaeger** (puerto 16686): Traces para análisis de latencia
- **Grafana** (puerto 3000): Dashboards de rendimiento
- **Prisma** (main/src/prisma): Optimización de queries de base de datos
- **shared-telemetry** (packages/shared-telemetry): Métricas instrumentadas
- **shared-logger** (packages/shared-logger): Logging de rendimiento
- **autocannon/k6**: Herramientas de load testing y benchmarking

# Workflows

## Workflow 1: Profiling de CPU

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Iniciar    │───▶│  Ejecutar   │───▶│  Capturar    │───▶│  Analizar    │───▶│  Recomendar │
│  Profiling  │    │  Carga de   │    │  Profile     │    │  Hot Paths   │    │  Optimización│
│  en Servicio│    │  Trabajo    │    │  Data        │    │  y Funciones │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Node.js --prof,     Load test con       CPU profile,        Funciones con mayor   Optimizar algoritmo,
  clinic.js, 0x       autocannon/k6       flamegraph          CPU time, call tree   agregar caché, parallelize
```

### Pasos detallados:

1. **Iniciar**: Habilitar profiling en servicio (NODE_OPTIONS="--prof" o clinic.js)
2. **Ejecutar Carga**: Ejecutar load test representativo con autocannon o k6
3. **Capturar**: Generar CPU profile y flamegraph
4. **Analizar**: Identificar funciones con mayor CPU time, hot paths, bottlenecks
5. **Recomendar**: Sugerir optimizaciones específicas (algoritmo, caché, parallelización)

## Workflow 2: Optimización de Caché

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Analizar   │───▶│  Identificar│───▶│  Diseñar     │───▶│  Implementar │───▶│  Medir      │
│  Patrones   │    │  Candidatos │    │  Estrategia  │    │  Caché       │    │  Impacto    │
│  de Acceso  │    │  para Caché │    │  de Caché    │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Estrategias de Caché:

| Patrón | Caso de Uso | TTL | Invalidation |
|--------|-------------|-----|--------------|
| Cache-Aside | Lecturas frecuentes, escrituras infrecuentes | 5-30min | Delete en write |
| Write-Through | Consistencia fuerte requerida | N/A | Automático |
| Write-Behind | Escrituras batch, tolerancia a pérdida | N/A | Flush periódico |
| Refresh-Ahead | Datos predecibles, acceso periódico | Variable | Refresh antes de expire |

## Workflow 3: Recomendaciones de Scaling

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Analizar   │───▶│  Evaluar    │───▶│  Calcular    │───▶│  Generar     │───▶│  Validar    │
│  Métricas   │    │  Capacidad  │    │  Requerimientos│   │  Plan de     │    │  con Load   │
│  Actuales   │    │  Actual     │    │  de Scaling  │    │  Scaling     │    │  Test       │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Tipos de Scaling:

| Tipo | Cuándo | Cómo | Ejemplo |
|------|--------|------|---------|
| Horizontal | CPU >70%, latencia alta | Más réplicas del servicio | docker compose scale main=3 |
| Vertical | Memoria alta, CPU alto | Más recursos por contenedor | Aumentar memory limit a 2GB |
| Database | Queries lentas, pool lleno | Read replicas, connection pooling | PgBouncer, read replicas |
| Cache | DB load alto, hit rate bajo | Más memoria Redis, clustering | Redis cluster, más memoria |
| Queue | Backlog creciente, processing lento | Más workers, más colas | BullMQ workers x3 |

# Casos de uso

## Caso 1: Profiling de Endpoint Lento

**Escenario**: POST /api/v1/orders tarda 2s p95, se necesita identificar bottleneck.

**Flujo**:
1. Ejecutar profiling con clinic.js durante load test
2. Generar flamegraph del endpoint
3. Analizar: 60% del tiempo en serialización JSON, 25% en query Prisma, 15% en validación
4. Optimización 1: Usar JSON serializer más rápido (fast-json-stringify) → 40% mejora
5. Optimización 2: Optimizar query Prisma con include selectivo → 20% mejora
6. Resultado: p95 de 2s → 800ms (60% mejora)

**Output**:
```json
{
  "profileId": "prof-20260521-001",
  "endpoint": "POST /api/v1/orders",
  "beforeOptimization": {
    "p50": "800ms",
    "p95": "2.0s",
    "p99": "4.5s"
  },
  "cpuBreakdown": {
    "jsonSerialization": "60%",
    "prismaQuery": "25%",
    "validation": "10%",
    "other": "5%"
  },
  "optimizations": [
    {
      "target": "jsonSerialization",
      "action": "Replace JSON.stringify with fast-json-stringify",
      "expectedImprovement": "40% reduction in serialization time",
      "risk": "LOW"
    },
    {
      "target": "prismaQuery",
      "action": "Use selective include instead of loading all relations",
      "expectedImprovement": "20% reduction in query time",
      "risk": "LOW"
    }
  ],
  "afterOptimization": {
    "p50": "320ms",
    "p95": "800ms",
    "p99": "1.8s"
  },
  "overallImprovement": "60% p95 reduction"
}
```

## Caso 2: Optimización de Caché Redis

**Escenario**: GET /api/v1/users/:id hace query a DB en cada request, alta carga en PostgreSQL.

**Flujo**:
1. Analizar patrones de acceso: 80% de requests son para mismos 20% de usuarios
2. Diseñar estrategia cache-aside con TTL de 5 minutos
3. Implementar: verificar Redis primero, si miss, query DB y cachear
4. Invalidar caché en actualizaciones de usuario
5. Resultado: hit rate 75%, DB queries reducidas 75%

## Caso 3: Scaling de BullMQ Workers

**Escenario**: Cola de notificaciones con backlog de 500 jobs, processing time 3x normal.

**Flujo**:
1. Analizar: 1 worker procesando 100 jobs/min, llegan 300 jobs/min
2. Calcular: se necesitan 3 workers para mantener throughput
3. Recomendación: escalar workers de 1 a 4 (con buffer)
4. Implementar: docker compose scale notifications-service=4
5. Resultado: backlog cleared en 5 minutos, processing time normal

# Alertas

- **CRITICAL**: p99 > 5s en endpoint crítico → Alerta inmediata
- **HIGH**: Performance budget violado (p95 > target) → Alerta de degradación
- **HIGH**: Cache hit rate < 50% → Alerta de eficiencia de caché
- **MEDIUM**: CPU > 80% sostenido → Alerta de capacidad
- **MEDIUM**: Queue processing time > 2x baseline → Alerta de cola
- **LOW**: Regresión de rendimiento detectada en benchmark → Registro
- **INFO**: Benchmark completado, resultados guardados → Logging

# Integraciones

- **Diagnostics Skill**: Diagnósticos de rendimiento para análisis
- **Error Analysis Skill**: Errores relacionados con rendimiento
- **Tracing Skill**: Traces para análisis de latencia
- **Observability Skill**: Métricas y traces como fuentes de datos
- **Auto-Recovery Skill**: Recovery actions para problemas de rendimiento
- **Prisma Debug Skill**: Optimización de queries de base de datos
- **Queue Management Skill**: Optimización de colas BullMQ
- **Redis**: Caché y optimización de acceso a datos
- **Prometheus**: Métricas de rendimiento
- **Jaeger**: Traces para análisis de latencia
- **Grafana**: Dashboards de rendimiento
- **autocannon/k6**: Load testing y benchmarking

# Ejemplos

## Ejemplo 1: Benchmark de Endpoint

```bash
# Benchmark con autocannon
autocannon -c 100 -d 30 -m POST http://localhost:3010/api/v1/orders \
  -H "Content-Type: application/json" \
  -b '{"userId": "user-1", "items": [{"productId": "prod-1", "quantity": 2}]}'

# Output:
# Stat         2.5%   50%    97.5%  99%    Avg      Stdev    Max
# Latency      120ms  200ms  450ms  600ms  220ms    120ms    1200ms
#
# Stat         1%     2.5%   50%    97.5%  Avg
# Req/Sec      300    320    450    480    440
# Bytes/Sec    150KB  160KB  225KB  240KB  220KB
```

## Ejemplo 2: Implementación de Caché

```typescript
// main/src/users/users-cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersCacheService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'user:';

  constructor(
    private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Cache-aside pattern
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - fetch from DB
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) {
      await this.redis.set(cacheKey, JSON.stringify(user), 'EX', this.CACHE_TTL);
    }

    return user;
  }

  async invalidate(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    await this.redis.del(cacheKey);
  }
}
```

## Ejemplo 3: Performance Budget en Prometheus

```yaml
# Performance budgets como reglas de alerta
groups:
  - name: performance-budgets
    rules:
      - alert: P95LatencyBudgetExceeded
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{endpoint="/api/v1/users"}[5m])) > 0.5
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "P95 latency budget exceeded for /api/v1/users (budget: 500ms)"

      - alert: ErrorRateBudgetExceeded
        expr: |
          rate(http_requests_total{status=~"5..", endpoint="/api/v1/orders"}[5m]) /
          rate(http_requests_total{endpoint="/api/v1/orders"}[5m]) > 0.001
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "Error rate budget exceeded for /api/v1/orders (budget: 0.1%)"

      - alert: CacheHitRateLow
        expr: |
          rate(redis_hits_total[5m]) / (rate(redis_hits_total[5m]) + rate(redis_misses_total[5m])) < 0.5
        for: 10m
        labels:
          severity: medium
        annotations:
          summary: "Cache hit rate below 50%"
```

## Ejemplo 4: Scaling Recommendations

```json
{
  "scalingRecommendations": {
    "timestamp": "2026-05-21T10:00:00.000Z",
    "services": {
      "main": {
        "currentReplicas": 1,
        "recommendedReplicas": 3,
        "reason": "CPU usage at 78%, p95 latency above budget",
        "estimatedCost": "+$50/month",
        "expectedImprovement": "p95 latency from 800ms to 300ms"
      },
      "auth-service": {
        "currentReplicas": 1,
        "recommendedReplicas": 2,
        "reason": "Request rate increased 40% week-over-week",
        "estimatedCost": "+$25/month",
        "expectedImprovement": "Handle 2x current load"
      },
      "notifications-service": {
        "currentReplicas": 1,
        "recommendedReplicas": 4,
        "reason": "Queue backlog growing, processing time 3x baseline",
        "estimatedCost": "+$75/month",
        "expectedImprovement": "Clear backlog in 5 minutes, normal processing time"
      }
    },
    "database": {
      "recommendation": "Add PgBouncer connection pooler",
      "reason": "Connection pool at 85%, slow queries increasing",
      "estimatedCost": "+$30/month",
      "expectedImprovement": "Connection pool usage from 85% to 40%"
    },
    "cache": {
      "recommendation": "Increase Redis memory from 256MB to 1GB",
      "reason": "Cache eviction rate at 15/s, hit rate dropping to 60%",
      "estimatedCost": "+$20/month",
      "expectedImprovement": "Hit rate from 60% to 90%"
    },
    "totalEstimatedCost": "+$200/month",
    "totalExpectedImprovement": "System can handle 3x current load with p95 < 500ms"
  }
}
```
