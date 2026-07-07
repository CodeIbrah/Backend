# AI Doctor — Runtime Monitoring Agent (DeepSeek)

## What I Do

Monitoreo continuo de salud del sistema usando métricas de Node.js runtime. Detecto anomalías en CPU, memoria, latencia, deadlocks y cuellos de botella. **100% local** — sin API externa.

## Files I Reference

- `infrastructure/ai-doctor/agents/runtime-monitoring-agent.ts` — clase agente completa
- `infrastructure/ai-doctor/integrations/auto-recovery.ts` — acciones de recuperación automática
- `infrastructure/ai-doctor/integrations/alert-service.ts` — envío de alertas

## How to Invoke Me

```typescript
task(
  category="deep",
  load_skills=["ai-doctor-runtime-monitoring"],
  prompt="Run runtime health check on the system"
)
```

## My Workflow

### 1. Monitor CPU
```typescript
import { RuntimeMonitoringAgent } from 'infrastructure/ai-doctor/agents/runtime-monitoring-agent';

const agent = new RuntimeMonitoringAgent();
const cpuUsage = await agent.monitorCPU();
// Uses process.loadavg() and os.cpus().length
```

| CPU Usage | Alerta |
|---|---|
| > 80% | HIGH_CPU (HIGH) |
| > 95% | HIGH_CPU (CRITICAL) |

### 2. Monitor Memory
```typescript
const memory = await agent.monitorMemory();
// Uses process.memoryUsage() → heapUsed, heapTotal, rss, external
```

| Heap Ratio | Alerta |
|---|---|
| > 80% | HIGH_MEMORY (HIGH) |
| > 95% | HIGH_MEMORY (CRITICAL) |

### 3. Detect Memory Leaks
- Compara promedio heap de últimas 10 muestras vs 10 anteriores
- Si crecimiento > 10% → posible leak
- Si heapUsed/heapTotal > 0.9 → leak confirmado
- Requiere mínimo 10 muestras en historial

### 4. Monitor Response Times
```typescript
const responseTimes = await agent.monitorResponseTimes();
// avg, p50, p95, p99 based on recorded history
```

| P99 Latency | Alerta |
|---|---|
| > 5000ms | HIGH_LATENCY (HIGH) |

### 5. Detect Deadlocks
```typescript
const hasDeadlock = await agent.detectDeadlocks();
// Checks: _getActiveHandles().length > 100 AND _getActiveRequests().length > 50
```

### 6. Detect DB / Redis / Queue Issues
| Chequeo | Método | Threshold |
|---|---|---|
| DB Bottleneck | P95 > threshold | 5000ms |
| Redis Saturation | Heap ratio > 0.9 | — |
| Queue Congestion | Active handles > 100 | — |

### 7. Generate Alerts
```typescript
const alerts = await agent.generateAlerts();
// Returns Alert[] with type, severity, message, metadata
```

### 8. Run Full Check
```typescript
const result = await agent.run();
// result.alerts, result.cpuUsage, result.memoryMetrics,
// result.responseTimes, result.hasMemoryLeak, result.hasDeadlock,
// result.hasDBBottleneck, result.hasRedisSaturation, result.hasQueueCongestion
```

## Agent Config Options

```typescript
const agent = new RuntimeMonitoringAgent({
  maxHistoryLength: 100,      // muestras máximas en historial
  memoryLeakThreshold: 0.9,   // ratio heap usado/total para leak
  cpuThreshold: 80,            // % CPU para alertar
  responseTimeThreshold: 5000  // ms para alerta de latencia
});
```

## Auto-Recovery Integration

Cuando se detectan anomalías, se pueden ejecutar acciones de recuperación:

```typescript
import { AutoRecovery } from 'infrastructure/ai-doctor/integrations/auto-recovery';

const recovery = new AutoRecovery();
await recovery.executeRecovery(['restart_worker', 'clear_queue']);
```

Acciones seguras disponibles:
- `restart_worker` — reiniciar worker process
- `restart_container` — reiniciar contenedor
- `clear_queue` — limpiar cola de mensajes
- `invalidate_cache` — invalidar caché
- `reconnect_database` — reconectar DB
- `retry_failed_jobs` — reintentar jobs fallidos

## Known Limitations

- 100% **Node.js runtime**: usa `process.memoryUsage()`, `process.loadavg()`, `os.cpus()`
- No accede a métricas de infraestructura externa (Docker, Prometheus, etc.)
- La detección de deadlocks es heurística, no精确
- Sin conexión a OpenAI/ChatGPT — DeepSeek usado solo cuando se invoca como skill de OpenCode
- Las alertas se registran en Winston; el envío real requiere configurar webhooks
