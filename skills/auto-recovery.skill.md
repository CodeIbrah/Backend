# Nombre

Auto Recovery Skill

# Objetivo

Implementar recuperación automática segura del sistema backend-template mediante retry workflows, reconnect workflows, restart policies y fallback systems para minimizar downtime y mantener disponibilidad del servicio sin intervención humana para fallos conocidos y recuperables.

# Responsabilidades

- **Recovery Seguro**: Ejecutar acciones de recuperación automática solo cuando es seguro hacerlo, con verificaciones pre y post recovery, rollback automático si recovery falla, y límites de intentos para evitar recovery loops.
- **Retry Workflows**: Reintentar operaciones fallidas con backoff exponencial, jitter, circuit breaker patterns y límites de intentos para operaciones transitorias (HTTP calls, DB connections, Redis operations).
- **Reconnect Workflows**: Reconectar automáticamente a servicios dependientes caídos (PostgreSQL, Redis, BullMQ) con verificación de salud post-reconexión y fallback si reconexión falla.
- **Restart Policies**: Reiniciar servicios o contenedores automáticamente según políticas configuradas, con health check verification post-restart, backoff entre restarts y escalación si restarts repetidos fallan.
- **Fallback Systems**: Activar sistemas fallback cuando servicios primarios no están disponibles, incluyendo cached responses, degraded mode, queue buffering y graceful degradation.
- **Circuit Breaker**: Implementar circuit breaker pattern para servicios dependientes, con estados closed → open → half-open y thresholds configurables.
- **Health Verification**: Verificar salud del sistema después de cada acción de recovery, con múltiples checks (health endpoint, database connectivity, redis ping, queue status).
- **Recovery History**: Mantener historial de acciones de recovery ejecutadas, resultados, y efectividad para mejora continua de políticas de recovery.

# Inputs

- Alertas de Runtime Monitoring Agent (servicios down, degradación)
- Health check failures de Docker y servicios
- Error events de Error Analysis Skill
- Connection failures de Prisma, Redis, BullMQ
- Queue congestion events de Queue Management Skill
- Container unhealthy events de Docker Ops Skill
- Incident events de Incident Response Skill
- Métricas de sistema en tiempo real

# Outputs

- Acciones de recovery ejecutadas con resultados
- Retry attempts con backoff y resultados
- Reconnection attempts con verificación de salud
- Service restarts con health verification
- Fallback activations con duración y impacto
- Circuit breaker state changes
- Recovery history con efectividad
- Alertas de recovery fallido para escalamiento humano

# Herramientas usadas

- **Docker Compose**: docker compose restart, docker compose up para servicios
- **Docker CLI**: docker restart, docker exec para operaciones de contenedores
- **Prisma Client** (main/src/prisma): Reconnect a PostgreSQL
- **Redis/ioredis**: Reconnect a Redis con retry
- **BullMQ**: Reconnect a queues, worker recovery
- **shared-logger** (packages/shared-logger): Logging de acciones de recovery
- **shared-telemetry** (packages/shared-telemetry): Métricas de recovery
- **Prometheus** (puerto 9090): Verificación de salud post-recovery
- **Auto-Recovery configuration**: Políticas y thresholds configurados
- **Incident Response Skill**: Escalamiento cuando recovery automático falla

# Workflows

## Workflow 1: Recovery de Servicio Caído

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Detectar   │───▶│  Evaluar    │───▶│  Ejecutar    │───▶│  Verificar   │───▶│  Confirmar  │
│  Servicio   │    │  Si Recovery│    │  Recovery    │    │  Salud Post  │    │  o Escalar  │
│  Caído      │    │  es Seguro  │    │  Action      │    │  Recovery    │    │  a Humano   │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Health check       Verificar tipo de    Restart, reconnect,   Health check,        Si recovery
  fail, error        fallo, verificar     retry, fallback       connectivity,        exitoso: log
  CRITICAL,          safety conditions,                        endpoint response    y confirmar
  container down     check recovery limits                                            Si falla: escalar
