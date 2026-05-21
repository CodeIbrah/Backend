# Nombre

Error Analysis Skill

# Objetivo

Analizar errores capturados de la aplicación backend-template para identificar causas raíz, clasificar severidad, detectar patrones recurrentes y correlacionar fallos entre servicios mediante parsing de stack traces, análisis de correlación y detección de duplicados.

# Responsabilidades

- **Parsing de Stack Traces**: Extraer y estructurar stack traces de logs Winston, excepciones no capturadas y promesas rechazadas en los servicios NestJS (main, auth-service, users-service, notifications-service).
- **Detección de Causa Raíz**: Identificar el punto de origen del fallo mediante correlación de traces distribuidos (Jaeger/OpenTelemetry) y análisis de la cadena de dependencias entre servicios.
- **Clasificación de Severidad**: Asignar niveles CRITICAL, HIGH, MEDIUM, LOW, INFO basados en impacto en disponibilidad, integridad de datos y número de servicios afectados.
- **Análisis de Correlación**: Vincular errores mediante correlationId propagado a través de X-Correlation-ID headers, traces OpenTelemetry y contexto de solicitud.
- **Detección de Duplicados**: Identificar errores repetidos mediante firmas de stack trace, agrupar variantes del mismo error y evitar alertas redundantes.
- **Análisis de Patrones**: Detectar patrones temporales (errores que ocurren en ventanas específicas), patrones de cascada (fallo que se propaga entre servicios) y patrones de degradación progresiva.
- **Base de Conocimiento**: Leer y escribir en Knowledge Base (Prisma/PostgreSQL) para mantener historial de errores, firmas conocidas y soluciones aplicadas.
- **Correlación con Métricas**: Cruzar errores con métricas de Prometheus (CPU, memoria, pool de conexiones, latencia) para contextualizar el impacto.

# Inputs

