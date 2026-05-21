# Remediation Roadmap — Backend-template

**Creado:** 2026-05-21
**Basado en:** Research Paper 1 — Production-readiness gaps
**Estado:** Planificación

---

## Visión

Transformar `backend-template` de scaffold demostrativo a base production-ready en 4 fases incrementales, cada una entregando valor operacional medible.

---

## Fase 1: Cimientos de datos (Semanas 1-3)

> **Objetivo:** Eliminar pérdida de datos. Todos los servicios con persistencia real.

### T1.1 — Migrar users-service a Prisma/DB
- **Gap:** G1 (Crítica)
- **Tarea:**
  - Añadir modelo `UserService` al schema Prisma o crear schema separado
  - Reemplazar `Map<string, User>` por queries Prisma
  - Añadir migración inicial
  - Tests de integración: create → read → update → delete
- **Archivos:** `microservices/users-service/src/services/users.service.ts`
- **Criterio de éxito:** Datos persisten tras reinicio del servicio

### T1.2 — Migrar notifications-service a Prisma/DB
- **Gap:** G1 (Crítica)
- **Tarea:**
  - Modelo `Notification` con userId, type, message, status, timestamps
  - Reemplazar `Map` por Prisma
  - Tests de integración
- **Archivos:** `microservices/notifications-service/src/services/notifications.service.ts`

### T1.3 — Migrar payment-service a Prisma/DB (core)
- **Gap:** G1 (Crítica)
- **Tarea:**
  - Modelos: `Payment`, `Invoice`, `Receipt`, `PaymentLedger`
  - Constraints: idempotency key, userId FK, status enum, unique invoice numbers
  - Reemplazar `Map` por Prisma en los 3 servicios
  - Transacciones para payment + ledger entry
- **Archivos:** `microservices/payment-service/src/services/*.service.ts`
- **Criterio de éxito:** Pagos persisten con estado auditable

### T1.4 — Índices compuestos en Prisma
- **Gap:** G7 (Media-Alta)
- **Tarea:**
  - Añadir `@@index([type, timestamp(sort: Desc)])` en `AnalyticsEvent`
  - Añadir `@@index([service, timestamp(sort: Desc)])`
  - Añadir `@@index([severity, createdAt(sort: Desc)])` en `ActivityLog`
  - Añadir `@@index([userId, createdAt(sort: Desc)])`
- **Archivos:** `main/src/prisma/schema.prisma`

### T1.5 — Health checks deep
- **Gap:** G3 (Alta)
- **Tarea:**
  - Monolito: añadir `TerminusModule` con `HttpHealthIndicator`, `PrismaHealthIndicator`, `RedisHealthIndicator`
  - Microservicios: endpoint `/health` con DB ping + Redis ping
  - Estados: `healthy`, `degraded`, `unhealthy` con detalles
- **Archivos:** `main/src/modules/health/health.controller.ts`, `microservices/*/src/index.ts`
- **Criterio de éxito:** Health falla si DB o Redis están caídos

---

## Fase 2: Pagos reales y seguridad (Semanas 4-6)

> **Objetivo:** Pagos deterministas y auditables. Seguridad homogénea.

### T2.1 — Payment adapter pattern
- **Gap:** G2 (Crítica)
- **Tarea:**
  - Crear interfaz `PaymentProvider`: `charge()`, `refund()`, `getStatus()`, `verifyWebhook()`
  - Implementar `MockPaymentProvider` (determinista, configurable)
  - Implementar `StripePaymentProvider` (stub con env var)
  - Factory basada en `PAYMENT_PROVIDER` env var
  - Eliminar `Math.random()` del path de pagos
- **Archivos:** `microservices/payment-service/src/providers/`
- **Criterio de éxito:** Pagos siempre deterministas en sandbox

### T2.2 — Idempotencia y ledger
- **Gap:** G2 (Crítica)
- **Tarea:**
  - Campo `idempotencyKey` único en `Payment`
  - Middleware que rechaza requests duplicados por key
  - `PaymentLedger` append-only: cada transacción genera entry inmutable
  - Endpoint de reconciliación: compara ledger vs estado actual
- **Archivos:** `microservices/payment-service/src/middlewares/idempotency.middleware.ts`

