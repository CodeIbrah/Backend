# Nombre

Prisma Debug Skill

# Objetivo

Diagnosticar y optimizar operaciones de base de datos con Prisma ORM en el sistema backend-template, identificando slow queries, problemas de migraciones, deadlocks, problemas de connection pool y oportunidades de optimización de queries para PostgreSQL.

# Responsabilidades

- **Slow Query Detection**: Identificar y analizar queries Prisma que exceden umbrales de tiempo (>100ms warning, >1s critical), incluyendo queries con N+1, full table scans, y missing indexes.
- **Debug de Migraciones**: Diagnosticar problemas con migraciones Prisma (prisma migrate), incluyendo migraciones fallidas, conflictos de schema, y problemas de rollback.
- **Detección de Deadlocks**: Identificar deadlocks en PostgreSQL causados por transacciones concurrentes, analizar patrones de lock y recomendar soluciones.
- **Connection Pool Analysis**: Monitorear y optimizar el connection pool de Prisma, detectando pool exhaustion, connection leaks, y configuraciones subóptimas.
- **Query Optimization**: Analizar execution plans de queries Prisma, identificar oportunidades de optimización (índices, query restructuring, batching) y recomendar cambios.
- **Schema Validation**: Validar schema Prisma contra mejores prácticas, detectar relaciones problemáticas, tipos de datos incorrectos y missing constraints.
- **Transaction Analysis**: Analizar transacciones largas, isolation level issues, y patrones de transacción problemáticos.
- **Data Integrity**: Detectar problemas de integridad de datos (foreign key violations, constraint violations, data corruption).

# Inputs

- Query logs de Prisma (tiempo de ejecución, query SQL, parámetros)
- Execution plans de PostgreSQL (EXPLAIN ANALYZE)
- Métricas de connection pool (active, idle, waiting connections)
- Logs de migraciones Prisma (prisma migrate status, prisma migrate diff)
- Deadlock logs de PostgreSQL
- Métricas de PostgreSQL desde Prometheus (queries, locks, buffers, checkpoints)
- Schema Prisma (schema.prisma)
- Datos de tablas y índices desde PostgreSQL

# Outputs

- Reportes de slow queries con execution plans y recomendaciones
- Diagnósticos de problemas de migraciones
- Análisis de deadlocks con patrones y soluciones
- Recomendaciones de optimización de connection pool
- Queries optimizadas alternativas
- Reportes de validación de schema
- Alertas de problemas de base de datos

# Herramientas usadas

- **Prisma Client** (main/src/prisma): ORM para queries y transacciones
- **Prisma Studio**: UI visual para explorar datos y ejecutar queries
- **Prisma CLI**: prisma migrate, prisma generate, prisma db pull, prisma validate
- **PostgreSQL** (puerto 5432): Base de datos principal
- **pg_stat_statements**: Extensión de PostgreSQL para tracking de queries
- **EXPLAIN ANALYZE**: Análisis de execution plans
- **Prometheus**: Métricas de PostgreSQL (pg_stat_activity, locks, buffers)
- **shared-logger** (packages/shared-logger): Logging de queries y errores
- **shared-telemetry** (packages/shared-telemetry): Spans de Prisma instrumentation

# Workflows

## Workflow 1: Detección y Análisis de Slow Queries

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Capturar   │───▶│  Filtrar    │───▶│  Analizar    │───▶│  Generar     │───▶│  Recomendar │
│  Query Log  │    │  Queries    │    │  Execution   │    │  Reporte     │    │  Optimización│
│  de Prisma  │    │  Lentas     │    │  Plan        │    │  de Análisis │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Prisma query       duration > umbral    EXPLAIN ANALYZE,     Query, tiempo,       Índices, batching,
  logging activado   (warning/critical)   identificar瓶颈       tables, indexes      query rewrite
