# Nombre

Analytics Skill

# Objetivo

Implementar y gestionar analíticas de usuario, eventos, rendimiento y errores en el sistema backend-template para proporcionar insights accionables sobre comportamiento de usuarios, patrones de uso, rendimiento de endpoints y tendencias de errores.

# Responsabilidades

- **Analíticas de Usuario**: Tracking de usuarios activos (DAU, WAU, MAU), sesiones, retención, cohortes y patrones de navegación a través de los servicios auth-service, users-service y main.
- **Event Tracking**: Captura y procesamiento de eventos de negocio (login, registro, creación de recursos, notificaciones enviadas) con contexto completo y correlationId.
- **Analíticas de Rendimiento**: Tracking de latencia por endpoint, throughput, error rates y percentiles para identificar tendencias de rendimiento y degradaciones.
- **Analíticas de Errores**: Agregación y análisis de errores por tipo, servicio, endpoint y período para identificar patrones y priorizar fixes.
- **Dashboards Analíticos**: Crear y mantener dashboards con KPIs de negocio, métricas de uso y tendencias de rendimiento en Grafana.
- **Reportes Periódicos**: Generar reportes diarios, semanales y mensuales con resúmenes analíticos y tendencias.
- **Detección de Anomalías**: Identificar anomalías en patrones de uso, picos de tráfico inusuales y cambios significativos en métricas de negocio.
- **Data Pipeline**: Procesar eventos analíticos desde captura hasta almacenamiento y visualización con latencia mínima.

# Inputs

- Eventos de aplicación desde servicios NestJS (login, registro, CRUD operations)
- Métricas de rendimiento desde Prometheus (latencia, throughput, error rate)
- Datos de errores desde Error Analysis Skill
- Logs de usuario desde shared-logger
- Datos de sesión desde auth-service (tokens, refresh, logout)
- Eventos de notificaciones desde notifications-service
- Datos de colas BullMQ (jobs procesados, fallidos, tiempo de procesamiento)
- Métricas de base de datos (queries por tipo, tablas más accedidas)

# Outputs

- Métricas de usuario: DAU, WAU, MAU, retención, cohortes
- Reportes de eventos: volumen por tipo, distribución temporal, patrones
- Reportes de rendimiento: tendencias de latencia, throughput, error rate
- Reportes de errores: top errores, tendencias, resolución rate
- Dashboards analíticos en Grafana
- Alertas de anomalías en patrones de uso
- Datos para reportes automáticos (daily, weekly, monthly)

# Herramientas usadas

- **shared-analytics** (packages/shared-analytics): Paquete central de analíticas
- **shared-logger** (packages/shared-logger): Logging estructurado para eventos
- **shared-telemetry** (packages/shared-telemetry): Métricas de rendimiento
- **Prometheus** (puerto 9090): Almacenamiento de métricas time-series
- **Grafana** (puerto 3000): Dashboards y visualización
- **PostgreSQL** (puerto 5432): Almacenamiento de eventos analíticos vía Prisma
- **Redis** (puerto 6379): Caché de métricas en tiempo real y counters
- **BullMQ**: Procesamiento async de eventos analíticos
- **Loki** (puerto 3100): Consulta de logs para análisis de eventos

# Workflows

## Workflow 1: Event Tracking Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Evento     │───▶│  Capturar   │───▶│  Enriquecer  │───▶│  Procesar    │───▶│  Almacenar  │
│  Generado   │    │  y Validar  │    │  con Contexto│    │  y Agregar   │    │  y Visualizar│
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Acción de usuario    Validar schema,    Agregar userId,      Calcular métricas    PostgreSQL, Redis,
  en servicio NestJS   deduplicar,        correlationId,       agregadas, detectar  Grafana dashboards
                       timestamp          service, endpoint    anomalías
