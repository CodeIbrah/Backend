# Nombre

Incident Response Skill

# Objetivo

Gestionar el ciclo de vida completo de incidentes en el sistema backend-template, desde detección y clasificación hasta resolución, escalamiento, alerting y generación de reportes post-mortem, garantizando respuesta rápida y coordinada ante fallos del sistema.

# Responsabilidades

- **Ciclo de Vida de Incidentes**: Gestionar estados NEW → INVESTIGATING → ACK'D → MITIGATING → RESOLVED → POST-MORTEM con transiciones claras y timestamps.
- **Escalamiento**: Implementar políticas de escalamiento basadas en severidad y tiempo sin resolución (SLA), notificando al nivel apropiado según matriz de escalamiento.
- **Alerting**: Enviar alertas a canales configurados (Slack, email, PagerDuty) según severidad del incidente y preferencias de notificación.
- **Agrupación de Incidentes**: Detectar y agrupar incidentes relacionados para evitar duplicación de alertas y fatiga de on-call.
- **Generación de Timeline**: Construir timelines detallados de incidentes correlacionando eventos de logs, métricas, traces y acciones tomadas.
- **Coordinación de Respuesta**: Coordinar acciones entre agentes (Error Analysis, Fix Suggestion, Runtime Monitoring, Auto-Recovery) para resolución eficiente.
- **Historial de Incidentes**: Mantener historial completo de incidentes para análisis de tendencias, MTTR/MTBF y mejora continua.
- **Reportes Post-Mortem**: Generar reportes post-mortem con causa raíz, lecciones aprendidas y acciones preventivas.

# Inputs

- Alertas de Runtime Monitoring Agent (anomalías, threshold breaches)
- Errores clasificados de Error Analysis Skill (CRITICAL, HIGH)
- Diagnósticos de Diagnostics Skill (anomalías, degradaciones)
- Health checks de servicios Docker (fallos de health check)
- Alertas de Prometheus Alertmanager
- Alertas externas (Sentry, usuarios reportando)
- Métricas de sistema en tiempo real
- Logs de eventos del sistema

# Outputs

- Incidentes creados con ID único, severidad, estado y timeline
- Alertas enviadas a canales configurados
- Escalamientos ejecutados según política
- Incidentes agrupados y deduplicados
- Timelines de incidentes con eventos correlacionados
- Resúmenes ejecutivos y técnicos de incidentes
- Reportes post-mortem con lecciones aprendidas
- Actualizaciones a Knowledge Base (tabla Incidents)
- Métricas de incidentes (MTTR, MTBF, incident count por severidad)

# Herramientas usadas

- **shared-logger** (packages/shared-logger): Logging de actividades de incidentes
- **shared-reports** (packages/shared-reports): Generación de reportes de incidentes
- **shared-telemetry** (packages/shared-telemetry): Métricas para contexto de incidentes
- **Prisma** (main/src/prisma): ORM para persistencia de incidentes en Knowledge Base
- **PostgreSQL** (puerto 5432): Almacenamiento de incidentes y timelines
- **Prometheus Alertmanager**: Alertas de métricas
- **Slack API**: Notificaciones a canales de Slack
- **Email (SMTP)**: Notificaciones por email
- **PagerDuty API**: Escalamiento a on-call (configurable)
- **Docker**: Health checks y estado de contenedores
- **Reporting Skill**: Generación de reportes post-mortem

# Workflows

## Workflow 1: Ciclo de Vida de Incidente

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Detección  │───▶│  Creación   │───▶│  Investigación│───▶│  Mitigación  │───▶│  Resolución │
│  de Evento  │    │  de         │    │  y Análisis  │    │  y Fix       │    │  y Cierre   │
│  Anómalo    │    │  Incidente  │    │              │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Alerta de         Crear registro en     Analizar causa raíz,   Aplicar fix,       Verificar salud,
  monitoreo,        KB, asignar           correlar eventos,      escalar si es      actualizar estado,
  error CRITICAL    severidad, alertar    solicitar fix          necesario,         generar reporte
                    on-call               sugerido               monitorear         post-mortem