### T2.3 — Seguridad homogénea
- **Gap:** G9 (Alta)
- **Tarea:**
  - Extraer `createServiceApp()` factory con helmet, cors, rateLimit, compression
  - Proteger `/metrics` con IP allowlist o API key interna
  - Validar que todos los servicios usan la factory
  - Frontend: migrar tokens de `localStorage` a cookies httpOnly
- **Archivos:** `microservices/*/src/index.ts`, `frontend/src/services/api.ts`

### T2.4 — RBAC para admin endpoints
- **Gap:** G13 (Alta)
- **Tarea:**
  - Roles: `ADMIN`, `FINANCE_ADMIN`, `SUPPORT`
  - Guard `@Roles('FINANCE_ADMIN')` en force-complete/refund/revenue/audit
  - Audit log append-only para cada acción admin financiera
  - Maker/checker: acciones >$X requieren 2 approvals
- **Archivos:** `microservices/payment-service/src/controllers/admin.controller.ts`

### T2.5 — Graceful shutdown común
- **Gap:** G14 (Media)
- **Tarea:**
  - Patrón: pause HTTP listener → drain active requests → pause queues → close DB/Redis → exit
  - Aplicar a todos los microservicios
  - Timeout configurable (default 30s)
- **Archivos:** `microservices/*/src/index.ts`

---

## Fase 3: Observabilidad real y performance (Semanas 7-9)

> **Objetivo:** Métricas que miden tráfico real. Dashboards que no mienten.

### T3.1 — Instrumentación HTTP real
- **Gap:** G4 (Alta)
- **Tarea:**
  - Middleware `prometheusMiddleware` en todos los servicios:
    - `http_requests_total{method, route, status}`
    - `http_request_duration_seconds{method, route}` histogram
    - `http_request_size_bytes`, `http_response_size_bytes`
  - Default metrics: `process_cpu_seconds`, `process_resident_memory_bytes`, `nodejs_eventloop_lag_seconds`
  - Validar que métricas coinciden con alert rules
- **Archivos:** `microservices/*/src/middlewares/metrics.middleware.ts`

### T3.2 — Analytics con cache y pre-agregación
- **Gap:** G6 (Alta), G5 (Alta)
- **Tarea:**
  - Cache Redis con TTL 60s para `getOverview()`, `getUsage()`, `getPerformance()`
  - Job nocturno que genera rollups por hora/día en tabla `AnalyticsRollup`
  - Queries de dashboard leen de rollups, no de eventos crudos
  - Percentiles aproximados vía HyperLogLog o t-digest
- **Archivos:** `main/src/analytics/analytics.service.ts`

### T3.3 — Queue wiring verificado
- **Gap:** G8 (Alta)
- **Tarea:**
  - Centralizar `QueueConfig`: nombres de queues, job types, retry policies
  - Wiring explícito: cada queue tiene su Worker registrado en el módulo
  - Test de integración: enqueue → process → verify side-effect en DB
  - Dashboard de queue: waiting/active/completed/failed counts
- **Archivos:** `main/src/queue/queue.module.ts`, `main/src/analytics/analytics.module.ts`

### T3.4 — Async exports
- **Gap:** G13 (Alta), G11 (Media)
- **Tarea:**
  - Reemplazar exports síncronos por jobs BullMQ
  - Job genera archivo → sube a storage → notifica al usuario
  - Endpoint `GET /exports/:id/status` para verificar progreso
  - Límite máximo: 100K registros por export
  - Usar `fs.promises` en lugar de `fs.*Sync`
- **Archivos:** `main/src/reports/reports.service.ts`, `main/src/activity-log/activity-log.service.ts`

### T3.5 — Ops dashboard real
- **Gap:** G4 (Alta), G10 (Media)
- **Targa:**
  - Reemplazar placeholders con datos reales de:
    - `process.memoryUsage()`, `process.cpuUsage()`
    - Queue depth de BullMQ
    - DB connection pool status
    - Redis memory usage
  - Endpoint `/ops/status` retorna datos reales, no ceros
- **Archivos:** `main/src/modules/ops/ops.controller.ts`

---

## Fase 4: Testing y documentación (Semanas 10-12)

