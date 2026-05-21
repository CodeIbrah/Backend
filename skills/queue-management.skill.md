# Nombre

Queue Management Skill

# Objetivo

Gestionar y optimizar las colas de mensajes BullMQ en el sistema backend-template, incluyendo monitoreo de colas, estrategias de retry, dead letter queues, detección de congestión, recuperación de workers y optimización de procesamiento de jobs para garantizar entrega confiable y eficiente de mensajes.

# Responsabilidades

- **Monitoreo de Colas**: Monitorear estado de todas las colas BullMQ (notifications, emails, webhooks, analytics) con métricas de jobs waiting, active, completed, failed, delayed.
- **Estrategias de Retry**: Configurar y gestionar estrategias de retry con backoff exponencial, jitter, y límites de intentos para jobs fallidos.
- **Dead Letter Queues**: Gestionar dead letter queues para jobs que exceden el máximo de retries, con análisis de causa de fallo y opciones de reprocessing.
- **Detección de Congestión**: Detectar congestión de colas (backlog creciente, processing time alto, worker saturation) y trigger acciones de mitigación.
- **Recuperación de Workers**: Detectar workers caídos o bloqueados, ejecutar recuperación automática y verificar procesamiento resumed.
- **Optimización de Procesamiento**: Optimizar configuración de workers (concurrency, batch size, prefetch) para maximizar throughput y minimizar latencia.
- **Job Prioritization**: Implementar priorización de jobs para garantizar que jobs críticos se procesen antes que jobs de baja prioridad.
- **Flow Control**: Implementar rate limiting y flow control para prevenir sobrecarga de servicios downstream.

# Inputs

- Métricas de colas BullMQ (waiting, active, completed, failed, delayed jobs)
- Estado de workers (active, idle, stalled, removed)
- Logs de procesamiento de jobs (éxito, fallo, retry)
- Métricas de processing time por job type
- Configuración de colas (concurrency, attempts, backoff, delay)
- Métricas de Redis (cola backend, memoria, conexiones)
- Eventos de jobs (completed, failed, stalled, drained)
- Dead letter queue contents

# Outputs

- Estado de salud de colas con métricas en tiempo real
- Alertas de congestión de colas
- Reportes de jobs fallidos con análisis de causa
- Dead letter queue reports con opciones de reprocessing
- Recomendaciones de optimización de workers
- Planes de recuperación de workers
- Métricas de throughput y latency de colas

# Herramientas usadas

- **BullMQ**: Cola de jobs con Redis como backend
- **Redis** (puerto 6379): Backend de BullMQ, almacenamiento de jobs y estado
- **shared-logger** (packages/shared-logger): Logging de eventos de colas
- **shared-telemetry** (packages/shared-telemetry): Métricas de procesamiento de jobs
- **Prometheus** (puerto 9090): Métricas de colas exportadas
- **Grafana** (puerto 3000): Dashboards de colas
- **Prisma** (main/src/prisma): Persistencia de job results y dead letter entries
- **Auto-Recovery Skill**: Recovery actions para workers y colas

# Workflows

## Workflow 1: Monitoreo de Colas

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Consultar  │───▶│  Calcular   │───▶│  Detectar    │───▶│  Evaluar     │───▶│  Alertar si │
│  Estado de  │    │  Métricas   │    │  Anomalías   │    │  Severidad   │    │  Necesario  │
│  Colas      │    │  de Salud   │    │              │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  BullMQ Queue.getJobs   waiting, active,    backlog growing,    Congestion level,    Alerta a Runtime
  (waiting, active,      completed, failed,  processing slow,    worker saturation,   Monitoring, Incident
  completed, failed)     delayed counts      workers stalled     job failure rate     Response
