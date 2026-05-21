Quiero que generes una plantilla backend enterprise-ready con arquitectura híbrida basada en monolito + microservicios, totalmente dockerizada, observabilidad completa, analytics, issue tracking inteligente, sistema IA de diagnóstico automático y documentación multiagente avanzada.

# Arquitectura principal

Estructura:

/backend-template
│
├── main/                          # Monolito principal NestJS
├── microservices/                # Microservicios Express
├── packages/                     # Shared packages
├── infrastructure/               # Infraestructura observabilidad
├── reports/                      # Informes automáticos
├── skills/                       # Skills IA
├── agents.md                     # Arquitectura agentes IA
├── gateway/                      # Reverse proxy
└── docker-compose.yml

---

# Stack principal

## Monolito `/main`

Usar:

- NestJS
- TypeScript strict
- Prisma ORM
- PostgreSQL
- Redis
- JWT Auth
- Swagger
- ConfigModule
- ValidationPipe
- Helmet
- CORS
- Winston logger
- Rate limiting
- Health checks
- OpenTelemetry

Arquitectura:

src/
├── modules/
├── common/
├── config/
├── prisma/
├── telemetry/
├── logging/
├── analytics/
├── ai-doctor/
├── reports/
├── auth/
└── users/

---

# Microservicios `/microservices`

Cada microservicio Express debe incluir:

- Express.js
- TypeScript
- Clean Architecture
- Winston logger
- OpenTelemetry
- Helmet
- Compression
- Rate limit
- Health endpoint
- Dockerfile propio

Estructura:

src/
├── routes/
├── controllers/
├── services/
├── middlewares/
├── validators/
├── telemetry/
├── logging/
├── ai-doctor/
└── utils/

---

# Observabilidad completa

Implementar observabilidad enterprise completa.

## Logging

Usar:

- Winston
- Morgan
- JSON structured logs
- Correlation IDs
- Request tracing
- Logs por niveles:
  - info
  - warn
  - error
  - debug

Guardar logs en:

- consola
- archivos rotativos
- Loki

Crear:

/infrastructure/logging/

Debe incluir:

- configuración Winston centralizada
- logger reutilizable shared
- interceptors NestJS
- middlewares Express
- request logging
- error logging
- traceId middleware

---

# Stack de observabilidad

Implementar completamente:

- Grafana
- Prometheus
- Loki
- Promtail
- OpenTelemetry
- Jaeger

Todo dockerizado.

---

# Métricas

Implementar métricas automáticas:

- request count
- response times
- memory usage
- CPU usage
- active users
- failed requests
- service uptime

Exponer:

/metrics

Compatible con Prometheus.

---

# Distributed tracing

Implementar tracing distribuido:

- OpenTelemetry SDK
- HTTP tracing
- Prisma tracing
- Express tracing
- NestJS tracing
- Trace propagation entre servicios
- Jaeger UI

---

# Analytics system

Crear sistema interno de analytics.

## Objetivo

Registrar eventos de negocio y uso del sistema.

Crear:

/main/src/analytics/
/packages/shared-analytics/

Registrar eventos:

- login
- register
- failed auth
- endpoint usage
- user activity
- api latency
- errors
- service calls

Guardar analytics en:

- PostgreSQL
- Redis cache

Crear:

AnalyticsService
AnalyticsModule

Endpoints:

GET /analytics/overview
GET /analytics/usage
GET /analytics/errors
GET /analytics/performance

---

# AI Error Doctor System

Implementar un sistema inteligente llamado:

AI Error Doctor

Objetivo:

- detectar errores automáticamente
- analizarlos
- diagnosticar causas
- generar soluciones
- sugerir fixes
- ejecutar workflows automáticos seguros
- asistir continuamente al developer

Debe activarse SIEMPRE que ocurra:

- exceptions
- crashes
- unhandled rejections
- memory leaks
- timeout errors
- database failures
- queue failures
- high latency
- auth failures
- service unavailable
- Docker container crashes
- Prisma errors
- Redis errors
- network errors
- rate limit spikes

---

# Arquitectura AI Doctor

Crear:

/infrastructure/ai-doctor/

Estructura:

ai-doctor/
├── agents/
├── analyzers/
├── collectors/
├── diagnostics/
├── reporters/
├── workflows/
├── memory/
├── prompts/
├── incidents/
└── integrations/

---

# Sistema multiagente IA

Implementar agentes especializados:

## Error Analysis Agent

Responsable de:

- leer logs
- analizar stack traces
- detectar patrones
- clasificar severidad
- detectar causa raíz

Debe analizar:

- Winston logs
- Loki logs
- Sentry events
- OpenTelemetry traces
- Docker logs
- Prisma exceptions

---