- Logs estructurados Winston desde Loki (JSON con nivel, mensaje, correlationId, traceId, spanId)
- Stack traces de excepciones no capturadas en NestJS (main/src, microservices/*/src)
- Promesas rechazadas no manejadas en controladores, servicios y workers BullMQ
- Traces distribuidos desde Jaeger (OTLP HTTP en puerto 4318, gRPC en 4317)
- Métricas de Prometheus (puerto 9090) para contexto de recursos
- Eventos de errores desde shared-logger (packages/shared-logger/src)
- Datos de health checks de Docker (wget en /api/v1/health)
- Logs de contenedores vía Promtail

# Outputs

- Análisis estructurado en formato JSON con errorId, severidad, patrón, causa raíz, servicios afectados
- Firma de error para deduplicación (hash de stack trace normalizado)
- Clasificación de severidad con justificación
- Identificación de errores relacionados mediante correlationId
- Recomendaciones de investigación inicial
- Actualizaciones a Knowledge Base (tabla Errors, Patterns)
- Alertas al Incident Response Agent para errores CRITICAL/HIGH
- Datos al Fix Suggestion Agent con contexto completo del error

# Herramientas usadas

- **Winston** (packages/shared-logger): Logging estructurado con correlationId, traceId, spanId
- **Loki** (puerto 3100): Agregación y consulta de logs con LogQL
- **Jaeger** (puerto 16686): Visualización de traces distribuidos
- **OpenTelemetry** (packages/shared-telemetry): Instrumentación automática y propagación de contexto
- **Prometheus** (puerto 9090): Métricas de sistema y aplicación
- **Prisma** (main/src/prisma): ORM para consultas a Knowledge Base
- **PostgreSQL** (puerto 5432): Almacenamiento persistente de errores y patrones
- **NestJS Exception Filters**: Captura centralizada de excepciones

# Workflows

## Workflow 1: Captura y Análisis de Error

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Error      │───▶│  Parse &    │───▶│  Normalizar  │───▶│  Generar     │───▶│  Clasificar │
│  Capturado  │    │  Filtrar    │    │  & Dedup     │    │  Firma       │    │  Severidad  │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Winston log         Extraer stack       Comparar con KB     Hash de stack       CRITICAL/HIGH/
  Excepción           trace, mensaje,     errores similares   trace normalizado   MEDIUM/LOW/INFO
  Promesa rechazada   correlationId       (umbral 0.75)                           según impacto
```

### Pasos detallados:

1. **Captura**: Error Collector intercepta error vía Winston logger o NestJS exception filter
2. **Parse**: Extraer tipo de error, mensaje, stack trace, correlationId, service name, endpoint
3. **Normalizar**: Limpiar paths absolutos, normalizar números de línea, estandarizar formato
4. **Deduplicar**: Generar firma (hash SHA-256 del stack trace normalizado), buscar en KB errores con similitud > 0.75
5. **Clasificar**: Aplicar matriz de severidad basada en tipo de error, servicios afectados y métricas contextuales

## Workflow 2: Detección de Causa Raíz

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Error      │───▶│  Correlar   │───▶│  Analizar    │───▶│  Identificar │───▶│  Validar    │
│  Analizado  │    │  con Trace  │    │  Cadena de   │    │  Punto de    │    │  Causa      │
│             │    │  Distribuido│    │  Fallos      │    │  Origen      │    │  Raíz       │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Correlar**: Usar traceId del error para recuperar trace completo desde Jaeger
2. **Analizar Cadena**: Reconstruir flujo de solicitud: nginx → gateway → servicio → Prisma → PostgreSQL
3. **Identificar Origen**: Encontrar el primer span con error en el trace, verificar si es causa o síntoma
4. **Validar**: Cruzar con métricas de Prometheus (ej: pool de conexiones al 100% confirma causa raíz)

## Workflow 3: Detección de Patrones

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Errores    │───▶│  Agrupar    │───▶│  Analizar    │───▶│  Detectar    │
│  del Periodo│    │  por Firma  │    │  Temporal    │    │  Patrón      │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘
```

### Patrones detectables:

- **DatabaseConnectionTimeout**: Timeouts de Prisma/PostgreSQL en múltiples servicios
- **MemoryLeak**: Crecimiento progresivo de heap en contenedores Docker
- **QueueCongestion**: BullMQ jobs acumulándose en cola
- **AuthCascade**: Fallos en auth-service propagándose a otros servicios
- **RedisEviction**: Alta tasa de evicción en Redis causando cache misses

# Casos de uso

## Caso 1: Database Connection Pool Exhaustion

**Escenario**: PostgreSQL connection pool agotado en users-service causando timeouts en cascada.

**Flujo**:
1. Error Collector captura `PrismaClientKnownRequestError: Timed out fetching a new connection from the connection pool`
2. Error Analysis Agent parsea stack trace, extrae: archivo `src/prisma/client.ts`, función `acquireConnection`
3. Genera firma: hash del stack trace normalizado
4. Busca en KB: encuentra 12 errores similares en última hora
5. Consulta Prometheus: activeConnections=100, maxConnections=100, queueDepth=47
6. Clasifica: CRITICAL (pool al 100%, múltiples servicios afectados)
7. Identifica causa raíz: conexiones no liberadas en paths de error
8. Envía análisis a Fix Suggestion Agent y alerta a Incident Response Agent

**Output esperado**:
```json
{
  "errorId": "err-20260521-001",
  "timestamp": "2026-05-21T10:15:32.000Z",
  "severity": "CRITICAL",
  "pattern": "DatabaseConnectionTimeout",
  "rootCause": "PostgreSQL connection pool exhausted - unclosed connections in error paths",
  "affectedServices": ["users-service", "main", "notifications-service"],
  "stackTrace": {
    "file": "src/prisma/client.ts",
    "line": 142,
    "function": "acquireConnection"
  },
  "correlationId": "corr-abc-123-def",
  "metrics": {
    "activeConnections": 100,
    "maxConnections": 100,
    "queueDepth": 47
  },
  "duplicateCount": 12,
  "firstSeen": "2026-05-21T10:14:00.000Z",
  "signature": "sha256:a1b2c3d4..."
}
```

## Caso 2: Detección de Error Duplicado

**Escenario**: Mismo TypeError ocurre 50 veces en 5 minutos en auth-service.

**Flujo**:
1. Primer error: se analiza completamente, se crea registro en KB
2. Errores 2-50: firma coincide con error existente (similitud 0.98)
3. Se agrupan bajo mismo errorId, se incrementa contador
4. Al alcanzar umbral de 10 repeticiones en 5 minutos, se escala severidad a HIGH
5. Se genera alerta de patrón recurrente

## Caso 3: Error en Cascada entre Servicios

**Escenario**: auth-service falla, causando errores en users-service y notifications-service.

**Flujo**:
1. Error Analysis Agent detecta errores en 3 servicios con correlationId compartido
2. Reconstruye cadena de fallo vía Jaeger trace
3. Identifica auth-service como origen (primer span con error)
4. Detecta patrón: `AuthCascadeFailure`
5. Clasifica como CRITICAL por impacto multi-servicio

# Alertas

- **CRITICAL**: Error que afecta disponibilidad de servicio o integridad de datos → Alerta inmediata a Incident Response Agent
- **HIGH**: Error recurrente (>10 veces en 5 min) o degradación significativa → Alerta en 30 segundos
- **MEDIUM**: Error nuevo no visto anteriormente → Registro en KB, análisis programado
- **LOW**: Error conocido con solución aplicada previamente → Registro silencioso
- **INFO**: Error esperado y manejado (ej: validación de input) → Solo logging

## Umbrales de Alerta

| Métrica | Umbral | Acción |
|---------|--------|--------|
| Error rate | >5 errores/min | Alerta HIGH |
| Error duplicado | >10 en 5 min | Escalar severidad |
| Multi-servicio | >2 servicios afectados | CRITICAL automático |
| Tiempo sin resolver | >15 min | Escalación automática |

# Integraciones

- **shared-logger**: Recibe logs estructurados con correlationId, traceId, spanId
- **shared-telemetry**: Usa traces OpenTelemetry para correlación distribuida
- **shared-analytics**: Comparte datos de error analytics para dashboards
- **shared-reports**: Proporciona datos para generación de reportes de errores
- **Prisma (main/src/prisma)**: Consultas y escrituras a Knowledge Base
- **Prometheus**: Consulta métricas contextuales para enriquecer análisis
- **Jaeger**: Recupera traces distribuidos para análisis de causa raíz
- **Loki**: Consulta logs históricos para análisis de patrones
- **Incident Response Agent**: Envía errores clasificados para creación de incidentes
- **Fix Suggestion Agent**: Envía análisis completo para generación de fixes

# Ejemplos

## Ejemplo 1: Análisis de Stack Trace

**Input** (log Winston):
```json
{
  "level": "error",
  "message": "Cannot read properties of undefined (reading 'map')",
  "correlationId": "corr-xyz-789",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "service": "users-service",
  "error": {
    "type": "TypeError",
    "stack": "TypeError: Cannot read properties of undefined (reading 'map')\n    at UsersController.formatResponse (/app/src/users/users.controller.ts:45:23)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)"
  },
  "context": {
    "userId": "user-456",
    "endpoint": "GET /api/v1/users",
    "duration": 12
  }
}
```

**Output** (análisis):
```json
{
  "errorId": "err-20260521-002",
  "type": "TypeError",
  "message": "Cannot read properties of undefined (reading 'map')",
  "severity": "MEDIUM",
  "pattern": "UndefinedPropertyAccess",
  "rootCause": "users.controller.ts:45 - response.data es undefined antes de llamar .map()",
  "affectedServices": ["users-service"],
  "stackTrace": {
    "file": "src/users/users.controller.ts",
    "line": 45,
    "function": "UsersController.formatResponse",
    "code": "response.data.map(item => transformUser(item))"
  },
  "correlationId": "corr-xyz-789",
  "suggestion": "Agregar validación: response?.data?.map(...) o optional chaining",
  "similarErrors": ["err-20260518-042"],
  "signature": "sha256:e5f6g7h8..."
}
```

## Ejemplo 2: Detección de Patrón Recurrente

**Input**: 47 errores de timeout en última hora distribuidos en 3 servicios.

**Output**:
```json
{
  "patternId": "pat-20260521-001",
  "name": "DatabaseConnectionTimeout",
  "category": "Infrastructure",
  "severity": "CRITICAL",
  "frequency": {
    "last1h": 47,
    "last24h": 52,
    "trend": "increasing"
  },
  "affectedServices": ["users-service", "main", "notifications-service"],
  "rootCause": "PostgreSQL connection pool exhausted",
  "firstSeen": "2026-05-21T09:15:00.000Z",
  "lastSeen": "2026-05-21T10:15:32.000Z",
  "relatedErrors": ["err-20260521-001", "err-20260521-003", "err-20260521-004"],
  "confidence": 0.94,
  "recommendedAction": "Increase connection pool size and fix connection leak"
}
```

## Ejemplo 3: Consulta LogQL para Análisis

```logql
# Errores CRITICAL en última hora por servicio
{job="backend-template"} |= "level\":\"error" | json | severity="CRITICAL" | line_format "{{.service}}: {{.message}}"

# Patrón de errores de conexión a PostgreSQL
{job="backend-template"} |~ "(PrismaClientKnownRequestError|Connection.*timeout|ECONNREFUSED.*5432)" | json | line_format "{{.correlationId}} - {{.message}}"

# Errores duplicados (misma firma)
{job="backend-template"} |= "signature" | json | line_format "{{.signature}}: count={{.duplicateCount}}"
```