```

### Métricas de Salud de Colas:

| Métrica | Healthy | Warning | Critical |
|---------|---------|---------|----------|
| Waiting jobs | <50 | 50-200 | >200 |
| Failed jobs rate | <1% | 1-5% | >5% |
| Processing time | <baseline*1.5 | baseline*1.5-3x | >baseline*3x |
| Worker utilization | 40-80% | 80-95% | >95% |
| Stalled jobs | 0 | 1-3 | >3 |

## Workflow 2: Estrategia de Retry

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Job        │───▶│  Verificar  │───▶│  Calcular    │───▶│  Re-enqueue  │───▶│  Mover a    │
│  Fallido    │    │  Intentos   │    │  Backoff     │    │  con Delay   │    │  DLQ si Max │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Configuración de Retry:

```typescript
{
  attempts: 5,                    // Máximo de intentos
  backoff: {
    type: 'exponential',          // Estrategia de backoff
    delay: 1000,                  // Delay inicial (1s)
    jitter: 'full'                // Jitter para evitar thundering herd
  },
  // Delays por intento:
  // Attempt 1: 1s ± jitter
  // Attempt 2: 2s ± jitter
  // Attempt 3: 4s ± jitter
  // Attempt 4: 8s ± jitter
  // Attempt 5: 16s ± jitter
  // Total max delay: ~31s
}
```

## Workflow 3: Dead Letter Queue Management

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Job        │───▶│  Analizar   │───▶│  Clasificar  │───▶│  Accionar    │───▶│  Limpiar    │
│  en DLQ     │    │  Causa de   │    │  por Tipo    │    │  (Reprocess, │    │  Jobs       │
│             │    │  Fallo      │    │  de Error    │    │   Fix, Drop) │    │  Procesados │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Acciones para DLQ Jobs:

| Causa de Fallo | Acción | Ejemplo |
|----------------|--------|---------|
| Error temporal (timeout, connection) | Reprocess | Retry con configuración ajustada |
| Error de datos (validation, missing) | Fix data + reprocess | Corregir datos, re-enqueue |
| Error de código (bug, exception) | Fix code + reprocess | Deploy fix, re-enqueue batch |
| Job obsoleto | Drop | Job para usuario eliminado |
| Error irreversible | Drop + alert | Notificación a servicio down |

# Casos de uso

## Caso 1: Congestión de Cola de Notificaciones

**Escenario**: Cola de notificaciones con 500 jobs waiting, processing time 3x normal.

**Flujo**:
1. Queue Management detecta waiting jobs > 200 (critical)
2. Analiza: 1 worker, processing 100 jobs/min, llegan 300 jobs/min
3. Identifica: worker bloqueado en llamada HTTP externa lenta (timeout 30s)
4. Acción inmediata: matar job bloqueado, aumentar workers a 4
5. Resultado: backlog cleared en 5 minutos, processing time normal

**Output**:
```json
{
  "queueId": "notifications",
  "issue": "QUEUE_CONGESTION",
  "severity": "CRITICAL",
  "timestamp": "2026-05-21T10:15:00.000Z",
  "metrics": {
    "waitingJobs": 500,
    "activeJobs": 1,
    "failedJobs": 12,
    "completedJobs": 2847,
    "processingTime": {
      "current": "450ms",
      "baseline": "150ms",
      "ratio": "3.0x"
    },
    "workerUtilization": "100%",
    "throughput": {
      "incoming": "300 jobs/min",
      "processing": "100 jobs/min",
      "net": "+200 jobs/min"
    }
  },
  "rootCause": "Single worker blocked on external HTTP call with 30s timeout",
  "actions": [
    { "type": "kill_stalled_job", "jobId": "job-abc123", "result": "success" },
    { "type": "scale_workers", "from": 1, "to": 4, "result": "success" },
    { "type": "add_timeout", "target": "external HTTP call", "value": "5s", "result": "pending" }
  ],
  "resolution": {
    "timeToClear": "5 minutes",
    "finalWaitingJobs": 0,
    "finalProcessingTime": "145ms"
  }
}
```

## Caso 2: Dead Letter Queue Analysis

**Escenario**: 50 jobs en dead letter queue de notifications.

**Flujo**:
1. Queue Management analiza DLQ contents
2. Clasifica por causa de fallo:
   - 30 jobs: timeout en servicio de email (temporal)
   - 15 jobs: usuario no encontrado (datos)
   - 5 jobs: error de código en template rendering (bug)
3. Acciones:
   - 30 jobs: reprocess con timeout aumentado
   - 15 jobs: drop (usuario eliminado)
   - 5 jobs: fix code + reprocess
4. Resultado: 35 jobs reprocessed exitosamente, 15 dropped

## Caso 3: Worker Recovery

**Escenario**: Worker de analytics queue se detiene inesperadamente.

**Flujo**:
1. Queue Management detecta worker no responde (stalled > 30s)
2. Verifica: proceso del worker murió, jobs activos sin procesar
3. Acción: reiniciar worker process
4. Verifica: worker healthy, jobs stalled re-enqueued
5. Monitorea: processing resumes, backlog clears

# Alertas

- **CRITICAL**: Cola con >200 jobs waiting y growing → Alerta inmediata
- **CRITICAL**: Todos los workers caídos → Alerta inmediata
- **HIGH**: Failed jobs rate >5% → Alerta de calidad
- **HIGH**: Processing time >3x baseline → Alerta de rendimiento
- **MEDIUM**: DLQ con >10 jobs → Alerta para análisis
- **MEDIUM**: Worker utilization >95% → Alerta de capacidad
- **LOW**: Stalled job detectado → Logging y recovery automático
- **INFO**: Cola procesada completamente (drained) → Logging

# Integraciones

- **BullMQ**: Cola principal de jobs
- **Redis**: Backend de BullMQ
- **Auto-Recovery Skill**: Recovery de workers y colas
- **Runtime Monitoring Agent**: Alertas de congestión
- **Incident Response Skill**: Incidentes de colas para gestión
- **Performance Skill**: Optimización de procesamiento
- **shared-logger**: Logging de eventos de colas
- **shared-telemetry**: Métricas de jobs
- **Prometheus**: Métricas de colas
- **Grafana**: Dashboards de colas
- **notifications-service**: Consumer principal de colas

# Ejemplos

## Ejemplo 1: Configuración de Cola BullMQ

```typescript
// main/src/queue/notifications.queue.ts
import { Queue, Worker, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const notificationsQueue = new Queue('notifications', { connection });

export const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    switch (job.name) {
      case 'send-email':
        return await sendEmail(job.data);
      case 'send-push':
        return await sendPushNotification(job.data);
      case 'send-sms':
        return await sendSMS(job.data);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 jobs in parallel
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // per minute
    },
  },
);

