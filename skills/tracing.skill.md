# Nombre

Tracing Skill

# Objetivo

Implementar y gestionar distributed tracing con OpenTelemetry en el sistema backend-template para rastrear solicitudes a través de todos los servicios (nginx, main, auth-service, users-service, notifications-service), identificar cuellos de botella, analizar cadenas de fallo y proporcionar visibilidad completa del flujo de requests.

# Responsabilidades

- **Instrumentación OpenTelemetry**: Configurar y mantener el SDK de OpenTelemetry en todos los servicios NestJS para captura automática de traces de HTTP, database queries (Prisma), y operaciones async (BullMQ).
- **Propagación de Contexto**: Garantizar que trace context (traceId, spanId, traceparent header) se propague correctamente entre servicios vía HTTP headers, colas BullMQ y llamadas a base de datos.
- **Integración con Jaeger**: Configurar export de traces a Jaeger vía OTLP HTTP (puerto 4318) y gRPC (puerto 4317), configurar sampling policies y retención.
- **Análisis de Traces**: Identificar spans lentos, errores en spans, cadenas de dependencia entre servicios y patrones de fallo.
- **Correlación con Logs y Métricas**: Vincular traces con logs (vía correlationId y traceId) y métricas (vía labels de Prometheus) para análisis unificado.
- **Custom Spans**: Crear spans personalizados para operaciones de negocio críticas (autenticación, procesamiento de pagos, envío de notificaciones).
- **Service Dependency Map**: Generar y mantener mapa de dependencias entre servicios basado en traces observados.
- **Performance Baseline**: Establecer líneas base de duración de traces por ruta y detectar desviaciones.

# Inputs

- Traces generados por OpenTelemetry SDK en cada servicio
- HTTP headers de propagación (traceparent, tracestate, X-Correlation-ID)
- Spans de operaciones HTTP (incoming y outgoing)
- Spans de operaciones de base de datos (Prisma queries)
- Spans de operaciones de cola (BullMQ job processing)
- Spans personalizados de lógica de negocio
- Configuración de sampling desde environment variables
- Datos de Jaeger para análisis histórico

# Outputs

- Traces completos exportados a Jaeger con spans estructurados
- Trace context propagado entre servicios
- Spans personalizados para operaciones de negocio
- Análisis de traces: spans lentos, errores, dependencias
- Service dependency map actualizado
- Performance baseline por ruta de servicio
- Alertas de anomalías en duración de traces

# Herramientas usadas

- **OpenTelemetry SDK** (packages/shared-telemetry): Instrumentación automática de Node.js/NestJS
- **OTLP Exporter**: Export de traces vía HTTP (4318) y gRPC (4317)
- **Jaeger** (puerto 16686): UI de visualización, API de consulta, almacenamiento
- **OpenTelemetry Auto-Instrumentation**: Instrumentación automática de HTTP, DNS, fs, net
- **Prisma Instrumentation**: Spans de queries de base de datos
- **BullMQ Instrumentation**: Spans de procesamiento de jobs
- **@opentelemetry/instrumentation-http**: Instrumentación de HTTP client y server
- **@opentelemetry/instrumentation-express**: Instrumentación de Express (usado internamente por NestJS)
- **docker-compose.yml**: Servicio Jaeger all-in-one

# Workflows

## Workflow 1: Propagación de Trace Context

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Request    │───▶│  Extraer/   │───▶│  Crear Span  │───▶│  Propagar    │───▶│  Exportar   │
│  Recibido   │    │  Generar    │    │  Root/Child  │    │  Contexto    │    │  a Jaeger   │
│             │    │  TraceCtx   │    │              │    │  Downstream  │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Nginx recibe       Si hay traceparent,   Span root para       Incluir traceparent    OTLP exporter
  request con        usarlo; si no,        request entrante     en headers HTTP        envía spans
  headers            generar nuevo         con attributes       salientes, job data    a Jaeger
                     trace context         de contexto          de BullMQ