```

### Pasos detallados:

1. **Capturar**: Servicio emite evento vía shared-analytics (ej: UserLoginEvent)
2. **Validar**: Validar contra schema de evento, deduplicar por eventId
3. **Enriquecer**: Agregar userId, correlationId, service name, endpoint, timestamp, IP geolocalizada
4. **Procesar**: Actualizar counters en Redis (DAU, eventos por hora), calcular agregaciones
5. **Almacenar**: Persistir evento en PostgreSQL vía Prisma, actualizar dashboards en Grafana

## Workflow 2: Análisis de Cohortes

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Definir    │───▶│  Agrupar    │───▶│  Calcular    │───▶│  Visualizar │
│  Cohorte    │    │  Usuarios   │    │  Retención   │    │  Resultados │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Pasos detallados:

1. **Definir**: Cohorte por semana de registro (ej: usuarios registrados semana 20)
2. **Agrupar**: Identificar usuarios por fecha de primer login
3. **Calcular**: Para cada semana siguiente, calcular % de usuarios activos
4. **Visualizar**: Tabla de retención en dashboard Grafana

## Workflow 3: Detección de Anomalías

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Monitorear │───▶│  Comparar   │───▶│  Calcular    │───▶│  Evaluar     │───▶│  Alertar    │
│  Métricas   │    │  vs Baseline│    │  Desviación  │    │  Significancia│   │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Anomalías detectables:

- **Traffic Spike**: Requests >3x baseline en ventana de 5 minutos
- **Traffic Drop**: Requests <30% baseline en ventana de 15 minutos
- **Error Spike**: Error rate >5x baseline
- **User Behavior Change**: Patrón de navegación significativamente diferente
- **Geographic Anomaly**: Requests desde regiones no habituales

# Casos de uso

## Caso 1: Análisis de Retención de Usuarios

**Escenario**: Evaluar retención de usuarios registrados en últimas 8 semanas.

**Flujo**:
1. Definir cohortes por semana de registro
2. Para cada cohorte, calcular % de usuarios activos en semanas siguientes
3. Identificar cohortes con retención anómala
4. Correlacionar con cambios en producto o incidentes

**Output**:
```json
{
  "reportType": "cohort-retention",
  "period": "8 weeks",
  "generatedAt": "2026-05-21T10:00:00.000Z",
  "cohorts": [
    {
      "week": "2026-W17",
      "users": 1250,
      "retention": [100, 68, 52, 41, 35, 30, 27, 25]
    },
    {
      "week": "2026-W18",
      "users": 1380,
      "retention": [100, 72, 55, 44, 38, 33, 30]
    }
  ],
  "insights": [
    "W18 cohort shows 4% better Day-7 retention vs W17",
    "Correlates with new onboarding flow deployed on 2026-04-28"
  ]
}
```

## Caso 2: Análisis de Rendimiento de Endpoints

**Escenario**: Identificar endpoints con degradación de rendimiento en última semana.

**Flujo**:
1. Extraer latencia p50, p95, p99 por endpoint para última semana
2. Comparar con semana anterior
3. Identificar endpoints con degradación >20%
4. Generar reporte con top 10 endpoints degradados

## Caso 3: Detección de Anomalía de Tráfico

**Escenario**: Tráfico de auth-service cae 70% repentinamente.

**Flujo**:
1. Analytics detecta requests <30% de baseline
2. Correlaciona con métricas de infraestructura
3. Identifica: nginx health check failing, routing a auth-service interrumpido
4. Genera alerta CRITICAL con contexto completo

# Alertas

- **CRITICAL**: Tráfico cae >50% en 5 minutos → Posible outage
- **HIGH**: Error rate >10% en 10 minutos → Degradación significativa
- **HIGH**: DAU cae >20% vs mismo día semana anterior → Posible problema de acceso
- **MEDIUM**: Latencia p95 incrementa >50% vs baseline → Degradación de rendimiento
- **MEDIUM**: Evento de negocio cae >30% vs esperado → Posible problema de flujo
- **LOW**: Cambio en patrón de uso detectado → Registro para análisis
- **INFO**: Reporte periódico generado → Notificación

# Integraciones

- **shared-analytics** (packages/shared-analytics): Paquete central para event tracking
- **shared-logger** (packages/shared-logger): Logs estructurados como fuente de eventos
- **shared-telemetry** (packages/shared-telemetry): Métricas de rendimiento
- **shared-reports** (packages/shared-reports): Generación de reportes analíticos
- **Error Analysis Skill**: Datos de errores para analíticas de errores
- **Diagnostics Skill**: Métricas de diagnóstico para correlación
- **Observability Skill**: Métricas, logs y traces como fuentes de datos
- **Reporting Skill**: Datos para reportes automáticos
- **Prometheus**: Fuente de métricas de rendimiento
- **Grafana**: Dashboards para visualización
- **PostgreSQL/Prisma**: Almacenamiento de eventos analíticos
- **Redis**: Counters en tiempo real y caché de métricas
- **BullMQ**: Procesamiento async de eventos

# Ejemplos

## Ejemplo 1: Event Tracking en Código

```typescript
// main/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { AnalyticsEvent, TrackEventOptions } from '@backend/shared-analytics';