```

### Pasos detallados:

1. **Capturar**: Prisma query logging captura todas las queries con duración
2. **Filtrar**: Identificar queries con duración >100ms (warning) o >1s (critical)
3. **Analizar**: Ejecutar EXPLAIN ANALYZE para obtener execution plan
4. **Generar**: Crear reporte con query, execution plan, tiempo, tables accedidas
5. **Recomendar**: Sugerir índices, query restructuring, o batching

## Workflow 2: Debug de Migraciones

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Migración  │───▶│  Verificar  │───▶│  Analizar    │───▶│  Ejecutar    │───▶│  Verificar  │
│  Fallida    │    │  Estado     │    │  Diferencia  │    │  con Dry Run │    │  Post-Migration│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Migración Fallida**: prisma migrate deploy falla con error
2. **Verificar**: prisma migrate status para ver estado de migraciones
3. **Analizar**: prisma migrate diff para ver diferencias entre schema y DB
4. **Ejecutar**: prisma migrate deploy --dry-run para validar sin aplicar
5. **Verificar**: Después de aplicar, verificar schema y datos

## Workflow 3: Análisis de Connection Pool

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Monitorear │───▶│  Analizar   │───▶│  Detectar    │───▶│  Identificar │───▶│  Optimizar  │
│  Pool Stats │    │  Utilización│    │  Problemas   │    │  Causa Raíz  │    │  Configuración│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Métricas de Connection Pool:

| Métrica | Warning | Critical | Acción |
|---------|---------|----------|--------|
| Pool usage | >70% | >90% | Aumentar pool size o fix leaks |
| Queue depth | >10 | >50 | Investigar queries lentas |
| Wait time | >100ms | >1s | Optimizar queries o aumentar pool |
| Connection age | >30min | >1hr | Configurar connection timeout |

# Casos de uso

## Caso 1: Slow Query - N+1 Problem

**Escenario**: GET /api/v1/users tarda 3s debido a N+1 queries.

**Flujo**:
1. Prisma debug detecta 1 query principal + 50 queries individuales
2. Query principal: `SELECT * FROM users LIMIT 50`
3. Queries individuales: `SELECT * FROM profiles WHERE userId = ?` (50 veces)
4. Diagnóstico: N+1 problem en relación User → Profile
5. Recomendación: usar `include: { profile: true }` para eager loading

**Output**:
```json
{
  "queryId": "slow-20260521-001",
  "severity": "HIGH",
  "endpoint": "GET /api/v1/users",
  "totalDuration": "3.2s",
  "queryCount": 51,
  "pattern": "N+1",
  "queries": [
    {
      "sql": "SELECT * FROM users LIMIT 50",
      "duration": "12ms",
      "rows": 50
    },
    {
      "sql": "SELECT * FROM profiles WHERE userId = $1",
      "duration": "8ms",
      "count": 50,
      "totalDuration": "400ms"
    }
  ],
  "rootCause": "N+1 query pattern: fetching profiles individually for each user",
  "recommendation": "Use Prisma include for eager loading: prisma.user.findMany({ include: { profile: true } })",
  "expectedImprovement": "3.2s → 50ms (64x faster)"
}
```

## Caso 2: Deadlock en Transacciones Concurrentes

**Escenario**: Dos transacciones concurrentes causan deadlock en tabla orders.

**Flujo**:
1. PostgreSQL detecta deadlock, rollback de una transacción
2. Prisma debug analiza queries de ambas transacciones
3. Identifica: Transacción A bloquea row 1, intenta row 2; Transacción B bloquea row 2, intenta row 1
4. Recomendación: ordenar locks consistentemente o reducir scope de transacciones

## Caso 3: Connection Pool Exhaustion

**Escenario**: Pool de conexiones agotado, queries en cola.

**Flujo**:
1. Prisma debug detecta pool usage >90%, queue depth >50
2. Analiza queries activas: 15 queries lentas (>2s cada una)
3. Identifica: queries sin índice causando full table scans
4. Recomendación: agregar índices + aumentar pool size de 10 a 20
5. Acción inmediata: kill queries lentas, agregar índices

# Alertas

- **CRITICAL**: Deadlock detectado → Alerta inmediata
- **CRITICAL**: Connection pool >95% → Alerta inmediata
- **HIGH**: Slow query >5s → Alerta de rendimiento
- **HIGH**: Migración fallida → Alerta de deployment
- **MEDIUM**: Slow query >1s → Alerta de optimización
- **MEDIUM**: Connection pool >70% → Alerta de capacidad
- **LOW**: Query sin índice detectada → Registro para optimización
- **INFO**: Migración aplicada exitosamente → Logging

# Integraciones

- **Prisma Client** (main/src/prisma): Queries y transacciones
- **shared-logger**: Logging de queries y errores
- **shared-telemetry**: Spans de Prisma instrumentation
- **Diagnostics Skill**: Diagnóstico de rendimiento de base de datos
- **Error Analysis Skill**: Errores de Prisma para análisis
- **Performance Skill**: Optimización de queries
- **PostgreSQL**: Base de datos principal
- **Prometheus**: Métricas de PostgreSQL
- **Prisma Studio**: UI para exploración de datos

# Ejemplos

## Ejemplo 1: Configuración de Query Logging

```typescript
// main/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Query logging
    this.$on('query' as never, async (e: any) => {
      const duration = e.duration;

      if (duration > 1000) {
        logger.error('Slow query detected', {
          query: e.query,
          params: e.params,
          duration: `${duration}ms`,
        });
      } else if (duration > 100) {
        logger.warn('Query above warning threshold', {
          query: e.query,
          duration: `${duration}ms`,
        });
      } else {
        logger.debug('Query executed', {
          query: e.query,
          duration: `${duration}ms`,
        });
      }
    });
  }
}
```

## Ejemplo 2: Análisis de Execution Plan

```sql
-- EXPLAIN ANALYZE para query lenta
EXPLAIN ANALYZE
SELECT "public"."User".*, "public"."Profile".*
FROM "public"."User"
LEFT JOIN "public"."Profile" ON "public"."User"."id" = "public"."Profile"."userId"
WHERE "public"."User"."email" = 'test@example.com';

