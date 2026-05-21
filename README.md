# Backend Template

**Enterprise-Ready Backend with Hybrid Monolith + Microservices Architecture**

A production-grade backend template built with NestJS and Express, featuring a hybrid architecture that combines a feature-rich monolith with independent microservices. Includes comprehensive observability, AI-powered error diagnosis, analytics, queue-based processing, and automated incident response.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Observability](#observability)
- [AI Error Doctor System](#ai-error-doctor-system)
- [Analytics System](#analytics-system)
- [Queue System](#queue-system)
- [Alert System](#alert-system)
- [Automatic Reports](#automatic-reports)
- [Security](#security)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview

This project uses a **hybrid architecture** combining a NestJS monolith for core business logic with independent Express microservices for scalable, isolated workloads. An Nginx API gateway routes traffic, while a full observability stack provides monitoring, logging, and distributed tracing.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            ENTERPRISE BACKEND ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              CLIENTS                                        │   │
│  │         Web App          Mobile App          External APIs          CLI     │   │
│  └────────────────────────────────┬────────────────────────────────────────────┘   │
│                                   │                                                 │
│                                   ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY (Nginx)                                 │   │
│  │                    Port 80/443 - Reverse Proxy                              │   │
│  │          /api/v1/* ──▶ main │ /auth/* ──▶ auth-svc │ /users/* ──▶ users    │   │
│  └────────┬────────────────────────┬───────────────────────┬───────────────────┘   │
│           │                        │                       │                       │
│           ▼                        ▼                       ▼                       │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐               │
│  │   MONOLITH      │   │  AUTH SERVICE    │   │  USERS SERVICE   │               │
│  │   (NestJS)      │   │  (Express)       │   │  (Express)       │               │
│  │   Port 3010     │   │  Port 3001       │   │  Port 3002       │               │
│  │                 │   │                  │   │                  │               │
│  │  Auth           │   │  JWT Auth        │   │  CRUD Users      │               │
│  │  Users          │   │  Login/Register  │   │  Profile Mgmt    │               │
│  │  Analytics      │   │  Token Refresh   │   │  User Search     │               │
│  │  Reports        │   │  Password Reset  │   │  Validation      │               │
│  │  Metrics        │   │                  │   │                  │               │
│  │  Health         │   │                  │   │                  │               │
│  │  Ops            │   │                  │   │                  │               │
│  └────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘               │
│           │                     │                       │                         │
│           ▼                     ▼                       ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    NOTIFICATIONS SERVICE (Express)                          │   │
│  │                    Port 3003 - Email, SMS, Push                             │   │
│  └────────────────────────────────┬────────────────────────────────────────────┘   │
│                                   │                                                 │
│           ┌───────────────────────┼───────────────────────┐                        │
│           ▼                       ▼                       ▼                        │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────┐           │
│  │   PostgreSQL    │   │      Redis       │   │   BullMQ Queues      │           │
│  │   Port 5432     │   │   Port 6379      │   │   (Job Processing)   │           │
│  │                 │   │                  │   │                      │           │
│  │  Prisma ORM     │   │  Cache/Sessions  │   │  Analytics Queue     │           │
│  │  Migrations     │   │  Rate Limiting   │   │  Notifications Queue │           │
│  │  Data Layer     │   │  Pub/Sub         │   │  Reports Queue       │           │
│  └─────────────────┘   └──────────────────┘   └──────────────────────┘           │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        OBSERVABILITY STACK                                  │   │
│  │                                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Prometheus  │  │   Grafana    │  │    Loki      │  │   Jaeger     │   │   │
│  │  │  :9090       │  │   :3000      │  │   :3100      │  │   :16686     │   │   │
│  │  │  Metrics     │  │  Dashboards  │  │  Log Aggreg  │  │  Tracing     │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │   │
│  │  │  Promtail    │  │ OpenTelemetry│  │    Sentry    │                     │   │
│  │  │  Log Shipper │  │   Tracing    │  │  Error Track │                     │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                     │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                      AI ERROR DOCTOR SYSTEM                                 │   │
│  │                                                                             │   │
│  │  ┌───────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐ │   │
│  │  │  Error    │─▶│  Error        │─▶│  Fix         │─▶│  Incident        │ │   │
│  │  │ Collector │  │  Analysis     │  │  Suggestion  │  │  Response        │ │   │
│  │  └───────────┘  └───────────────┘  └──────────────┘  └────────┬─────────┘ │   │
│  │       │                                                       │            │   │
│  │       ▼                                                       ▼            │   │
│  │  ┌───────────┐                                         ┌──────────────┐   │   │
│  │  │ Runtime   │────────────────────────────────────────▶│ Auto Recovery│   │   │
│  │  │ Monitoring│                                         └──────────────┘   │   │
│  │  └───────────┘                                                            │   │
│  │                                                                             │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    KNOWLEDGE BASE (Prisma)                          │   │   │
│  │  │   Errors │ Fixes │ Patterns │ Incidents │ Solutions                 │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | NestJS | Primary monolith framework with dependency injection |
| **Framework** | Express.js | Microservices HTTP framework |
| **Language** | TypeScript | Type-safe development across all services |
| **ORM** | Prisma | Database ORM with migrations and type generation |
| **Database** | PostgreSQL 16 | Primary relational database |
| **Cache** | Redis 7 | Caching, sessions, rate limiting, pub/sub |
| **Queue** | BullMQ | Job queue management and async processing |
| **API Gateway** | Nginx | Reverse proxy, load balancing, SSL termination |
| **Tracing** | OpenTelemetry | Distributed tracing and context propagation |
| **Tracing UI** | Jaeger | Distributed trace visualization and analysis |
| **Metrics** | Prometheus | Metrics collection, storage, and alerting rules |
| **Dashboards** | Grafana | Metrics visualization and dashboard creation |
| **Logging** | Winston | Structured application logging |
| **Log Aggregation** | Loki | Log storage and LogQL querying |
| **Log Shipping** | Promtail | Docker container log collection to Loki |
| **Error Tracking** | Sentry | Production error tracking and performance monitoring |
| **Monorepo** | pnpm + Turborepo | Workspace management and cached builds |
| **AI Provider** | Ollama / OpenAI / Claude | AI-powered error analysis and fix generation |
| **Linting** | ESLint + Prettier | Code quality and formatting |
| **Git Hooks** | Husky + Commitlint | Pre-commit hooks and conventional commits |

---

## Project Structure

```
backend-template/
├── .editorconfig
├── .env.example
├── .eslintrc.js
├── .gitignore
├── .husky/                          # Git hooks configuration
├── .prettierrc
├── AGENTS.md                        # Multi-agent IA architecture documentation
├── docker-compose.yml               # Full stack Docker orchestration
├── package.json                     # Root workspace package
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.base.json               # Shared TypeScript configuration
├── turbo.json                       # Turborepo pipeline configuration
│
├── main/                            # NestJS Monolith (Port 3010)
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts                  # Application entry point
│   │   ├── app.module.ts            # Root module
│   │   ├── config/
│   │   │   └── app.config.ts        # Application configuration
│   │   ├── auth/                    # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   └── strategies/
│   │   │       ├── jwt.strategy.ts
│   │   │       └── local.strategy.ts
│   │   ├── users/                   # Users module
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts
│   │   ├── analytics/               # Analytics module
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.processor.ts
│   │   │   └── interceptors/
│   │   │       └── analytics.interceptor.ts
│   │   ├── reports/                 # Reports module
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   └── reports.module.ts
│   │   ├── modules/
│   │   │   ├── health/
│   │   │   │   └── health.controller.ts
│   │   │   ├── metrics/
│   │   │   │   └── metrics.controller.ts
│   │   │   └── ops/
│   │   │       ├── ops.controller.ts
│   │   │       └── ops.module.ts
│   │   ├── queue/                   # BullMQ queue module
│   │   │   ├── queue.module.ts
│   │   │   └── queue.service.ts
│   │   ├── prisma/                  # Prisma database module
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── logging/
│   │   │   └── logging.module.ts
│   │   ├── telemetry/
│   │   │   ├── telemetry.module.ts
│   │   │   └── otel.ts
│   │   └── common/                  # Shared utilities
│   │       ├── decorators/
│   │       │   ├── roles.decorator.ts
│   │       │   └── user.decorator.ts
│   │       ├── dto/
│   │       │   ├── pagination.dto.ts
│   │       │   └── response.dto.ts
│   │       ├── filters/
│   │       │   └── global-exception.filter.ts
│   │       ├── guards/
│   │       │   ├── jwt-auth.guard.ts
│   │       │   └── roles.guard.ts
│   │       └── interceptors/
│   │           ├── logging.interceptor.ts
│   │           └── transform.interceptor.ts
│   └── test/
│       └── app.e2e-spec.ts
│
├── microservices/                   # Independent microservices
│   ├── Dockerfile.microservice      # Shared microservice Dockerfile
│   │
│   ├── auth-service/                # Authentication Microservice (Port 3001)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── routes/
│   │   │   │   ├── index.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── error.middleware.ts
│   │   │   ├── validators/
│   │   │   │   └── auth.validator.ts
│   │   │   ├── utils/
│   │   │   │   └── response.ts
│   │   │   ├── telemetry/
│   │   │   │   └── tracer.ts
│   │   │   └── logging/
│   │   │       └── logger.ts
│   │   └── test/
│   │       └── app.test.ts
│   │
│   ├── users-service/               # Users Microservice (Port 3002)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── controllers/
│   │   │   │   └── users.controller.ts
│   │   │   ├── services/
│   │   │   │   └── users.service.ts
│   │   │   ├── routes/
│   │   │   │   ├── index.ts
│   │   │   │   └── users.routes.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   └── error.middleware.ts
│   │   │   ├── validators/
│   │   │   │   └── users.validator.ts
│   │   │   ├── utils/
│   │   │   │   └── response.ts
│   │   │   ├── telemetry/
│   │   │   │   └── tracer.ts
│   │   │   └── logging/
│   │   │       └── logger.ts
│   │   └── test/
│   │       └── app.test.ts
│   │
│   └── notifications-service/       # Notifications Microservice (Port 3003)
│       ├── Dockerfile
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── controllers/
│       │   │   └── notifications.controller.ts
│       │   ├── logging/
│       │   │   └── logger.ts
│       │   └── utils/
│       │       └── response.ts
│       └── test/
│           └── app.test.ts
│
├── gateway/                         # Nginx API Gateway
│   ├── Dockerfile
│   └── nginx.conf
│
├── infrastructure/                  # Infrastructure configurations
│   ├── ai-doctor/                   # AI Error Doctor System
│   │   ├── index.ts
│   │   ├── agents/
│   │   │   ├── error-analysis-agent.ts
│   │   │   ├── fix-suggestion-agent.ts
│   │   │   ├── runtime-monitoring-agent.ts
│   │   │   └── incident-response-agent.ts
│   │   ├── analyzers/
│   │   │   ├── error-analyzer.ts
│   │   │   └── fix-suggester.ts
│   │   ├── collectors/
│   │   │   └── error-collector.ts
│   │   ├── diagnostics/
│   │   │   └── diagnostic-engine.ts
│   │   ├── incidents/
│   │   │   └── incident-manager.ts
│   │   ├── integrations/
│   │   │   ├── alert-service.ts
│   │   │   └── auto-recovery.ts
│   │   ├── memory/
│   │   │   └── knowledge-base.ts
│   │   ├── prompts/
│   │   │   └── error-analysis.prompt.ts
│   │   ├── reporters/
│   │   │   └── report-generator.ts
│   │   └── workflows/
│   │       └── error-workflow.ts
│   ├── grafana/                     # Grafana provisioning configs
│   ├── jaeger/                      # Jaeger configuration
│   ├── loki/                        # Loki configuration
│   ├── logging/                     # Logging configuration
│   ├── prometheus/                  # Prometheus configuration
│   ├── promtail/                    # Promtail configuration
│   └── sentry/                      # Sentry configuration
│
├── packages/                        # Shared packages (pnpm workspace)
│   ├── shared-ai/                   # AI integration utilities
│   ├── shared-analytics/            # Analytics shared logic
│   ├── shared-logger/               # Winston logger configuration
│   ├── shared-reports/              # Report generation utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   ├── shared-telemetry/            # OpenTelemetry shared setup
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── middleware.ts
│   │   │   └── telemetry.ts
│   ├── shared-types/                # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   └── shared-utils/                # Common utilities
│       ├── src/
│       │   ├── index.ts
│       │   ├── constants.ts
│       │   ├── crypto.ts
│       │   ├── date.ts
│       │   ├── errors.ts
│       │   └── validation.ts
│
└── reports/                         # Generated reports output directory
    └── .gitkeep
```

---

## Quick Start

The fastest way to get the entire stack running is with Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd backend-template

# Copy environment configuration
cp .env.example .env

# Start all services (monolith, microservices, databases, observability)
pnpm docker:up

# Or using docker compose directly
docker compose up --build
```

This starts:
- **Nginx Gateway** on `http://localhost:80`
- **NestJS Monolith** on `http://localhost:3010`
- **Auth Service** on `http://localhost:3001`
- **Users Service** on `http://localhost:3002`
- **Notifications Service** on `http://localhost:3003`
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **Grafana** on `http://localhost:3000` (admin/admin)
- **Prometheus** on `http://localhost:9090`
- **Loki** on `http://localhost:3100`
- **Jaeger** on `http://localhost:16686`

---

## Development Setup

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** & **Docker Compose** (for infrastructure services)

### Local Development

```bash
# Install dependencies
pnpm install

# Start infrastructure services only (PostgreSQL, Redis, observability)
docker compose up postgres redis grafana prometheus loki jaeger -d

# Run database migrations
cd main && npx prisma migrate dev

# Start all services in development mode with hot reload
pnpm dev

# Build all packages and services
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format
```

### Running Individual Services

```bash
# Start only the monolith
cd main && pnpm dev

# Start only auth microservice
cd microservices/auth-service && pnpm dev

# Start only users microservice
cd microservices/users-service && pnpm dev

# Start only notifications microservice
cd microservices/notifications-service && pnpm dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `3000` | Application port |
| `APP_NAME` | `backend-template` | Application name |
| `APP_VERSION` | `1.0.0` | Application version |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/backend_db?schema=public` | PostgreSQL connection string |

### Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |

### JWT Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `7d` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token expiration |

### OpenTelemetry

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_SERVICE_NAME` | `backend-template` | Service name for traces |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://jaeger:4318` | OTLP exporter endpoint |
| `OTEL_TRACES_SAMPLER` | `parentbased_traceidratio` | Trace sampling strategy |
| `OTEL_TRACES_SAMPLER_ARG` | `1.0` | Sampling ratio (0.0 - 1.0) |

### Sentry

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | *(empty)* | Sentry DSN for error tracking |
| `SENTRY_ENVIRONMENT` | `development` | Sentry environment tag |

### AI Provider

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `ollama` | AI provider (`ollama`, `openai`, `claude`) |
| `OPENAI_API_KEY` | *(empty)* | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4` | OpenAI model to use |
| `CLAUDE_API_KEY` | *(empty)* | Anthropic Claude API key |
| `CLAUDE_MODEL` | `claude-3-sonnet-20240229` | Claude model to use |
| `OLLAMA_BASE_URL` | `http://ollama:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | Ollama model to use |

### Alerts

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_WEBHOOK_URL` | *(empty)* | Discord webhook URL for alerts |
| `SLACK_WEBHOOK_URL` | *(empty)* | Slack webhook URL for alerts |
| `TELEGRAM_BOT_TOKEN` | *(empty)* | Telegram bot token |
| `TELEGRAM_CHAT_ID` | *(empty)* | Telegram chat ID for alerts |
| `ALERT_EMAIL` | *(empty)* | Email address for alert notifications |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_TTL` | `60` | Rate limit window in seconds |
| `RATE_LIMIT_MAX` | `100` | Maximum requests per window |

### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origins |

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `debug` | Minimum log level |
| `LOG_FORMAT` | `json` | Log output format (`json`, `pretty`) |

### Analytics

| Variable | Default | Description |
|----------|---------|-------------|
| `ANALYTICS_ENABLED` | `true` | Enable analytics collection |
| `ANALYTICS_FLUSH_INTERVAL` | `10000` | Analytics flush interval (ms) |

### Queue

| Variable | Default | Description |
|----------|---------|-------------|
| `BULLMQ_PREFIX` | `backend-template` | BullMQ key prefix in Redis |

### Auto Recovery

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTO_RECOVERY_ENABLED` | `true` | Enable automatic recovery actions |
| `AUTO_RECOVERY_MAX_RETRIES` | `3` | Maximum recovery retry attempts |

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register new user | No |
| `POST` | `/api/v1/auth/login` | Login and get JWT tokens | No |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Refresh Token |
| `POST` | `/api/v1/auth/logout` | Logout and invalidate token | Bearer |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/users` | List all users (paginated) | Bearer |
| `GET` | `/api/v1/users/:id` | Get user by ID | Bearer |
| `PATCH` | `/api/v1/users/:id` | Update user | Bearer |
| `DELETE` | `/api/v1/users/:id` | Delete user | Bearer (Admin) |

### Analytics (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/analytics` | Get analytics data | Bearer |
| `GET` | `/api/v1/analytics/events` | List tracked events | Bearer |
| `GET` | `/api/v1/analytics/metrics` | Get aggregated metrics | Bearer |

### Reports (`/api/v1/reports`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/reports` | List available reports | Bearer |
| `POST` | `/api/v1/reports/generate` | Generate a new report | Bearer (Admin) |
| `GET` | `/api/v1/reports/:id` | Get report by ID | Bearer |

### Operations (`/api/v1/ops`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/ops/status` | System operational status | Bearer (Admin) |
| `POST` | `/api/v1/ops/restart` | Trigger service restart | Bearer (Admin) |
| `GET` | `/api/v1/ops/queues` | Queue status overview | Bearer (Admin) |

### Health & Metrics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/health` | Health check (Docker healthcheck) | No |
| `GET` | `/api/v1/metrics` | Prometheus metrics endpoint | No |

### Microservices

| Service | Port | Endpoint | Description |
|---------|------|----------|-------------|
| Auth Service | 3001 | `/auth/*` | Independent authentication service |
| Users Service | 3002 | `/users/*` | Independent users management service |
| Notifications Service | 3003 | `/notifications/*` | Notification delivery service |

---

## Observability

The project includes a complete observability stack based on the CNCF ecosystem.

### Logging

**Winston** provides structured application logging across all services.

- **Format**: JSON structured logs with correlation IDs
- **Levels**: `error`, `warn`, `info`, `http`, `debug`
- **Context**: Each log includes `correlationId`, `traceId`, `spanId`, service name, and request context

**Loki** aggregates logs from all containers via **Promtail**:

```bash
# Query logs in Grafana using LogQL
{container="main"} |= "error"
{service="auth-service"} | json | level="error"
```

Log correlation example:
```json
{
  "timestamp": "2026-05-21T10:15:32.123Z",
  "level": "error",
  "message": "Database connection timeout",
  "correlationId": "corr-abc-123",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "service": "backend-template",
  "context": {
    "userId": "user-456",
    "endpoint": "POST /api/v1/users",
    "duration": 30000
  }
}
```

### Metrics

**Prometheus** collects metrics from all services via the `/api/v1/metrics` endpoint.

**Available metrics:**
- HTTP request rate and latency (p50, p95, p99)
- Error rate by endpoint
- Active connections and pool utilization
- Queue depth and processing times
- Memory and CPU usage
- Garbage collection statistics

**Grafana** dashboards (`http://localhost:3000`, admin/admin):
- Pre-configured dashboards for application metrics
- Prometheus data source auto-provisioned
- Custom dashboards for business KPIs

### Tracing

**OpenTelemetry** provides distributed tracing across all services.

- **Exporter**: OTLP to Jaeger
- **Sampling**: Configurable (default: 100% in development)
- **Propagation**: W3C Trace Context headers

**Jaeger UI** (`http://localhost:16686`):
- View complete request traces across services
- Identify bottlenecks and error propagation paths
- Correlate traces with logs via `traceId`

Correlation ID propagation:
```
Client Request
     │
     │  X-Correlation-ID: corr-abc-123
     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ API Gateway  │────▶│ Main (NestJS)│────▶│ Users Svc    │
│ traceId: t1  │     │ traceId: t1  │     │ traceId: t1  │
│ spanId: s1   │     │ spanId: s2   │     │ spanId: s3   │
│ corrId: abc  │     │ corrId: abc  │     │ corrId: abc  │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## AI Error Doctor System

The **AI Error Doctor** is an autonomous multi-agent system that detects, analyzes, diagnoses, and resolves errors in production. It uses AI providers (Ollama, OpenAI, or Claude) to understand error patterns and generate fixes.

### Multi-Agent Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Error     │────▶│  Error Analysis  │────▶│ Fix Suggestion   │
│  Collector   │     │     Agent        │     │     Agent        │
└──────────────┘     └──────────────────┘     └──────────────────┘
        │                    │                         │
        │                    ▼                         │
        │           ┌──────────────────┐               │
        │           │    Incident      │◀──────────────┘
        │           │  Response Agent  │
        │           └────────┬─────────┘
        │                    │
        │                    ▼
        │           ┌──────────────────┐
        │           │   Alert Service  │
        │           └──────────────────┘
        │
        ▼
┌──────────────────┐
│  Runtime         │─────────────────────────────────────┐
│  Monitoring      │─────────────────────────────────────┤
│  Agent           │─────────────────────────────────────┤
└────────┬─────────┘                                     │
         │                                               ▼
         │                                    ┌──────────────────┐
         │                                    │  Auto Recovery   │
         │                                    │     System       │
         │                                    └──────────────────┘
         │
         └───────────────────────────────────────────────────────────┐
                                                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        KNOWLEDGE BASE                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐ │
│  │ Errors  │ │  Fixes  │ │Patterns │ │Incidents│ │  Solutions    │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Error Analysis Agent

**Purpose:** Analyze captured errors to understand root causes, classify severity, and detect patterns.

**Responsibilities:**
- Parse application logs (Winston, Loki) and stack traces
- Detect recurring error patterns across time windows
- Classify error severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`
- Perform root cause analysis through trace correlation (Jaeger, OpenTelemetry)
- Correlate errors with system metrics (Prometheus)
- Identify error cascades and dependency failures
- Maintain error signature database for pattern matching

**Output Example:**
```json
{
  "errorId": "err-20260521-001",
  "severity": "CRITICAL",
  "pattern": "DatabaseConnectionTimeout",
  "rootCause": "PostgreSQL connection pool exhausted",
  "affectedServices": ["user-service", "order-service"],
  "confidence": 0.94
}
```

### Fix Suggestion Agent

**Purpose:** Generate actionable fixes, patches, and refactoring recommendations.

**Responsibilities:**
- Generate code fixes based on error analysis results
- Explain problems in human-readable terms
- Generate unified diff patches for quick application
- Propose refactoring to prevent recurrence
- Validate fix safety through impact analysis
- Suggest configuration changes for infrastructure issues
- Provide rollback strategies for risky fixes

**Output Example:**
```json
{
  "fixId": "fix-20260521-001",
  "problem": "Connection pool exhausted due to unclosed connections in error paths",
  "solution": "Add finally block to ensure connection release",
  "confidence": 0.92,
  "riskLevel": "LOW"
}
```

### Runtime Monitoring Agent

**Purpose:** Continuously monitor system health, detect anomalies, and trigger recovery actions.

**Monitored Metrics:**

| Metric | Description |
|--------|-------------|
| CPU | Usage %, load average, iowait |
| Memory | RSS, heap used, heap total, external |
| Memory Leaks | Heap growth rate, GC frequency |
| Response Times | p50, p95, p99 latency per endpoint |
| Deadlocks | Blocked requests, circular waits |
| DB Bottlenecks | Slow queries, lock wait time, pool usage |
| Redis Saturation | Memory used, connected clients, eviction rate |
| Queue Congestion | BullMQ waiting, active, failed jobs |
| Error Rate | Errors/min, error ratio |
| Throughput | Requests/sec, jobs/sec |

### Incident Response Agent

**Purpose:** Manage incident lifecycle from detection through resolution.

**Responsibilities:**
- Create detailed incident reports with full context
- Generate incident timelines from correlated events
- Group related errors into single incidents (deduplication)
- Generate executive and technical summaries
- Send alerts through configured channels (Discord, Slack, Email, Telegram)
- Track incident status: `NEW`, `INVESTIGATING`, `MITIGATING`, `RESOLVED`
- Maintain incident history for post-mortem analysis

### Auto Recovery

**Purpose:** Automatically recover from common failure scenarios without human intervention.

**Capabilities:**
- Graceful service restart on OOM detection
- Connection pool recycling on exhaustion
- Queue worker restart on stuck jobs
- Cache invalidation on stale data detection
- Rate limit adjustment on traffic spikes

**Configuration:**
```env
AUTO_RECOVERY_ENABLED=true
AUTO_RECOVERY_MAX_RETRIES=3
```

### Knowledge Base

The Knowledge Base stores historical data for learning and pattern recognition:

| Table | Purpose |
|-------|---------|
| `Errors` | Error signatures, stack traces, severity, frequency |
| `Fixes` | Generated patches, confidence, success rate |
| `Patterns` | Detected error patterns, categories, related errors |
| `Incidents` | Incident records, timelines, resolutions, duration |
| `Solutions` | Solution effectiveness, application count, success rate |

**Learning Cycle:**
```
Error Detected ──▶ Fix Generated ──▶ Fix Applied ──▶ Store Result
      ▲                                                  │
      │                                                  ▼
      │                                          ┌──────────┐
      │◀─────────────────────────────────────────│  Update  │
      │                                          │ Pattern  │
      │                                          │  DB      │
      │                                          └──────────┘
```

### Running the AI Doctor

```bash
# Run diagnostics
pnpm doctor

# Run AI doctor analysis
pnpm ops

# Generate incident report
pnpm report

# Generate daily report
pnpm report:daily

# Generate weekly report
pnpm report:weekly
```

---

## Analytics System

The analytics system tracks application events, user behavior, and system metrics for business intelligence.

### Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌──────────────┐    ┌──────────────┐
│  Request    │───▶│  Analytics       │───▶│  BullMQ      │───▶│  Analytics   │
│  Incoming   │    │  Interceptor     │    │  Queue       │    │  Processor   │
└─────────────┘    └──────────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
                                                           ┌──────────────┐
                                                           │  Database    │
                                                           │  (Prisma)    │
                                                           └──────────────┘
```

### Features

- **Automatic Event Tracking**: HTTP interceptor captures request/response metadata
- **Async Processing**: Events queued via BullMQ for non-blocking processing
- **Configurable Flush**: Batch processing with configurable intervals
- **API Access**: Query analytics data via REST endpoints

### Configuration

```env
ANALYTICS_ENABLED=true
ANALYTICS_FLUSH_INTERVAL=10000
```

---

## Queue System

**BullMQ** provides robust job queue management backed by Redis.

### Queue Types

| Queue | Purpose | Priority |
|-------|---------|----------|
| `analytics` | Process analytics events | Low |
| `notifications` | Send emails, SMS, push notifications | Medium |
| `reports` | Generate scheduled and on-demand reports | Medium |
| `error-processing` | AI Doctor error analysis pipeline | High |
| `auto-recovery` | Automated recovery actions | Critical |

### Queue Service

```typescript
// Add job to queue
await queueService.addJob('notifications', {
  type: 'email',
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
});

// Process with retries and backoff
await queueService.addJob('reports', {
  type: 'daily',
  date: '2026-05-21',
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});
```

### Monitoring

Queue status available via:
- **API**: `GET /api/v1/ops/queues`
- **Grafana**: Queue dashboard with job counts, processing times, failure rates
- **Prometheus**: `bullmq_jobs_active`, `bullmq_jobs_waiting`, `bullmq_jobs_failed`

---

## Alert System

Multi-channel alerting for incidents, anomalies, and system events.

### Supported Channels

| Channel | Configuration | Use Case |
|---------|--------------|----------|
| **Discord** | `DISCORD_WEBHOOK_URL` | Team notifications, dev channel |
| **Slack** | `SLACK_WEBHOOK_URL` | Operations channel, on-call alerts |
| **Email** | `ALERT_EMAIL` | Executive summaries, incident reports |
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Mobile alerts, on-call engineers |

### Alert Levels

| Level | Channels | Response Time | Examples |
|-------|----------|---------------|----------|
| `CRITICAL` | All channels | Immediate | System down, data corruption, OOM |
| `HIGH` | Slack, Discord, Telegram | < 5 minutes | Error rate spike, connection pool exhaustion |
| `MEDIUM` | Slack, Discord | < 30 minutes | Memory leak detected, queue backlog |
| `LOW` | Discord | < 1 hour | Baseline drift, minor performance regression |

### Alert Payload

```json
{
  "alertId": "alert-20260521-001",
  "type": "MEMORY_LEAK_DETECTED",
  "severity": "HIGH",
  "metric": "heapUsed",
  "currentValue": "1.8GB",
  "threshold": "1.5GB",
  "trend": "increasing",
  "growthRate": "50MB/min",
  "estimatedTimeToOOM": "12 minutes",
  "recommendedAction": "Trigger graceful restart"
}
```

---

## Automatic Reports

The system generates automated reports for operational visibility and compliance.

### Report Types

| Report | Frequency | Audience | Content |
|--------|-----------|----------|---------|
| **System Health** | Hourly | Operations | Uptime, error rates, resource utilization |
| **Error Summary** | Daily | Engineering | Error counts, top errors, resolution status |
| **Incident Report** | Per incident | All stakeholders | Timeline, root cause, resolution, lessons learned |
| **Performance Analysis** | Weekly | Engineering, Architecture | Latency trends, throughput, bottlenecks |
| **Trend Analysis** | Weekly/Monthly | Management | MTTR, MTBF, error trends, fix effectiveness |
| **Post-Mortem** | Per major incident | All stakeholders | Detailed incident analysis and action items |

### Generating Reports

```bash
# Generate report on demand
pnpm report

# Generate daily report
pnpm report:daily

# Generate weekly report
pnpm report:weekly
```

### Report Output

Reports are stored in the `reports/` directory and available via:
- **API**: `GET /api/v1/reports/:id`
- **Formats**: Markdown, JSON, HTML
- **Distribution**: Email, Slack, dashboard

---

## Security

### Helmet

HTTP security headers configured on all services:
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- `Strict-Transport-Security`

### CORS

Configurable CORS policy:
```env
CORS_ORIGIN=http://localhost:3000
```

Supports multiple origins, methods, and credentials.

### JWT Authentication

- **Access Tokens**: Short-lived (default: 7 days)
- **Refresh Tokens**: Long-lived (default: 30 days)
- **Strategy**: Passport.js JWT + Local strategies
- **Guards**: Route-level `@Roles()` decorator for RBAC

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete('/users/:id')
async deleteUser(@Param('id') id: string) { ... }
```

### Rate Limiting

Redis-backed rate limiting:
```env
RATE_LIMIT_TTL=60      # Window in seconds
RATE_LIMIT_MAX=100     # Max requests per window
```

### Additional Security Measures

- **Input Validation**: DTOs with class-validator decorators
- **SQL Injection Prevention**: Prisma parameterized queries
- **Error Handling**: Global exception filter (no stack traces in production)
- **Secrets Management**: Environment variables, never hardcoded
- **Dependency Auditing**: `pnpm audit` in CI pipeline

---

## Testing

### Test Structure

```
main/test/                          # E2E tests for monolith
microservices/*/test/               # Unit tests for microservices
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run E2E tests
cd main && pnpm test:e2e

# Run unit tests for a specific service
cd microservices/auth-service && pnpm test

# Run tests with coverage
pnpm test -- --coverage
```

### Test Configuration

- **Framework**: Jest
- **E2E**: Supertest for HTTP testing
- **Database**: Test database with transaction rollback
- **Mocks**: Redis, external services mocked

---

## Docker Setup

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `main` | Built from `./main` | 3010 | NestJS monolith |
| `auth-service` | Built from `./microservices/auth-service` | 3001 | Auth microservice |
| `users-service` | Built from `./microservices/users-service` | 3002 | Users microservice |
| `notifications-service` | Built from `./microservices/notifications-service` | 3003 | Notifications microservice |
| `postgres` | `postgres:16-alpine` | 5432 | PostgreSQL database |
| `redis` | `redis:7-alpine` | 6379 | Redis cache/queue |
| `grafana` | `grafana/grafana:latest` | 3000 | Metrics dashboards |
| `prometheus` | `prom/prometheus:latest` | 9090 | Metrics collection |
| `loki` | `grafana/loki:latest` | 3100 | Log aggregation |
| `promtail` | `grafana/promtail:latest | - | Log shipping |
| `jaeger` | `jaegertracing/all-in-one:latest` | 16686 | Distributed tracing |
| `nginx` | Built from `./gateway` | 80, 443 | API gateway |

### Commands

```bash
# Start all services
docker compose up --build

# Start in detached mode
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f main
docker compose logs -f auth-service

# Restart a specific service
docker compose restart main

# Run database migrations
docker compose exec main npx prisma migrate deploy

# Health check
docker compose ps
```

### Health Checks

All services include Docker health checks:
- **Main**: `GET /api/v1/health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

### Nginx Gateway

The Nginx gateway routes traffic to appropriate services:

```nginx
# API routing
/api/v1/auth/*    → auth-service:3000
/api/v1/users/*   → users-service:3000
/api/v1/*         → main:3000
```

---

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using a port
netstat -tulpn | grep :3000

# Change port in .env or docker-compose.yml
```

#### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Test connection
docker compose exec postgres pg_isready -U postgres

# View database logs
docker compose logs postgres
```

#### Redis Connection Issues

```bash
# Check Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping

# View Redis logs
docker compose logs redis
```

#### Service Won't Start

```bash
# Check logs for specific service
docker compose logs main
docker compose logs auth-service

# Rebuild and restart
docker compose up --build -d main

# Check health status
docker compose ps
```

#### Observability Services

```bash
# Grafana not loading dashboards
docker compose logs grafana

# Prometheus not scraping metrics
curl http://localhost:9090/api/v1/targets

# Jaeger not receiving traces
curl http://localhost:16686/api/traces

# Loki not receiving logs
curl http://localhost:3100/ready
```

#### AI Doctor Issues

```bash
# Check AI provider connectivity
curl http://localhost:11434/api/tags  # Ollama

# Run diagnostics
pnpm doctor

# Check knowledge base
docker compose exec main npx prisma studio
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Run with verbose output
NODE_ENV=development pnpm dev
```

---

## Contributing

### Development Workflow

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** using conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Standards

- **TypeScript** strict mode enabled
- **ESLint** rules enforced (pre-commit hook)
- **Prettier** formatting (pre-commit hook)
- **Conventional commits** required (commitlint)

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(auth): add refresh token rotation
fix(users): resolve pagination offset calculation
docs(readme): update API endpoints table
```

### Pull Request Requirements

- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code formatted (`pnpm format`)
- [ ] Documentation updated
- [ ] Conventional commit messages
- [ ] PR description with context and testing notes

---

## License

This project is proprietary and confidential. All rights reserved.

Unauthorized copying, distribution, or modification of this software is strictly prohibited.

---

**Built with NestJS, Express, Prisma, and a comprehensive observability stack.**