# Research Paper 1 — Backend-template: gaps production-ready, bottlenecks y deuda técnica

**Fecha:** 2026-05-21
**Repo analizado:** `backend-template`
**Modo:** lectura estática solamente

## 1. Resumen ejecutivo

`Backend-template` se presenta como un backend "enterprise-ready" con arquitectura híbrida: un monolito NestJS principal, microservicios Express, frontend, gateway Nginx, PostgreSQL/Prisma, Redis/BullMQ, Prometheus/Grafana/Loki/Jaeger y un sistema de "AI doctor" para diagnóstico. La intención arquitectónica es ambiciosa y contiene piezas útiles de scaffolding: validación global, Swagger, filtros/interceptores, colas, health/metrics, Dockerfiles multi-stage, tracing y logging.

El hallazgo central es que el repo todavía está más cerca de un prototipo/scaffold demostrativo que de una base production-ready. La deuda más grave está en persistencia y consistencia: varios microservicios críticos usan `Map` en memoria como almacén de datos; hay operaciones de pago simuladas con `Math.random()` y `setTimeout`; los endpoints de health no verifican dependencias; la observabilidad existe en archivos pero no siempre mide tráfico real; y hay documentación que promete más de lo que el runtime implementa.

Conclusión: útil como catálogo de patrones y como referencia de estructura, pero no debe adoptarse como backend productivo sin una refactorización fuerte de datos, seguridad, observabilidad, pruebas y contratos operativos.

## 2. Qué hace el backend

### 2.1 Propósito funcional

- API principal NestJS bajo `/api/v1`.
- Autenticación, usuarios, analytics, reportes, métricas, health y ops dashboard.
- Microservicios Express separados para auth, users, notifications y payments.
- Servicio de pagos con pagos, facturas, recibos y rutas admin.
- Frontend con cliente Axios y refresh token.
- Infraestructura Docker Compose con PostgreSQL, Redis, Prometheus, Grafana, Loki, Promtail, Jaeger y Nginx.
- Paquetes compartidos (`packages/*`) para logger, analytics, AI providers, types, utils, reports y telemetry.

### 2.2 Stack detectado

- Lenguaje: TypeScript.
- Monolito: NestJS 10.
- Microservicios: Express.
- ORM: Prisma en el monolito principal.
- DB: PostgreSQL declarada en Prisma y Docker Compose.
- Cache/queue: Redis + BullMQ.
- Observabilidad: prom-client, OpenTelemetry, Jaeger, Prometheus, Grafana, Loki, Promtail, Winston.
- Seguridad base: helmet, cors, express-rate-limit, JWT, bcrypt, class-validator, Joi env validation, CSRF en producción para NestJS.
- Empaquetado: npm workspaces.

### 2.3 Arquitectura real vs arquitectura declarada

| Declarada                           | Real                                  |
| ----------------------------------- | ------------------------------------- |
| Monolito NestJS para core           | ✅ Implementado con Prisma            |
| Microservicios independientes       | ⚠️ Usan `Map` en memoria, sin DB      |
| Nginx API gateway                   | ✅ Configurado                        |
| PostgreSQL + Prisma como data layer | ✅ Solo en monolito                   |
| Redis/BullMQ para jobs              | ⚠️ Wiring ambiguo                     |
| Observability stack completa        | ⚠️ Endpoints existen, métricas huecas |
| AI doctor con análisis de errores   | ⚠️ Scaffold, no end-to-end            |

## 3. Evidencia estructural

### 3.1 Modelos Prisma principales

`main/src/prisma/schema.prisma` define: `User`, `AnalyticsEvent`, `Incident`, `AuditLog`, `ActivityLog`, `ErrorLog`.

### 3.2 Rutas relevantes detectadas

**Monolito:** auth, users, analytics, activity-log, reports, health, metrics, ops.

**Microservicios:** auth-service, users-service, notifications-service, payment-service (payments, invoices, receipts, admin).

## 4. Production-ready gaps y severidad

Escala: **Crítica** → **Alta** → **Media** → **Baja**

### G1 — Persistencia falsa en microservicios críticos

**Severidad: Crítica**

Evidencia: `payment.service.ts`, `invoice.service.ts`, `receipt.service.ts`, `notifications.service.ts`, `users.service.ts` usan `private store = new Map<string, ...>();`.