```

### Decision Tree de Recovery:

```
Service Down?
├── Database (PostgreSQL)
│   ├── Connection lost → Reconnect with backoff (max 5 attempts)
│   ├── Pool exhausted → Kill idle connections + reconnect
│   └── Container down → Docker restart + wait for health check
├── Cache (Redis)
│   ├── Connection lost → Reconnect with backoff (max 5 attempts)
│   ├── Container down → Docker restart + wait for health check
│   └── Memory full → Flush non-critical keys + alert
├── Queue (BullMQ)
│   ├── Worker stalled → Restart worker process
│   ├── Queue congested → Scale workers + clear stalled jobs
│   └── Redis connection lost → Reconnect + re-enqueue stalled jobs
├── Service (NestJS)
│   ├── Health check fail → Restart container
│   ├── OOM killed → Restart with increased memory limit
│   └── Restart loop → Escalate to human (possible code issue)
└── Gateway (Nginx)
    ├── Config error → Reload config, fallback to previous
    └── Container down → Docker restart
```

## Workflow 2: Circuit Breaker Pattern

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Request a  │───▶│  Verificar  │───▶│  Ejecutar o  │───▶│  Actualizar  │───▶│  Transición │
│  Servicio   │    │  Estado del │    │  Rechazar    │    │  Contadores  │    │  de Estado  │
│  Externo    │    │  Circuit    │    │  según Estado│    │  de Éxito    │    │  si Necesario│
│             │    │  Breaker    │    │              │    │  y Fallo     │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Estados del Circuit Breaker:

| Estado | Comportamiento | Transición |
|--------|---------------|------------|
| CLOSED | Requests normales, contadores de error | → OPEN si error rate > threshold |
| OPEN | Requests rechazados inmediatamente, fallback activado | → HALF-OPEN después de timeout |
| HALF-OPEN | Permitir requests de prueba | → CLOSED si éxito, → OPEN si fallo |

### Configuración:

```typescript
{
  failureThreshold: 5,        // Abrir circuito después de 5 fallos
  successThreshold: 3,        // Cerrar circuito después de 3 éxitos en half-open
  timeout: 30000,             // Esperar 30s antes de pasar a half-open
  monitoringPeriod: 60000,    // Ventana de monitoreo de 60s
  errorRateThreshold: 0.5,    // Abrir si error rate > 50%
}
```

## Workflow 3: Fallback System Activation

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Detectar   │───▶│  Evaluar    │───▶│  Activar     │───▶│  Monitorear  │───▶│  Restaurar  │
│  Servicio   │    │  Fallback   │    │  Fallback    │    │  Servicio    │    │  Servicio   │
│  No Disp.   │    │  Disponible │    │  System      │    │  Primario    │    │  Primario   │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Fallback Strategies:

| Servicio No Disponible | Fallback | Duración Máxima |
|-----------------------|----------|-----------------|
| Redis (cache) | Query database directly | Until Redis recovers |
| PostgreSQL | Return cached data (stale) | 5 minutes max |
| Notifications Queue | Store locally, retry later | Until queue recovers |
| External API | Return cached/default response | Until API recovers |
| Auth Service | Allow cached tokens, block new logins | Until auth recovers |

# Casos de uso

## Caso 1: Recovery Automático de PostgreSQL Connection

**Escenario**: main service pierde conexión a PostgreSQL.

**Flujo**:
1. **Detectar**: Prisma throws `PrismaClientKnownRequestError: Connection lost`
2. **Evaluar**: Verificar si PostgreSQL container está healthy
   - PostgreSQL container: healthy
   - Red entre contenedores: OK
   - Tipo de fallo: connection drop temporal
3. **Ejecutar**: Reconnect con backoff exponencial
   - Attempt 1: wait 1s, reconnect → fail
   - Attempt 2: wait 2s, reconnect → fail
   - Attempt 3: wait 4s, reconnect → success
4. **Verificar**: Ejecutar health check query
   - `SELECT 1` → success
   - Health endpoint → 200 OK
5. **Confirmar**: Log recovery exitoso, actualizar métricas

**Output**:
```json
{
  "recoveryId": "rec-20260521-001",
  "type": "DATABASE_RECONNECT",
  "target": "postgresql",
  "timestamp": "2026-05-21T10:15:00.000Z",
  "detection": {
    "error": "PrismaClientKnownRequestError: Connection lost",
    "source": "main service",
    "postgresqlStatus": "healthy",
    "networkStatus": "OK"
  },
  "recovery": {
    "action": "reconnect_with_backoff",
    "attempts": 3,
    "delays": ["1s", "2s", "4s"],
    "totalTime": "7s",
    "result": "success"
  },
  "verification": {
    "healthCheck": "SELECT 1 → success",
    "endpointCheck": "GET /api/v1/health → 200",
    "result": "healthy"
  },
  "impact": {
    "downtime": "7s",
    "failedRequests": 3,
    "recoveredRequests": "all subsequent requests"
  }
}
```

## Caso 2: Circuit Breaker para Servicio Externo

**Escenario**: Servicio de email externo responde con 503 repetidamente.

**Flujo**:
1. Requests a email service fallan 5 veces en 60 segundos
2. Circuit breaker abre (estado: CLOSED → OPEN)
3. Requests subsequentes rechazados inmediatamente con fallback
4. Fallback: queue email para retry later
5. Después de 30 segundos, circuit breaker pasa a HALF-OPEN
6. Request de prueba: éxito → circuit breaker cierra (HALF-OPEN → CLOSED)
7. Requests normales resumes

## Caso 3: Fallback cuando Redis está Down

**Escenario**: Redis container cae, cache no disponible.

**Flujo**:
1. **Detectar**: Redis connection refused
2. **Evaluar**: Fallback disponible (query DB directly)
3. **Activar**: Switch a database queries para datos cacheados
   - Log warning: "Redis down, using database fallback"
   - Incrementar load en PostgreSQL
4. **Monitorear**: Verificar PostgreSQL no se sobrecarga
   - Si PostgreSQL pool > 80%, activar degraded mode
   - Degraded mode: solo servir datos críticos
5. **Restaurar**: Redis container restart → reconnect → switch back to cache

# Alertas

- **CRITICAL**: Recovery automático fallido después de máximo intentos → Escalar a humano
- **CRITICAL**: Recovery loop detectado (>5 recoveries en 10 min) → Escalar a humano
- **HIGH**: Fallback activado para servicio crítico → Alerta de degradación
- **HIGH**: Circuit breaker abierto para servicio crítico → Alerta de dependencia
- **MEDIUM**: Recovery exitoso pero con impacto significativo → Alerta de rendimiento
- **MEDIUM**: Fallback activado para servicio no crítico → Logging
- **LOW**: Circuit breaker cerrado después de recovery → Logging
- **INFO**: Recovery automático ejecutado exitosamente → Logging

# Integraciones

- **Docker Ops Skill**: Restart de contenedores para recovery
- **Queue Management Skill**: Recovery de workers y colas
- **Incident Response Skill**: Escalamiento cuando recovery falla
- **Runtime Monitoring Agent**: Detección de problemas para trigger recovery
- **Error Analysis Skill**: Errores para análisis de causa de fallo
- **Diagnostics Skill**: Diagnóstico para evaluar si recovery es seguro
- **Prisma Client**: Reconnect a PostgreSQL
- **Redis/ioredis**: Reconnect a Redis
- **BullMQ**: Recovery de workers y jobs
- **Docker Compose**: Restart de servicios

# Ejemplos

## Ejemplo 1: Circuit Breaker Implementation

```typescript
// main/src/common/services/circuit-breaker.service.ts
import { Injectable } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