## Fix Suggestion Agent

Debe:

- generar posibles fixes
- explicar el problema
- generar patches sugeridos
- proponer refactors
- detectar malas prácticas

Salida esperada:

- diagnóstico
- causa raíz
- fix recomendado
- prioridad
- archivos afectados

---

## Runtime Monitoring Agent

Monitoreo continuo:

- CPU
- RAM
- memory leaks
- response times
- deadlocks
- DB bottlenecks
- Redis saturation
- queue congestion

Debe generar alertas automáticas.

---

## Incident Response Agent

Cuando haya errores críticos:

- crear incident report
- generar timeline
- agrupar errores relacionados
- generar resumen técnico
- generar resumen ejecutivo
- enviar alertas

---

# Integración IA

Preparar integración para:

- OpenAI
- Claude
- Ollama
- Local LLMs

Crear abstracción:

AIProvider
OpenAIProvider
ClaudeProvider
LocalProvider

---

# Workflow automático IA

Cuando ocurra un error:

1. Capturar excepción
2. Guardar logs
3. Guardar trace
4. Analizar contexto
5. Detectar causa raíz
6. Clasificar severidad
7. Generar diagnóstico
8. Generar fix sugerido
9. Crear incidente
10. Enviar alerta
11. Guardar histórico
12. Generar reporte

Todo automático.

---

# Dashboard AI Ops

Crear dashboard:

/ops

Funciones:

- incidentes activos
- errores recientes
- errores agrupados
- root cause analysis
- suggested fixes
- métricas
- tracing
- health status
- containers status
- queue status
- Redis status
- PostgreSQL status

---

# Error intelligence

El sistema debe:

- correlacionar errores
- detectar patrones repetitivos
- detectar regresiones
- detectar anomalías
- detectar picos inusuales
- detectar endpoints problemáticos

---

# Knowledge base

Crear memoria persistente:

/ai-doctor/memory

Guardar:

- errores previos
- fixes previos
- patrones conocidos
- incidentes históricos
- soluciones aplicadas

Objetivo:

aprender con el tiempo.

---

# Issue tracking

Integrar:

- Sentry self-hosted o cloud-ready

Implementar:

- captura automática de errores
- captura exceptions NestJS
- captura errors Express
- request context
- user context
- stack traces
- breadcrumbs
- release tracking

Crear:

/infrastructure/sentry/

Integrar con:

- Winston
- Loki
- OpenTelemetry
- AI Doctor

---

# Queue system

Agregar:

- BullMQ
- Redis queues

Queues:

- analytics-events
- notifications
- email-jobs
- error-processing
- ai-diagnostics

---

# Alertas inteligentes

Enviar alertas automáticas por:

- Discord webhook
- Slack webhook
- Email
- Telegram

Solo eventos importantes.

---

# Auto recovery

Preparar workflows automáticos seguros:

- reiniciar workers
- reiniciar containers
- limpiar colas
- invalidar cache
- reconectar DB
- retry jobs

IMPORTANTE:

NO ejecutar acciones destructivas automáticamente.

---

# Sistema de informes automáticos

Crear sistema automático de reportes del proyecto.

Todos los informes deben guardarse en:

/reports/

Formato:

Markdown (.md)

Cada informe debe estar en un archivo separado.

Nombre sugerido:

report-YYYY-MM-DD.md

---

# Generación automática de reportes

El sistema debe generar informes automáticamente:

- al finalizar builds
- después de deployments
- después de errores críticos
- diariamente
- semanalmente
- manualmente con comando CLI

Comandos:

pnpm report
pnpm report:daily
pnpm report:weekly

---

# Estructura obligatoria del informe

Todos los informes deben seguir EXACTAMENTE este esquema:

# Nombre

# Fecha

# Cambios

# Errores

# Tareas pendientes y hechas

## Hechas

## Pendientes

# Tareas a hacer

# Contexto

# Resumen

---

# Sistema de agentes documentados

Crear:

/agents.md

Y una carpeta:

/skills/

Archivos obligatorios:

- error-analysis.skill.md
- diagnostics.skill.md
- observability.skill.md
- analytics.skill.md
- tracing.skill.md
- reporting.skill.md
- incident-response.skill.md
- docker-ops.skill.md
- prisma-debug.skill.md
- performance.skill.md
- security.skill.md
- queue-management.skill.md
- auto-recovery.skill.md

---

# agents.md

Debe documentar:

- arquitectura multiagente
- responsabilidades
- workflows
- comunicación entre agentes
- prioridades
- sistema de memoria
- pipelines
- herramientas usadas
- integración con observabilidad
- integración con IA
- flujo de incidentes
- flujo de análisis
- flujo de reporting