```

### Pasos detallados:

1. **Request Recibido**: Servicio recibe request HTTP con o sin headers de tracing
2. **Extraer/Generar**: Si traceparent existe, extraer traceId; si no, generar nuevo traceId
3. **Crear Span**: Crear span root (primer servicio) o child span (servicios downstream)
4. **Propagar**: Incluir traceparent en headers de llamadas HTTP salientes, en job data de BullMQ
5. **Exportar**: Al completar span, exportar vía OTLP a Jaeger

## Workflow 2: Análisis de Trace

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Obtener    │───▶│  Reconstruir│───▶│  Identificar │───▶│  Calcular    │───▶│  Generar    │
│  Trace de   │    │  Cadena de  │    │  Spans       │    │  Métricas    │    │  Análisis   │
│  Jaeger     │    │  Spans      │    │  Problemáticos│   │  de Trace    │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Obtener**: Consultar Jaeger API por traceId o buscar traces con criterios específicos
2. **Reconstruir**: Ordenar spans por startTime, reconstruir árbol de llamadas
3. **Identificar**: Encontrar spans con duración >p95, spans con error, spans con retry
4. **Calcular**: Duración total, duración por servicio, % de tiempo en cada componente
5. **Generar**: Análisis estructurado con bottleneck identification y recomendaciones

## Workflow 3: Service Dependency Map

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Recopilar  │───▶│  Extraer    │───▶│  Construir   │───▶│  Visualizar │
│  Traces     │    │  Relaciones │    │  Grafo de    │    │  Mapa de    │
│  Recientes  │    │  entre      │    │  Dependencias│    │  Servicios  │
│             │    │  Servicios  │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Mapa de dependencias esperado:

```
nginx:80
  └── main:3010
        ├── users-service:3002
        │     └── postgres:5432
        ├── auth-service:3001
        │     └── redis:6379
        └── notifications-service:3003
              ├── redis:6379
              └── BullMQ → redis:6379
```

# Casos de uso

## Caso 1: Debugging de Latencia en Request Multi-Servicio

**Escenario**: POST /api/v1/orders tarda 4.5s, se necesita identificar el componente lento.

**Flujo**:
1. Obtener traceId de response header o log
2. Consultar Jaeger UI con traceId
3. Analizar waterfall de spans:
   - nginx: 2ms
   - main (route handler): 15ms
   - users-service (validate user): 8ms
   - PostgreSQL (create order): 4200ms ← BOTTLENECK
   - notifications-service (send notification): 180ms
   - BullMQ (queue job): 45ms
4. Identificar: query Prisma sin índice, full table scan
5. Recomendación: agregar índice en columna de búsqueda

**Output**:
```json
{
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "totalDuration": "4.5s",
  "spanCount": 12,
  "services": [
    { "name": "nginx", "duration": "2ms", "percent": "0.04%" },
    { "name": "main", "duration": "15ms", "percent": "0.33%" },
    { "name": "users-service", "duration": "8ms", "percent": "0.18%" },
    { "name": "postgresql", "duration": "4200ms", "percent": "93.33%", "bottleneck": true },
    { "name": "notifications-service", "duration": "180ms", "percent": "4.00%" },
    { "name": "bullmq", "duration": "45ms", "percent": "1.00%" }
  ],
  "bottleneck": {
    "service": "postgresql",
    "span": "prisma:order.create",
    "duration": "4200ms",
    "baseline": "50ms",
    "deviation": "+8300%",
    "rootCause": "Full table scan on orders table - missing index on user_id",
    "recommendation": "CREATE INDEX idx_orders_user_id ON orders(user_id)"
  }
}
```

## Caso 2: Detección de Error en Cadena de Servicios

**Escenario**: Error en notifications-service causa fallo parcial en request de orders.

**Flujo**:
1. Trace muestra error span en notifications-service
2. Error no propaga al response HTTP (degradación graceful)
3. Identificar: notification service timeout, pero order se creó exitosamente
4. Clasificar como error no-crítico (degradación graceful funcionando)

## Caso 3: Análisis de Patrón de Traces

**Escenario**: Identificar patrones de traces lentos recurrentes.

**Flujo**:
1. Consultar Jaeger por traces con duration > 2s en última hora
2. Agrupar por operation name
3. Identificar: 80% de traces lentos incluyen span de Prisma en users-service
4. Correlacionar con métricas de PostgreSQL: pool usage >85%
5. Conclusión: bottleneck sistémico en database, no endpoint específico

# Alertas

- **CRITICAL**: Trace con error en servicio crítico (main, auth-service) → Alerta inmediata
- **HIGH**: Trace duration >3x baseline para ruta crítica → Alerta de degradación
- **HIGH**: Error rate en traces >5% en 10 minutos → Alerta de fiabilidad
- **MEDIUM**: Nuevo servicio detectado en dependency map → Registro para revisión
- **MEDIUM**: Trace duration >2x baseline para cualquier ruta → Alerta de rendimiento
- **LOW**: Sampling rate adjustment needed → Registro para optimización
- **INFO**: Dependency map actualizado → Logging

# Integraciones

- **shared-telemetry** (packages/shared-telemetry): SDK de OpenTelemetry y configuración
- **shared-logger** (packages/shared-logger): Correlación de traces con logs vía traceId
- **Observability Skill**: Pipeline completo de observabilidad
- **Error Analysis Skill**: Traces como fuente para análisis de errores
- **Diagnostics Skill**: Traces para diagnóstico de rendimiento
- **Performance Skill**: Traces para análisis de latencia y bottlenecks
- **Jaeger**: Almacenamiento y visualización de traces
- **Prometheus**: Métricas de traces (duration, count, error rate)
- **Grafana**: Dashboards de traces y service dependency map
- **Nginx**: Propagación de trace context en reverse proxy
- **BullMQ**: Propagación de trace context en jobs async

# Ejemplos

## Ejemplo 1: Configuración OpenTelemetry en NestJS

```typescript
// packages/shared-telemetry/src/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';