@Injectable()
export class CircuitBreakerService {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;

  async execute<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldTransitionToHalfOpen()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        return fallback();
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (this.state === CircuitState.OPEN) {
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = CircuitState.CLOSED;
        logger.info('Circuit breaker closed');
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= 5) {
      this.state = CircuitState.OPEN;
      logger.warn('Circuit breaker opened');
    }
  }

  private shouldTransitionToHalfOpen(): boolean {
    return this.lastFailureTime && Date.now() - this.lastFailureTime > 30000;
  }
}
```

## Ejemplo 2: Retry con Backoff Exponencial

```typescript
// main/src/common/utils/retry.ts
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    jitter?: boolean;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Add jitter to prevent thundering herd
      const jitterDelay = jitter ? Math.random() * delay * 0.5 : 0;
      const actualDelay = Math.min(delay + jitterDelay, maxDelay);

      logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${actualDelay}ms`, {
        error: lastError.message,
      });

      await sleep(actualDelay);
      delay *= backoffFactor;
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Ejemplo 3: Auto Recovery Service

```typescript
// main/src/reports/auto-recovery.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { retryWithBackoff } from '../common/utils/retry';

@Injectable()
export class AutoRecoveryService {
  private recoveryHistory: RecoveryRecord[] = [];

  async recoverDatabaseConnection() {
    const recovery: RecoveryRecord = {
      id: this.generateRecoveryId(),
      type: 'DATABASE_RECONNECT',
      target: 'postgresql',
      timestamp: new Date(),
      status: 'IN_PROGRESS',
    };

    try {
      await retryWithBackoff(
        async () => {
          await this.prisma.$queryRaw`SELECT 1`;
        },
        { maxAttempts: 5, initialDelay: 1000, jitter: true },
      );

      recovery.status = 'SUCCESS';
      recovery.duration = Date.now() - recovery.timestamp.getTime();
      logger.info('Database connection recovered', recovery);
    } catch (error) {
      recovery.status = 'FAILED';
      recovery.error = (error as Error).message;
      logger.error('Database connection recovery failed', recovery);

      // Escalate to human
      await this.escalateToHuman(recovery);
    }

    this.recoveryHistory.push(recovery);
    return recovery;
  }