// Retry configuration
const jobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: { age: 3600, count: 1000 }, // Keep 1000 or 1 hour
  removeOnFail: { age: 86400 }, // Keep failed for 24 hours
};
```

## Ejemplo 2: Monitoreo de Colas

```typescript
// main/src/queue/queue-monitor.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { notificationsQueue } from './notifications.queue';

@Injectable()
export class QueueMonitorService implements OnModuleInit {
  async onModuleInit() {
    // Check queue health every 30 seconds
    setInterval(() => this.checkQueueHealth(), 30000);
  }

  async checkQueueHealth() {
    const counts = await notificationsQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );

    const health = {
      queue: 'notifications',
      timestamp: new Date().toISOString(),
      counts,
      health: this.evaluateHealth(counts),
    };

    if (health.health === 'critical') {
      logger.error('Queue health critical', health);
      // Trigger alert
    } else if (health.health === 'warning') {
      logger.warn('Queue health warning', health);
    }
  }

  private evaluateHealth(counts: any): string {
    if (counts.waiting > 200) return 'critical';
    if (counts.failed > counts.completed * 0.05) return 'critical';
    if (counts.waiting > 50) return 'warning';
    if (counts.failed > counts.completed * 0.01) return 'warning';
    return 'healthy';
  }
}
```

## Ejemplo 3: Dead Letter Queue Processing

```typescript
// main/src/queue/dlq-processor.service.ts
import { Injectable } from '@nestjs/common';
import { Queue, Job } from 'bullmq';

@Injectable()
export class DLQProcessorService {
  async processDLQ(queue: Queue) {
    const failedJobs = await queue.getJobs(['failed']);

    const analysis = {
      total: failedJobs.length,
      byCause: {} as Record<string, number>,
      actions: [] as Array<{ jobId: string; action: string }>,
    };

    for (const job of failedJobs) {
      const cause = this.classifyFailure(job);
      analysis.byCause[cause] = (analysis.byCause[cause] || 0) + 1;

      const action = this.determineAction(cause, job);
      analysis.actions.push({ jobId: job.id, action });

      switch (action) {
        case 'reprocess':
          await queue.add(job.name, job.data, { attempts: 3, backoff: { delay: 5000 } });
          await job.remove();
          break;
        case 'drop':
          await job.remove();
          break;
        case 'fix-and-reprocess':
          // Fix data, then reprocess
          const fixedData = await this.fixJobData(job.data);
          await queue.add(job.name, fixedData, { attempts: 3 });
          await job.remove();
          break;
      }
    }

    return analysis;
  }

  private classifyFailure(job: Job): string {
    const failedReason = job.failedReason?.toLowerCase() || '';
    if (failedReason.includes('timeout')) return 'timeout';
    if (failedReason.includes('not found')) return 'data-error';
    if (failedReason.includes('validation')) return 'validation-error';
    return 'unknown';
  }

  private determineAction(cause: string, job: Job): string {
    if (cause === 'timeout') return 'reprocess';
    if (cause === 'data-error') return 'drop';
    if (cause === 'validation-error') return 'fix-and-reprocess';
    return 'drop';
  }
}
```

## Ejemplo 4: Métricas de Colas en Prometheus

```promql
# Jobs waiting by queue
bullmq_jobs_waiting{queue="notifications"}

# Jobs failed by queue
bullmq_jobs_failed{queue="notifications"}

# Job processing duration
histogram_quantile(0.95, rate(bullmq_job_duration_seconds_bucket{queue="notifications"}[5m]))

# Worker utilization
bullmq_workers_active{queue="notifications"} / bullmq_workers_total{queue="notifications"} * 100

# Job completion rate
rate(bullmq_jobs_completed_total{queue="notifications"}[5m])

# Job failure rate
rate(bullmq_jobs_failed_total{queue="notifications"}[5m]) / rate(bullmq_jobs_completed_total{queue="notifications"}[5m]) * 100
```
