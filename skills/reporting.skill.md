# Nombre

Reporting Skill

# Objetivo

Generar reportes automáticos del sistema backend-template en formato markdown, incluyendo reportes de incidentes, resúmenes ejecutivos, reportes técnicos, reportes diarios/semanales/mensuales y análisis post-mortem, utilizando datos de observabilidad, analíticas y diagnósticos.

# Responsabilidades

- **Generación Automática de Reportes**: Producir reportes programados (daily, weekly, monthly) y on-demand basados en triggers de eventos o solicitudes manuales.
- **Reportes Markdown**: Generar reportes en formato markdown con tablas, gráficos ASCII, timelines y secciones estructuradas para fácil lectura y distribución.
- **Reportes de Incidentes**: Crear reportes detallados de incidentes con timeline, impacto, causa raíz, resolución y lecciones aprendidas.
- **Resúmenes Ejecutivos**: Producir resúmenes de alto nivel para stakeholders no técnicos con KPIs, tendencias y recomendaciones estratégicas.
- **Reportes Técnicos**: Generar reportes detallados para equipos de ingeniería con métricas, análisis de rendimiento, errores y recomendaciones de optimización.
- **Análisis Post-Mortem**: Crear reportes post-mortem después de incidentes críticos con análisis completo de causa raíz, timeline detallado y acciones preventivas.
- **Distribución de Reportes**: Enviar reportes a canales configurados (email, Slack, dashboard) y almacenar en directorio reports/ del proyecto.
- **Template Management**: Mantener templates de reportes reutilizables y personalizables según tipo y audiencia.

# Inputs

- Métricas de Prometheus (rendimiento, errores, throughput)
- Logs de Loki (eventos, errores, patrones)
- Traces de Jaeger (latencia, dependencias, errores)
- Datos de Error Analysis Skill (errores clasificados, patrones)
- Datos de Diagnostics Skill (diagnósticos de salud, anomalías)
- Datos de Analytics Skill (KPIs de negocio, tendencias de usuario)
- Datos de Incident Response Skill (incidentes, timelines, resoluciones)
- Datos de base de datos vía Prisma (eventos analíticos, métricas históricas)

# Outputs

- Reportes en formato markdown en reports/ directory
- Reportes diarios: resumen de salud del sistema
- Reportes semanales: tendencias, KPIs, incidentes
- Reportes mensuales: análisis completo, métricas de SLA, recomendaciones
- Reportes de incidentes: timeline, causa raíz, resolución
- Resúmenes ejecutivos: KPIs de alto nivel, tendencias
- Reportes técnicos: análisis detallado de rendimiento y errores
- Análisis post-mortem: lecciones aprendidas, acciones preventivas

# Herramientas usadas

- **shared-reports** (packages/shared-reports): Paquete central de generación de reportes
- **shared-logger** (packages/shared-logger): Logging de generación de reportes
- **shared-analytics** (packages/shared-analytics): Datos de analíticas para reportes
- **shared-telemetry** (packages/shared-telemetry): Métricas de rendimiento
- **Prometheus API**: Consulta de métricas para reportes
- **Loki API**: Consulta de logs para reportes
- **Jaeger API**: Consulta de traces para reportes
- **Prisma**: Consulta de datos históricos y eventos
- **Grafana**: Export de dashboards como imágenes para reportes
- **Markdown**: Formato principal de salida de reportes
- **reports/ directory**: Almacenamiento local de reportes generados

# Workflows

## Workflow 1: Generación de Reporte Diario

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Trigger    │───▶│  Recopilar  │───▶│  Analizar    │───▶│  Generar     │───▶│  Distribuir │
│  Diario     │    │  Datos      │    │  y Agregar   │    │  Markdown    │    │  y Guardar  │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Cron job o        Métricas de últimas   Calcular KPIs,       Aplicar template    Guardar en reports/,
  comando manual    24h de Prometheus,    identificar          markdown, incluir   enviar a Slack,
                    Loki, Jaeger, DB      anomalías, tendencias tablas y gráficos  archivar