-- Output típico:
-- Nested Loop Left Join  (cost=0.28..16.35 rows=1 width=200) (actual time=0.045..0.048 rows=1 loops=1)
--   ->  Seq Scan on "User"  (cost=0.00..8.25 rows=1 width=100) (actual time=0.032..0.034 rows=1 loops=1)
--         Filter: (email = 'test@example.com'::text)
--         Rows Removed by Filter: 9999
--   ->  Index Scan using "Profile_userId_key" on "Profile"  (cost=0.28..8.09 rows=1 width=100) (actual time=0.008..0.009 rows=1 loops=1)
--         Index Cond: ("userId" = "User".id)
-- Planning Time: 0.156 ms
-- Execution Time: 0.078 ms

-- Recomendación: Agregar índice en User.email
CREATE INDEX idx_users_email ON "User"(email);
```

## Ejemplo 3: Configuración de Connection Pool

```typescript
// main/src/prisma/prisma.service.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      connectionLimit: 20, // Máximo de conexiones
    },
  },
});

// O vía DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10
```

## Ejemplo 4: Optimización de Query N+1

```typescript
// ❌ Antes: N+1 problem
const users = await prisma.user.findMany({ take: 50 });
const usersWithProfiles = await Promise.all(
  users.map(async (user) => ({
    ...user,
    profile: await prisma.profile.findUnique({ where: { userId: user.id } }),
  }))
);
// 1 + 50 = 51 queries

// ✅ Después: Eager loading con include
const usersWithProfiles = await prisma.user.findMany({
  take: 50,
  include: {
    profile: true,
  },
});
// 1 query con JOIN
```

## Ejemplo 5: Query PromQL para PostgreSQL

```promql
# Active connections
pg_stat_activity_count{datname="backend_db"}

# Connections by state
pg_stat_activity_count{datname="backend_db", state="active"}
pg_stat_activity_count{datname="backend_db", state="idle"}

# Lock waits
pg_locks_count{datname="backend_db", mode="ExclusiveLock"}

# Buffer hit ratio (should be >99%)
pg_stat_database_blks_hit{datname="backend_db"} /
(pg_stat_database_blks_hit{datname="backend_db"} + pg_stat_database_blks_read{datname="backend_db"}) * 100

# Slow queries count
pg_stat_statements_calls{datname="backend_db", mean_time > "1000"}
```