export function initTracing(serviceName: string) {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      ['deployment.environment']: process.env.NODE_ENV || 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
    }),
    instrumentations: [
      getNodeAutoInstrumentations(),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();
  return sdk;
}
```

## Ejemplo 2: Span Personalizado

```typescript
// main/src/orders/orders.service.ts
import { trace, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class OrdersService {
  private readonly tracer = trace.getTracer('orders-service');

  async createOrder(dto: CreateOrderDto) {
    return this.tracer.startActiveSpan('orders.createOrder', async (span) => {
      span.setAttribute('order.userId', dto.userId);
      span.setAttribute('order.items', dto.items.length);

      try {
        const order = await this.prisma.order.create({
          data: dto,
          include: { items: true },
        });

        span.setAttribute('order.id', order.id);
        span.setStatus({ code: SpanStatusCode.OK });
        return order;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

## Ejemplo 3: Consulta de Trace en Jaeger API

```bash
# Obtener trace por ID
curl http://localhost:16686/api/traces/0af7651916cd43dd8448eb211c80319c

# Buscar traces por servicio y operación
curl "http://localhost:16686/api/traces?service=main&operation=POST%20/api/v1/orders&limit=10"

# Buscar traces con errores
curl "http://localhost:16686/api/traces?service=users-service&tags=%7B%22error%22%3Atrue%7D&limit=20"

# Buscar traces por duración mínima
curl "http://localhost:16686/api/traces?service=main&minDuration=2000ms&limit=10"
```

## Ejemplo 4: Trace Context en BullMQ

```typescript
// Propagar trace context en job de BullMQ
import { trace, propagation } from '@opentelemetry/api';

async function queueNotification(userId: string, message: string) {
  const span = trace.getActiveSpan();
  if (!span) return;

  // Extraer trace context para propagar
  const headers: Record<string, string> = {};
  propagation.inject(trace.setSpanContext(trace.getSpanContext(span)), headers);

  await this.notificationsQueue.add('send-notification', {
    userId,
    message,
    traceContext: headers, // Propagar para tracing async
  });
}

// Consumir job con trace context
async function processNotification(job: Job) {
  const { traceContext } = job.data;

  // Extraer trace context del job
  const parentContext = propagation.extract(traceContext);

  return tracer.startActiveSpan('notifications.processJob', {
    links: [{ context: parentContext }],
  }, async (span) => {
    // Procesar notificación con trace linked al original
    await sendNotification(job.data);
    span.end();
  });
}
```