> **Objetivo:** Confianza en cambios. Documentación honesta.

### T4.1 — Battery de tests por servicio
- **Gap:** G15 (Alta)
- **Tarea:**
  - Unit tests: services, validators, utils
  - Integration tests: DB queries, queue processing, auth flows
  - Contract tests: API response schemas entre servicios
  - Smoke tests: health deep, metrics endpoint, Swagger spec
  - CI: ejecutar en cada PR
- **Target:** 70%+ coverage en servicios críticos

### T4.2 — Readiness matrix
- **Gap:** G10 (Media)
- **Tarea:**
  - Documento `docs/READINESS.md` con tabla:
    | Feature | Estado | Notas |
    |---------|--------|-------|
    | Auth | ✅ Production | JWT + refresh + bcrypt |
    | Users | ✅ Production | Prisma + migrations |
    | Payments | ⚠️ Sandbox | Mock provider, needs real integration |
    | Analytics | ✅ Production | Cached + rollups |
  - Actualizar README para reflejar estado real
  - Eliminar claims no implementados

### T4.3 — Docs de operación
- **Tarea:**
  - `docs/OPERATIONS.md`: deploy, rollback, scaling, monitoring
  - `docs/TROUBLESHOOTING.md`: common issues, diagnostics, escalation
  - `docs/ARCHITECTURE.md`: diagramas actualizados, data flow
  - Runbook de incidentes por servicio

### T4.4 — Consistencia tooling
- **Gap:** G10 (Media), G12 (Media)
- **Tarea:**
  - Unificar a npm workspaces (eliminar referencias a pnpm/turbo si no se usan)
  - O activar Turborepo si se prefiere
  - `createServiceApp()` factory para todos los microservicios
  - Lint/format consistente en todos los paquetes

---

## Priorización visual

```
Fase 1: Cimientos          ████████████████████  Semanas 1-3
  T1.1 Users DB            ████████
  T1.2 Notifications DB    ██████
  T1.3 Payments DB         ████████████
  T1.4 Índices             ████
  T1.5 Health deep         ██████

Fase 2: Pagos + Seguridad  ████████████████████  Semanas 4-6
  T2.1 Payment adapter     ████████
  T2.2 Idempotencia        ██████
  T2.3 Seguridad homogénea ████████
  T2.4 RBAC admin          ██████
  T2.5 Graceful shutdown   ████

Fase 3: Observabilidad     ████████████████████  Semanas 7-9
  T3.1 Métricas HTTP       ████████
  T3.2 Analytics cache     ████████
  T3.3 Queue wiring        ██████
  T3.4 Async exports       ██████
  T3.5 Ops dashboard real  ████

Fase 4: Testing + Docs     ████████████████████  Semanas 10-12
  T4.1 Test battery        ██████████
  T4.2 Readiness matrix    ████
  T4.3 Ops docs            ██████
  T4.4 Tooling consistency ████
```

---

## Métricas de éxito

| Métrica | Antes | Después (Fase 4) |
|---------|-------|-------------------|
| Datos persistentes | ❌ Map en memoria | ✅ Prisma en todos los servicios |
| Pagos deterministas | ❌ Math.random() | ✅ Adapter + idempotencia + ledger |
| Health checks | ❌ Superficial | ✅ Deep con probes |
| Métricas HTTP | ❌ Registry vacío | ✅ Count + duration + errors |
| Analytics latency | ❌ O(n) por request | ✅ Cache + rollups |
| Queue processing | ⚠️ Wiring ambiguo | ✅ Tests de integración |
| Test coverage | ❌ <10% | ✅ >70% servicios críticos |
| Docs honestas | ❌ Claims inflados | ✅ Readiness matrix |

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Migrar microservicios rompe frontend | Media | Alto | Mantener contratos API durante migración |
| Prisma en microservicios añade complejidad | Baja | Medio | Usar schema compartido o cliente compartido |
| Payment adapter real requiere cuenta externa | Alta | Medio | Mock determinista primero, integración después |
| Cache analytics introduce stale data | Media | Bajo | TTL corto + invalidación por eventos |
| Testing battery retrasa delivery | Media | Medio | Empezar con smoke + critical path tests |