```

### Pasos detallados:

1. **Trigger**: Cron job a las 00:00 UTC o comando `pnpm report:daily`
2. **Recopilar**: Consultar Prometheus, Loki, Jaeger, PostgreSQL para datos de últimas 24h
3. **Analizar**: Calcular KPIs (uptime, error rate, latencia, throughput), identificar anomalías
4. **Generar**: Aplicar template markdown, incluir tablas, timelines, gráficos ASCII
5. **Distribuir**: Guardar en reports/daily/YYYY-MM-DD.md, enviar resumen a Slack

## Workflow 2: Reporte de Incidente

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Incidente  │───▶│  Recopilar  │───▶│  Construir   │───▶│  Generar     │───▶│  Distribuir │
│  Resuelto   │    │  Contexto   │    │  Timeline    │    │  Reporte     │    │  Post-Mortem│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Incidente Resuelto**: Incident Response Agent marca incidente como RESOLVED
2. **Recopilar**: Obtener todos los datos del incidente: logs, traces, métricas, acciones tomadas
3. **Construir Timeline**: Ordenar eventos cronológicamente desde detección hasta resolución
4. **Generar**: Crear reporte con secciones: resumen, impacto, timeline, causa raíz, resolución, lecciones
5. **Distribuir**: Guardar en reports/incidents/INC-YYYYMMDD-NNN.md, enviar a stakeholders

## Workflow 3: Resumen Ejecutivo

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Recopilar  │───▶│  Filtrar    │───▶│  Simplificar │───▶│  Generar    │
│  KPIs       │    │  para       │    │  Lenguaje    │    │  Resumen    │
│  Clave      │    │  Audiencia  │    │  No Técnico  │    │  Ejecutivo  │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Secciones de resumen ejecutivo:

1. **Estado General**: Score de salud del sistema (0-100)
2. **KPIs Principales**: Uptime, usuarios activos, requests procesados
3. **Incidentes**: Número y severidad de incidentes en período
4. **Tendencias**: Cambios significativos vs período anterior
5. **Recomendaciones**: Acciones estratégicas recomendadas

# Casos de uso

## Caso 1: Reporte Diario Automático

**Escenario**: Generar reporte diario de salud del sistema a las 00:00 UTC.

**Output esperado** (reports/daily/2026-05-21.md):
```markdown
# Daily Report - 2026-05-21

## System Health Score: 87/100 ✅

### Key Metrics
| Metric | Value | vs Yesterday | Status |
|--------|-------|-------------|--------|
| Uptime | 99.97% | +0.02% | ✅ |
| Avg Latency (p50) | 120ms | -5ms | ✅ |
| Error Rate | 0.03% | -0.01% | ✅ |
| Active Users | 4,250 | +8% | ✅ |
| Requests Processed | 285,000 | +12% | ✅ |

### Incidents
| ID | Severity | Duration | Status |
|----|----------|----------|--------|
| INC-20260521-001 | HIGH | 33min | Resolved |

### Top Errors
1. DatabaseConnectionTimeout (52 occurrences) - Decreasing trend
2. UnauthorizedError (34 occurrences) - Stable
3. ValidationError (21 occurrences) - Increasing trend ⚠️

### Recommendations
- Review input validation rules (ValidationError trend increasing)
- Monitor connection pool usage (52 timeouts today)
```

## Caso 2: Reporte de Incidente Post-Mortem

**Escenario**: Incidente de pool exhaustion de PostgreSQL requiere análisis post-mortem.

**Output esperado** (reports/incidents/INC-20260521-001.md):
```markdown
# Incident Report: INC-20260521-001

## Summary
Database connection pool exhaustion caused cascading failures across
users-service, main, and notifications-service from 10:14 to 10:47 UTC.

## Impact
- **Duration**: 33 minutes
- **Affected Services**: 3 (users-service, main, notifications-service)
- **Failed Requests**: 1,247
- **Error Rate Peak**: 89%
- **User Impact**: Users unable to access profiles and create orders

## Timeline
| Time (UTC) | Event |
|------------|-------|
| 10:14:00 | Connection pool usage exceeds 80% |
| 10:14:30 | Slow query detected (5.2s) |
| 10:15:00 | Connection pool at 100% |
| 10:15:32 | First connection timeout error |
| 10:15:35 | Incident auto-created |
| 10:18:00 | Root cause identified |
| 10:22:00 | Fix deployed (connection cleanup) |
| 10:30:00 | Error rate declining |
| 10:47:00 | All services recovered |

## Root Cause
Unclosed database connections in error paths within users-service
caused connection pool exhaustion. The `findOne` method did not
release connections when Prisma queries threw exceptions.

## Resolution
Applied fix: Ensure connection release in finally blocks
Commit: abc123def

## Lessons Learned
1. Add connection pool monitoring alerts at 70% threshold
2. Implement connection timeout with automatic cleanup
3. Add integration test for error path connection handling
4. Review all database operations for proper connection management