```

### Estados del Incidente:

| Estado | Descripción | Acciones |
|--------|-------------|----------|
| NEW | Incidente detectado, sin asignar | Auto-crear, clasificar, alertar |
| INVESTIGATING | En análisis de causa raíz | Correlar eventos, diagnosticar |
| ACK'D | Reconocido por on-call | Asignar owner, estimar resolución |
| MITIGATING | Fix en progreso | Aplicar fix, monitorear impacto |
| RESOLVED | Servicio restaurado | Verificar, documentar, cerrar |
| POST-MORTEM | Análisis post-incidente | Generar reporte, acciones preventivas |

## Workflow 2: Escalamiento

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Incidente  │───▶│  Verificar  │───▶│  Escalar a   │───▶│  Notificar   │
│  Creado     │    │  SLA y      │    │  Nivel       │    │  al Nuevo    │
│             │    │  Timeout    │    │  Superior    │    │  Nivel       │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Matriz de Escalamiento:

| Severidad | Respuesta Inicial | Escalamiento N1 | Escalamiento N2 | Escalamiento N3 |
|-----------|-------------------|-----------------|-----------------|-----------------|
| CRITICAL | Inmediato | 5 min | 15 min | 30 min |
| HIGH | 5 min | 15 min | 30 min | 1 hr |
| MEDIUM | 15 min | 1 hr | 4 hr | 8 hr |
| LOW | 1 hr | 4 hr | 8 hr | 24 hr |

### Niveles de Escalamiento:

| Nivel | Rol | Canal |
|-------|-----|-------|
| N0 | Auto-recovery | Sistema automático |
| N1 | On-call Engineer | Slack + Email |
| N2 | Senior Engineer | Slack + Email + Phone |
| N3 | Engineering Manager | Slack + Email + Phone + PagerDuty |

## Workflow 3: Agrupación de Incidentes

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Nuevo      │───▶│  Buscar     │───▶│  Calcular    │───▶│  Agrupar o  │
│  Evento     │    │  Incidentes │    │  Similitud   │    │  Crear Nuevo│
│  Anómalo    │    │  Activos    │    │  con Activos │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Criterios de Agrupación:

- **Mismo servicio**: Eventos del mismo servicio en ventana de 5 minutos
- **Misma causa raíz**: Mismo patrón de error identificado
- **Mismo correlationId**: Eventos relacionados a misma solicitud
- **Mismo traceId**: Eventos dentro del mismo trace distribuido
- **Cascada de servicio**: Eventos en servicios downstream de un fallo origen

# Casos de uso

## Caso 1: Incidente CRITICAL - Database Pool Exhaustion

**Escenario**: PostgreSQL connection pool agotado, múltiples servicios afectados.

**Flujo**:
1. **Detección** (10:15:32): Runtime Monitoring detecta pool al 100%, envía alerta CRITICAL
2. **Creación** (10:15:35): Incidente INC-20260521-001 creado automáticamente
   - Severidad: CRITICAL
   - Servicios afectados: users-service, main, notifications-service
   - Alerta enviada a Slack #incidents y on-call engineer
3. **Investigación** (10:15:35 - 10:18:00):
   - Error Analysis Agent identifica patrón: DatabaseConnectionTimeout
   - Causa raíz: conexiones no liberadas en error paths
   - Timeline construido con eventos correlacionados
4. **Mitigación** (10:18:00 - 10:22:00):
   - Fix Suggestion Agent genera patch
   - On-call engineer aplica fix
   - Monitoreo de impacto en tiempo real
5. **Resolución** (10:22:00 - 10:47:00):
   - Error rate declining
   - Pool usage normalizing
   - Todos los servicios recuperados
6. **Post-Mortem** (10:47:00+):
   - Reporte generado con timeline completo
   - Lecciones aprendidas documentadas
   - Acciones preventivas asignadas

**Output** (incidente):
```json
{
  "incidentId": "INC-20260521-001",
  "title": "Database Connection Pool Exhaustion",
  "status": "RESOLVED",
  "severity": "CRITICAL",
  "createdAt": "2026-05-21T10:15:35.000Z",
  "resolvedAt": "2026-05-21T10:47:00.000Z",
  "duration": "31m 25s",
  "timeline": [
    { "time": "10:14:00", "event": "Connection pool usage exceeds 80%", "source": "prometheus" },
    { "time": "10:14:30", "event": "Slow query detected (5.2s)", "source": "prisma" },
    { "time": "10:15:00", "event": "Connection pool at 100%", "source": "prometheus" },
    { "time": "10:15:32", "event": "First connection timeout error", "source": "winston" },
    { "time": "10:15:35", "event": "Incident auto-created", "source": "incident-response" },
    { "time": "10:15:35", "event": "Alert sent to #incidents and on-call", "source": "incident-response" },
    { "time": "10:18:00", "event": "Root cause identified: unclosed connections", "source": "error-analysis" },
    { "time": "10:18:00", "event": "Fix suggested: add finally blocks", "source": "fix-suggestion" },
    { "time": "10:22:00", "event": "Fix deployed (commit abc123def)", "source": "on-call" },
    { "time": "10:30:00", "event": "Error rate declining", "source": "prometheus" },
    { "time": "10:47:00", "event": "All services recovered", "source": "health-checks" },
    { "time": "10:47:00", "event": "Incident marked as RESOLVED", "source": "incident-response" }
  ],
  "affectedServices": ["users-service", "main", "notifications-service"],
  "errorCount": 247,
  "failedRequests": 1247,
  "errorRatePeak": "89%",
  "rootCause": "Unclosed database connections in error paths within users-service",
  "resolution": "Applied fix to ensure connection release in finally blocks",
  "alertsSent": ["slack-incidents", "email-oncall"],
  "escalations": [],
  "relatedErrors": ["err-20260521-001", "err-20260521-002", "err-20260521-003"],
  "mttr": "31m 25s",
  "postMortem": "reports/incidents/INC-20260521-001.md"
}
```

## Caso 2: Agrupación de Incidentes Relacionados

**Escenario**: 50 errores de timeout en 5 minutos en 3 servicios.

**Flujo**:
1. Primer error crea incidente INC-20260521-002
2. Errores 2-50: mismos patrón y correlationId
3. Se agrupan bajo INC-20260521-002, no se crean nuevos incidentes
4. Contador de errores incrementa en incidente existente
5. Severidad escalada automáticamente al superar umbral

## Caso 3: Escalamiento por Timeout

**Escenario**: Incidente HIGH sin respuesta en 15 minutos.

**Flujo**:
1. Incidente creado a las 14:00, severidad HIGH
2. Alerta enviada a on-call engineer (N1)
3. A las 14:15, sin ack → escalamiento a Senior Engineer (N2)
4. A las 14:30, sin ack → escalamiento a Engineering Manager (N3)
5. Cada escalamiento incluye contexto completo del incidente

# Alertas

- **CRITICAL**: Incidente CRITICAL creado → Alerta inmediata a todos los canales
- **HIGH**: Incidente HIGH creado → Alerta a Slack + on-call engineer
- **HIGH**: Escalamiento ejecutado → Alerta al nuevo nivel
- **MEDIUM**: Incidente MEDIUM creado → Alerta a Slack
- **MEDIUM**: Incidente sin resolver supera SLA → Alerta de escalamiento
- **LOW**: Incidente agrupado con existente → Logging
- **INFO**: Incidente resuelto → Notificación de resolución

# Integraciones

- **Error Analysis Skill**: Recibe errores clasificados para creación de incidentes
- **Fix Suggestion Agent**: Recibe fixes sugeridos para mitigación
- **Runtime Monitoring Agent**: Recibe alertas de monitoreo para detección
- **Auto-Recovery Skill**: Trigger auto-recovery para incidentes recuperables
- **Reporting Skill**: Generación de reportes post-mortem
- **Diagnostics Skill**: Diagnósticos para investigación de incidentes
- **Observability Skill**: Datos de observabilidad para timelines
- **Tracing Skill**: Traces para análisis de causa raíz
- **Prisma**: Persistencia de incidentes en Knowledge Base
- **Slack/Email/PagerDuty**: Canales de alerting
- **Prometheus Alertmanager**: Fuente de alertas de métricas
- **Docker**: Health checks para detección de servicios down

# Ejemplos

## Ejemplo 1: Creación Automática de Incidente

```typescript
// main/src/reports/incident-response.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncidentResponseService {
  async createIncident(data: CreateIncidentDto) {
    const incident = await this.prisma.incident.create({
      data: {
        incidentId: this.generateIncidentId(),
        title: data.title,
        severity: data.severity,
        status: 'NEW',
        affectedServices: data.affectedServices,
        timeline: [{
          time: new Date().toISOString(),
          event: 'Incident auto-created',
          source: 'incident-response',
        }],
        alertsSent: this.getAlertChannels(data.severity),
      },
    });

    await this.sendAlerts(incident);
    return incident;
  }

  private generateIncidentId(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const seq = String(this.getNextSequence()).padStart(3, '0');
    return `INC-${date}-${seq}`;
  }

  private getAlertChannels(severity: string): string[] {
    const channels = {
      CRITICAL: ['slack-incidents', 'email-oncall', 'pagerduty-critical'],
      HIGH: ['slack-incidents', 'email-oncall'],
      MEDIUM: ['slack-incidents'],
      LOW: [],
    };
    return channels[severity] || [];
  }
}
```

## Ejemplo 2: Timeline de Incidente

```json
{
  "incidentId": "INC-20260521-003",
  "timeline": [
    {
      "time": "2026-05-21T14:00:00.000Z",
      "event": "High error rate detected on auth-service (12%)",
      "source": "prometheus",
      "details": { "metric": "error_rate", "value": "12%", "threshold": "5%" }
    },
    {
      "time": "2026-05-21T14:00:05.000Z",
      "event": "Incident auto-created",
      "source": "incident-response",
      "details": { "severity": "HIGH", "status": "NEW" }
    },
    {
      "time": "2026-05-21T14:00:05.000Z",
      "event": "Alert sent to #incidents and on-call engineer",
      "source": "incident-response",
      "details": { "channels": ["slack-incidents", "email-oncall"] }
    },
    {
      "time": "2026-05-21T14:03:00.000Z",
      "event": "On-call engineer acknowledged",
      "source": "slack",
      "details": { "user": "@engineer-oncall", "status": "ACK'D" }
    },
    {
      "time": "2026-05-21T14:05:00.000Z",
      "event": "Root cause identified: Redis connection failure",
      "source": "error-analysis",
      "details": { "pattern": "RedisConnectionFailure", "confidence": 0.92 }
    },
    {
      "time": "2026-05-21T14:10:00.000Z",
      "event": "Redis container restarted",
      "source": "auto-recovery",
      "details": { "action": "docker_restart", "target": "redis" }
    },
    {
      "time": "2026-05-21T14:12:00.000Z",
      "event": "Error rate returning to normal",
      "source": "prometheus",
      "details": { "metric": "error_rate", "value": "0.5%" }
    },
    {
      "time": "2026-05-21T14:15:00.000Z",
      "event": "Incident marked as RESOLVED",
      "source": "incident-response",
      "details": { "status": "RESOLVED", "mttr": "15m" }
    }
  ]
}
```

## Ejemplo 3: Métricas de Incidentes

```json
{
  "period": "2026-05",
  "totalIncidents": 47,
  "bySeverity": {
    "CRITICAL": 2,
    "HIGH": 8,
    "MEDIUM": 22,
    "LOW": 15
  },
  "mttr": {
    "average": "18m 32s",
    "p50": "12m 15s",
    "p95": "45m 00s",
    "worst": "2h 15m"
  },
  "mtbf": {
    "average": "14h 22m",
    "trend": "improving"
  },
  "topCauses": [
    { "cause": "DatabaseConnectionTimeout", "count": 12, "avgMttr": "25m" },
    { "cause": "RedisConnectionFailure", "count": 8, "avgMttr": "10m" },
    { "cause": "MemoryLeak", "count": 5, "avgMttr": "35m" },
    { "cause": "QueueCongestion", "count": 4, "avgMttr": "15m" }
  ],
  "slaCompliance": {
    "CRITICAL": "100%",
    "HIGH": "87.5%",
    "MEDIUM": "95.5%",
    "LOW": "100%"
  }
}
```