Debe incluir diagramas ASCII y ejemplos.

---

# Formato obligatorio de skills

Cada `.skill.md` debe incluir:

# Nombre

# Objetivo

# Responsabilidades

# Inputs

# Outputs

# Herramientas usadas

# Workflows

# Casos de uso

# Alertas

# Integraciones

# Ejemplos

---

# Skills obligatorios

## error-analysis.skill.md

- stack trace parsing
- root cause detection
- severity classification
- correlation analysis
- duplicate detection

## diagnostics.skill.md

- runtime diagnostics
- CPU analysis
- memory analysis
- latency analysis
- bottleneck detection

## observability.skill.md

- métricas
- logging
- traces
- dashboards
- correlation ids

## analytics.skill.md

- user analytics
- event tracking
- performance analytics
- error analytics

## tracing.skill.md

- OpenTelemetry
- distributed tracing
- trace propagation
- Jaeger integration

## reporting.skill.md

- generación automática de reportes
- reportes markdown
- reportes incidentes
- resúmenes ejecutivos
- reportes técnicos

## incident-response.skill.md

- incident lifecycle
- escalation
- alerting
- incident grouping
- timeline generation

## docker-ops.skill.md

- container monitoring
- health checks
- restart workflows
- docker diagnostics
- logs aggregation

## prisma-debug.skill.md

- slow queries
- migrations
- deadlocks
- connection pool
- query optimization

## performance.skill.md

- profiling
- latency analysis
- cache optimization
- queue optimization
- scaling recommendations

## security.skill.md

- sanitización
- secret detection
- auth anomalies
- suspicious requests
- abuse detection

## queue-management.skill.md

- BullMQ
- retry strategies
- dead letter queues
- queue congestion
- worker recovery

## auto-recovery.skill.md

- safe auto recovery
- retry workflows
- reconnect workflows
- restart policies
- fallback systems

---

# Shared packages

Crear:

/packages/shared-types
/packages/shared-utils
/packages/shared-logger
/packages/shared-telemetry
/packages/shared-analytics
/packages/shared-ai
/packages/shared-reports

---

# Shared logger package

Debe exportar:

createLogger()
requestLogger()
errorLogger()
traceLogger()

---

# Shared telemetry package

Debe exportar:

initializeTelemetry()
metricsRegistry()
tracer()
prometheusExporter()

---

# Base de datos

PostgreSQL para:

- usuarios
- analytics
- auditoría
- eventos
- logs críticos
- incidentes

Redis para:

- cache
- rate limiting
- queues
- analytics temporales

---

# Gateway

Usar Nginx.

Debe incluir:

- reverse proxy
- rate limiting
- gzip
- SSL-ready
- upstream services
- request tracing headers

---

# Dockerización

TODO debe estar listo para:

docker compose up --build

Crear:

- Dockerfile para cada servicio
- Multi-stage builds
- Redes Docker internas
- Healthchecks
- Volúmenes persistentes

---

# Docker compose debe incluir

Servicios:

- main
- auth-service
- users-service
- notifications-service
- postgres
- redis
- grafana
- prometheus
- loki
- promtail
- jaeger
- sentry
- nginx gateway

---

# Dev Experience

Configurar:

- TurboRepo
- PNPM workspaces
- Hot reload
- ESLint
- Prettier
- Husky
- lint-staged
- Conventional commits

Scripts root:

{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "lint": "turbo run lint",
  "test": "turbo run test",
  "docker:up": "docker compose up --build",
  "docker:down": "docker compose down",
  "ops": "pnpm ai-doctor",
  "doctor": "pnpm diagnostics",
  "report": "pnpm generate-report"
}

---

# Seguridad

Implementar:

- Helmet
- CORS
- JWT auth
- env validation
- request sanitization
- secure headers
- rate limiting
- API guards

El AI Doctor:

- nunca debe exponer secrets
- nunca debe mostrar tokens
- nunca debe mostrar passwords
- debe sanitizar logs
- debe anonimizar datos sensibles

---

# Testing

Preparar:

- Jest
- Supertest
- e2e tests
- integration tests
- telemetry tests
- analytics tests
- AI Doctor tests

---

# README

Generar README enterprise completo con:

- arquitectura
- observabilidad
- logging
- tracing
- analytics
- issue tracking
- AI Doctor
- reportes automáticos
- dashboards
- docker setup
- troubleshooting
- endpoints
- variables de entorno

---

# Resultado esperado

La plantilla debe ser:

- production-ready
- enterprise-grade
- altamente escalable
- observable
- mantenible
- modular
- completamente tipada
- totalmente dockerizada
- preparada para Kubernetes
- preparada para CI/CD
- preparada para AI Ops

Genera TODO el código necesario y funcional.