  async recoverRedisConnection() {
    const recovery: RecoveryRecord = {
      id: this.generateRecoveryId(),
      type: 'REDIS_RECONNECT',
      target: 'redis',
      timestamp: new Date(),
      status: 'IN_PROGRESS',
    };

    try {
      await retryWithBackoff(
        async () => {
          await this.redis.ping();
        },
        { maxAttempts: 5, initialDelay: 1000, jitter: true },
      );

      recovery.status = 'SUCCESS';
      logger.info('Redis connection recovered', recovery);
    } catch (error) {
      recovery.status = 'FAILED';
      recovery.error = (error as Error).message;

      // Try Docker restart as fallback
      await this.restartRedisContainer(recovery);
    }

    this.recoveryHistory.push(recovery);
    return recovery;
  }

  private async escalateToHuman(recovery: RecoveryRecord) {
    // Create incident for human intervention
    logger.error('Auto-recovery failed, escalating to human', recovery);
    // Integration with Incident Response Skill
  }

  private async restartRedisContainer(recovery: RecoveryRecord) {
    logger.info('Attempting Docker restart of Redis container');
    // Execute: docker compose restart redis
    // Wait for health check
    // Verify connection
  }

  private generateRecoveryId(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const seq = String(this.recoveryHistory.length + 1).padStart(3, '0');
    return `rec-${date}-${seq}`;
  }
}

interface RecoveryRecord {
  id: string;
  type: string;
  target: string;
  timestamp: Date;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  duration?: number;
  error?: string;
}
```

## Ejemplo 4: Recovery Policy Configuration

```typescript
// main/src/config/recovery.config.ts
export const recoveryConfig = {
  database: {
    reconnect: {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
    },
    restart: {
      maxAttempts: 3,
      backoffBetweenRestarts: 30000,
      healthCheckTimeout: 60000,
    },
  },
  redis: {
    reconnect: {
      maxAttempts: 5,
      initialDelay: 500,
      maxDelay: 15000,
      backoffFactor: 2,
      jitter: true,
    },
    restart: {
      maxAttempts: 3,
      backoffBetweenRestarts: 20000,
      healthCheckTimeout: 30000,
    },
  },
  services: {
    restart: {
      maxAttempts: 3,
      backoffBetweenRestarts: 30000,
      healthCheckTimeout: 60000,
      escalationAfterFailures: 2, // Escalate after 2 failed restart attempts
    },
  },
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    monitoringPeriod: 60000,
    errorRateThreshold: 0.5,
  },
  recoveryLoop: {
    maxRecoveriesInWindow: 5,
    windowMs: 600000, // 10 minutes
    escalationThreshold: 3,
  },
};
```