Impacto: Datos desaparecen al reiniciar. No hay consistencia transaccional ni escalado horizontal.

Remediación: Migrar a PostgreSQL + Prisma/Drizzle. Definir migraciones, constraints, idempotency keys.

### G2 — Payment processing simulado y no determinista

**Severidad: Crítica**

Evidencia: `Math.random() > 0.1` para éxito/fallo. `setTimeout(resolve, Math.random() * 500 + 100)` para latencia. `forceCompletePayment` muta estado local.

Impacto: No existe integración real con proveedor. No hay idempotencia, conciliación, firma de webhooks ni estados auditables.

Remediación: Adapters explícitos (sandbox/mock deterministic, provider real). Idempotency keys, recibos persistentes, webhooks firmados, ledger.

### G3 — Health checks superficiales

**Severidad: Alta**

Evidencia: `this.health.check([])` sin probes. Microservicios responden `status: healthy` sin verificar Redis, DB, queue.

Impacto: Falsos positivos operativos.

Remediación: Health shallow + Readiness deep con DB ping, Redis ping, queue ping.

### G4 — Observabilidad declarada pero parcialmente hueca

**Severidad: Alta**

Evidencia: `const metricsRegistry = new Registry();` sin métricas HTTP registradas. Alert rules esperan métricas que no se emiten.

Impacto: Prometheus scrapea endpoints vacíos. Alertas no disparan.

Remediación: Instrumentar HTTP request count, duration histogram, error count, queue depth, DB latency.

### G5 — Falta de control de cache real para lecturas costosas

**Severidad: Alta**

Evidencia: Redis se usa para BullMQ, no como cache de queries analíticas. Analytics consulta en caliente desde DB.

Impacto: CPU y memoria en agregaciones repetidas.

Remediación: Cache TTL, pre-aggregations, materialized views.

### G6 — Bottlenecks por escaneo y agregación en memoria

**Severidad: Alta**

Evidencia: `analytics.service.ts` hace `findMany` de 24h y calcula en Node. Percentiles ordenan arrays completos en memoria.

Impacto: O(n) u O(n log n) por request. Alto consumo de memoria.

Remediación: Mover agregaciones a SQL con `GROUP BY`, `date_trunc`. Jobs async para exports.

### G7 — Índices incompletos para filtros compuestos

**Severidad: Media-Alta**

Evidencia: Índices simples en Prisma. Queries combinan `type + timestamp`, `service + timestamp`, `severity + createdAt`.

Remediación: Índices compuestos: `(type, timestamp desc)`, `(service, timestamp desc)`, GIN para JSON.

### G8 — No hay worker wiring claro para algunos BullMQ processors

**Severidad: Alta**

Evidencia: `AnalyticsService.flush()` encola jobs pero no se observa wiring robusto de Worker conectado.

Impacto: Riesgo de jobs encolados sin procesamiento.

Remediación: Centralizar contratos de queue/job name. Tests de integración.

### G9 — Seguridad parcial e inconsistente

**Severidad: Alta**

Evidencia: Defaults peligrosos en Docker Compose. `/metrics` sin protección en microservicios. Frontend guarda tokens en `localStorage`.

Remediación: Perfiles local/dev/prod fail-closed. Proteger `/metrics`. Refresh token en cookie httpOnly.

### G10 — Contradicciones de tooling y documentación

**Severidad: Media**

Evidencia: README declara pnpm + Turborepo; root usa npm workspaces. `shared-analytics` tiene comentario "Stub".

Remediación: Documentar qué es scaffold, qué es demo, qué está production-ready.

### G11 — Sync filesystem I/O en endpoints de reportes

**Severidad: Media**

Evidencia: `fs.existsSync`, `fs.writeFileSync`, `fs.readdirSync` en request path.

Remediación: Usar `fs.promises` y/o mover a jobs.

### G12 — Microservicios duplican bootstrap y middleware

**Severidad: Media**

Evidencia: 4 microservicios repiten setup de Express: helmet, cors, compression, rateLimit, morgan.

Remediación: Extraer factory común `createServiceApp()`.

### G13 — Exports y admin endpoints no preparados para volumen