@Injectable()
export class AnalyticsService {
  async trackUserLogin(userId: string, options: TrackEventOptions) {
    const event: AnalyticsEvent = {
      type: 'user.login',
      userId,
      correlationId: options.correlationId,
      properties: {
        method: options.method, // 'email', 'google', 'github'
        ip: options.ip,
        userAgent: options.userAgent,
      },
      timestamp: new Date().toISOString(),
    };

    await this.eventEmitter.emit('analytics.event', event);
    await this.redis.incr(`dau:${new Date().toISOString().split('T')[0]}`);
  }
}
```

## Ejemplo 2: Dashboard de KPIs

**Panel: Daily Active Users**
```promql
# DAU actual
sum(dau_total)

# DAU vs ayer
sum(dau_total) - sum(dau_total offset 1d)

# DAU trend (7 días)
sum(dau_total) - sum(dau_total offset 7d)
sum(dau_total) / sum(dau_total offset 7d) * 100 - 100
```

**Panel: Top Endpoints by Traffic**
```promql
topk(10, sum by (endpoint) (rate(http_requests_total[5m])))
```

**Panel: Error Rate Trend**
```promql
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

## Ejemplo 3: Reporte Semanal de Analíticas

```json
{
  "reportType": "weekly-analytics",
  "period": "2026-W20",
  "generatedAt": "2026-05-21T00:00:00.000Z",
  "summary": {
    "dau": {
      "average": 4250,
      "peak": 5100,
      "low": 3200,
      "vsLastWeek": "+8%"
    },
    "requests": {
      "total": 2850000,
      "average": 407142,
      "vsLastWeek": "+12%"
    },
    "errors": {
      "total": 1425,
      "rate": "0.05%",
      "vsLastWeek": "-15%"
    },
    "latency": {
      "p50": "120ms",
      "p95": "450ms",
      "p99": "1.2s",
      "vsLastWeek": "stable"
    }
  },
  "topEndpoints": [
    { "endpoint": "GET /api/v1/users", "requests": 850000, "p95": "200ms" },
    { "endpoint": "POST /api/v1/auth/login", "requests": 420000, "p95": "350ms" },
    { "endpoint": "GET /api/v1/notifications", "requests": 380000, "p95": "180ms" }
  ],
  "topErrors": [
    { "error": "DatabaseConnectionTimeout", "count": 520, "trend": "decreasing" },
    { "error": "UnauthorizedError", "count": 340, "trend": "stable" },
    { "error": "ValidationError", "count": 210, "trend": "increasing" }
  ],
  "insights": [
    "DAU increased 8% week-over-week, driven by new user acquisition",
    "Error rate decreased 15% after connection pool fix deployed on Monday",
    "ValidationError trend increasing - review input validation rules"
  ]
}
```