## Action Items
- [ ] Add pool usage alert at 70% (Owner: SRE, Due: 2026-05-23)
- [ ] Review all Prisma operations for connection leaks (Owner: Backend, Due: 2026-05-25)
- [ ] Add integration tests for error paths (Owner: QA, Due: 2026-05-28)
```

## Caso 3: Reporte Semanal de Rendimiento

**Escenario**: Generar reporte semanal de rendimiento para equipo de ingeniería.

**Flujo**:
1. Comando `pnpm report:weekly` o cron job semanal
2. Recopilar métricas de última semana
3. Comparar con semanas anteriores
4. Generar reporte con tendencias y recomendaciones

# Alertas

- **CRITICAL**: Reporte no se pudo generar (fallo en fuente de datos) → Alerta inmediata
- **HIGH**: Métricas de SLA por debajo de umbral en reporte → Destacar en reporte
- **MEDIUM**: Tendencia negativa detectada en métricas → Incluir en recomendaciones
- **LOW**: Reporte generado con datos incompletos → Nota en reporte
- **INFO**: Reporte generado exitosamente → Logging

# Integraciones

- **shared-reports** (packages/shared-reports): Paquete central de generación
- **shared-analytics** (packages/shared-analytics): Datos de analíticas
- **shared-telemetry** (packages/shared-telemetry): Métricas de rendimiento
- **shared-logger** (packages/shared-logger): Logging de generación
- **Error Analysis Skill**: Datos de errores para reportes
- **Diagnostics Skill**: Diagnósticos de salud para reportes
- **Analytics Skill**: KPIs de negocio para reportes
- **Incident Response Skill**: Datos de incidentes para reportes
- **Observability Skill**: Métricas, logs y traces como fuentes
- **Prometheus**: Fuente de métricas
- **Loki**: Fuente de logs
- **Jaeger**: Fuente de traces
- **Grafana**: Dashboards para incluir en reportes
- **Slack/Email**: Canales de distribución

# Ejemplos

## Ejemplo 1: Generación de Reporte vía Comando

```bash
# Reporte diario
pnpm report:daily

# Reporte semanal
pnpm report:weekly

# Reporte de incidente específico
pnpm report incident INC-20260521-001

# Reporte personalizado por período
pnpm report --from 2026-05-01 --to 2026-05-21 --type performance
```

## Ejemplo 2: Template de Reporte Técnico

```markdown
# Technical Report - {{type}} - {{period}}

## Executive Summary
{{summary}}

## System Overview
| Component | Status | Score | Trend |
|-----------|--------|-------|-------|
{{component_rows}}

## Performance Analysis
### Latency
| Endpoint | p50 | p95 | p99 | Trend |
|----------|-----|-----|-----|-------|
{{latency_rows}}

### Throughput
| Service | Req/s | Peak | Avg | Trend |
|---------|-------|------|-----|-------|
{{throughput_rows}}

## Error Analysis
### Error Distribution
| Error Type | Count | Rate | Trend |
|------------|-------|------|-------|
{{error_rows}}

### Top Error Patterns
{{error_patterns}}

## Database Analysis
### Query Performance
| Query | Avg Time | p95 | Count | Trend |
|-------|----------|-----|-------|-------|
{{query_rows}}

### Connection Pool
| Metric | Current | Peak | Threshold |
|--------|---------|------|-----------|
{{pool_rows}}

## Recommendations
{{recommendations}}

## Appendix
- Generated: {{timestamp}}
- Data sources: Prometheus, Loki, Jaeger, PostgreSQL
- Report version: {{version}}
```

## Ejemplo 3: Reporte Mensual de SLA

```markdown
# Monthly SLA Report - May 2026

## SLA Compliance: 99.95% ✅ (Target: 99.9%)

### Availability
| Service | Uptime | Downtime | Incidents | SLA Met |
|---------|--------|----------|-----------|---------|
| main | 99.98% | 13min | 1 | ✅ |
| auth-service | 99.99% | 4min | 0 | ✅ |
| users-service | 99.91% | 39min | 2 | ⚠️ |
| notifications-service | 99.97% | 16min | 1 | ✅ |

### Response Time SLA
| Endpoint | Target p95 | Actual p95 | Met |
|----------|-----------|------------|-----|
| GET /api/v1/users | 500ms | 200ms | ✅ |
| POST /api/v1/auth/login | 1000ms | 350ms | ✅ |
| GET /api/v1/notifications | 500ms | 180ms | ✅ |
| POST /api/v1/orders | 2000ms | 450ms | ✅ |

### Error Rate SLA
| Service | Target | Actual | Met |
|---------|--------|--------|-----|
| main | <0.1% | 0.03% | ✅ |
| auth-service | <0.1% | 0.02% | ✅ |
| users-service | <0.1% | 0.08% | ✅ |
| notifications-service | <0.5% | 0.12% | ✅ |
```