**Severidad: Alta**

Evidencia: `findByFilters(filters, 1, 10000)`. Activity exports retornan arrays completos.

Remediación: Export async por job + archivo + expiración. RBAC granular.

### G14 — Graceful shutdown incompleto

**Severidad: Media**

Evidencia: Payment-service tiene shutdown; auth/users/notifications no. No hay draining de queues.

Remediación: Patrón común de shutdown con HTTP drain, queue pause/drain.

### G15 — Testing insuficiente

**Severidad: Alta**

Evidencia: Scripts Jest existen pero sin tests contractuales para persistence, queues, health deep, auth flows, payment idempotency.

Remediación: Unit + integration + contract + smoke tests por servicio.

## 5. Por qué puede ser lento

| Causa                                    | Severidad  | Solución                                |
| ---------------------------------------- | ---------- | --------------------------------------- |
| Analytics carga 24h de datos por request | Alta       | Preagregar, histogramas, percentiles DB |
| Dashboard sin cache                      | Alta       | Cache TTL, snapshots                    |
| Filtros in-memory en microservicios      | Alta       | DB real con índices                     |
| Sync I/O para reportes                   | Media      | fs.promises, jobs                       |
| Métricas/logging overhead sin señal      | Media      | Sampling, métricas útiles               |
| Índices compuestos faltantes             | Media-Alta | Índices compuestos/GIN                  |
| PDF generation en request path           | Media      | Mover a cola                            |

## 6. Deuda técnica real

1. Estado demo en memoria en servicios que aparentan dominio real.
2. Arquitectura híbrida más compleja que su madurez actual.
3. Observabilidad declarativa, no end-to-end.
4. Contratos de queue/job no centralizados.
5. Duplicación de middleware y bootstrap Express.
6. Inconsistencia docs/tooling entre npm, pnpm y turbo.
7. Placeholders en ops dashboard y shared analytics.
8. Seguridad no homogénea entre monolito y microservicios.
9. Falta de idempotencia y ledger en pagos/admin operations.
10. Exports y analytics sin límites robustos.

## 7. Matriz de severidad priorizada

| ID  | Gap                         | Severidad  | Riesgo principal                | Fix prioritario                              |
| --- | --------------------------- | ---------- | ------------------------------- | -------------------------------------------- |
| G1  | Persistencia en memoria     | Crítica    | pérdida/divergencia de datos    | DB real + migrations + constraints           |
| G2  | Payment simulado/random     | Crítica    | dinero/estado no auditable      | adapter sandbox/real + ledger + idempotencia |
| G3  | Health superficial          | Alta       | falsos positivos operativos     | readiness deep con probes                    |
| G4  | Observabilidad hueca        | Alta       | alertas/dashboards inútiles     | métricas reales + validación rules           |
| G6  | Analytics in-memory         | Alta       | latencia/OOM                    | preagregaciones/cache/SQL                    |
| G8  | Queue wiring ambiguo        | Alta       | jobs perdidos                   | contratos y tests de worker                  |
| G9  | Seguridad inconsistente     | Alta       | exposición de endpoints/secrets | perfiles prod fail-closed                    |
| G13 | Admin/export riesgoso       | Alta       | abuso/OOM/estado forzado        | RBAC, audit, async exports                   |
| G7  | Índices incompletos         | Media-Alta | scans caros                     | índices compuestos/GIN                       |
| G11 | Sync FS I/O                 | Media      | bloqueo event loop              | fs.promises/jobs                             |
| G12 | Bootstrap duplicado         | Media      | drift de seguridad              | app factory común                            |
| G14 | Shutdown inconsistente      | Media      | cortes en deploy                | graceful shutdown común                      |
| G10 | Docs/tooling contradictorio | Media      | onboarding erróneo              | readiness matrix honesta                     |

## 8. Recomendación final

No usar `Backend-template` como base productiva directa. Sí puede usarse como muestra de ideas para estructura de monorepo, respuesta API envuelta, saneamiento de nombres de archivo, validación global, env validation fail-closed, patrón de métricas/health protegidos, logging con redacción, scaffolding de colas y observabilidad.

Antes de producción requiere: persistencia real, health deep, métricas reales, seguridad homogénea, tests de integración y contratos de datos/colas.
