# Backend Template

Enterprise-Ready Backend with Hybrid Monolith + Microservices Architecture

<!-- This README is maintained as the canonical English version. Translations are available in the table below. -->

A production-grade backend template built with NestJS and Express, featuring a hybrid architecture that combines a feature-rich monolith with independent microservices. Includes comprehensive observability, AI-powered error diagnosis, analytics, queue-based processing, and automated incident response.

---

## Translations

| Language  | File                                   |
| --------- | -------------------------------------- |
| English   | [README.md](README.md)                 |
| Espanol   | [docs/README_ES.md](docs/README_ES.md) |
| Francais  | [docs/README_FR.md](docs/README_FR.md) |
| Deutsch   | [docs/README_DE.md](docs/README_DE.md) |
| Portugues | [docs/README_PT.md](docs/README_PT.md) |
| Русский   | [docs/README_RU.md](docs/README_RU.md) |
| 日本語    | [docs/README_JA.md](docs/README_JA.md) |
| 中文      | [docs/README_ZH.md](docs/README_ZH.md) |
| हिन्दी    | [docs/README_HI.md](docs/README_HI.md) |
| العربية   | [docs/README_AR.md](docs/README_AR.md) |

<!-- Translation files are kept in /docs/ to keep the root directory clean. Each is a full standalone document. -->

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
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview

The system follows a hybrid architecture combining a feature-rich monolith with independent microservices:

```
+-----------------------------------------------------------------------------------------+
|                              HYBRID ARCHITECTURE                                        |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-----------------------------------------------------------------------------+       |
|  |                                MAIN MONOLITH                              |       |
|  |                                                                             |       |
|  |  +-----------------------------------------------------------------+       |       |
|  |  |                        CORE DOMAIN SERVICES                        |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  |  | Auth        |  | Users       |  | Products    |  | Orders      |  |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  |                                                                         |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  |  |                        SUPPORTING SERVICES                        |   |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  |  | Logging     |  | Telemetry   |  | Queue       |  | Reports     |  |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  +-----------------------------------------------------------------------------+       |
|                                                                                         |
|  +-----------------------------------------------------------------------------+       |
|  |                                MICROSERVICES                                        |
|  |                                                                             |       |
|  |  +-----------------------------------------------------------------+       |       |
|  |  |                        INDEPENDENT SERVICES                        |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  |  | Mail        |  | Notifications|  | Payment     |  | SMS         |  |       |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |       |       |
|  |  +-----------------------------------------------------------------+   |       |       |
|  +-----------------------------------------------------------------------------+       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

The monolith handles core domain logic (auth, users, products, orders) and shared infrastructure (logging, telemetry, queues, reports). Independent microservices manage domain-specific concerns that benefit from isolated deployment (mail, notifications, payment processing, SMS).

<!-- Architecture decision: Auth was migrated into the monolith from its own microservice in July 2026. The microservices layer now only contains services that genuinely benefit from independent scaling and deployment. -->

---

## Tech Stack

| Category       | Technology                             |
| -------------- | -------------------------------------- |
| Runtime        | Node.js 20                             |
| Language       | TypeScript                             |
| Monolith       | NestJS                                 |
| Microservices  | Express                                |
| Database       | PostgreSQL (via Prisma ORM)            |
| Cache          | Redis (bullmq, caching, sessions)      |
| Queue          | BullMQ                                 |
| Message Broker | Redis Streams / BullMQ                 |
| API            | REST (Express/NestJS), WebSocket, gRPC |
| Auth           | JWT, OAuth2 (Google, GitHub), Session  |
| Validation     | class-validator / Zod                  |
| Logging        | Winston, Loki                          |
| Metrics        | Prometheus                             |
| Tracing        | OpenTelemetry, Jaeger                  |
| Monitoring     | Grafana, Sentry                        |
| CI/CD          | GitHub Actions                         |
| Container      | Docker, Docker Compose                 |
| Testing        | Jest, Postman/Newman, k6               |

---

## Project Structure

```
backend-template/
  main/                         # Main monolith application (NestJS)
    src/
      activity-log/             # User activity tracking module
      audit/                    # Audit trail module
      auth/                     # Authentication & authorization (JWT, OAuth2)
      cache/                    # Cache abstraction (Redis + LRU)
      cipher/                   # Encryption utilities
      common/                   # Shared decorators, filters, guards, interceptors
      config/                   # Centralized configuration (env vars)
      grpc/                     # gRPC client definitions
      logging/                  # Winston logger setup
      modules/                  # Shared NestJS modules (Prisma, Redis, etc.)
      prisma/                   # Prisma schema and migrations
      reports/                  # Report generation engine
      social-auth/              # Social login providers (Google, GitHub)
      telemetry/                # OpenTelemetry tracing setup
      users/                    # User management module
      websocket/                # WebSocket gateway
  microservices/                # Independent microservices
    mail-service/               # Email sending service
    notifications-service/      # Push notifications service
    payment-service/            # Payment processing service
    sms-service/                # SMS sending service
  infrastructure/               # Infrastructure configuration
    ai-doctor/                  # AI Error Doctor configuration
    deploy/                     # Deployment configs
    grafana/                    # Grafana dashboards
    jaeger/                     # Jaeger tracing config
    loki/                       # Loki log aggregation config
    prometheus/                 # Prometheus metrics config
    promtail/                   # Promtail log shipping config
    sentry/                     # Sentry error tracking config
  docs/                         # Documentation and translations
  scripts/                      # Utility scripts
  packages/                     # Shared packages
  reports/                      # Generated reports
  context/                      # AI agent context
  specs/                        # Specifications and ADRs
  loadtest/                     # Load testing scripts (k6)
  .env.example                  # Environment variables template
  package.json                  # Project dependencies
  README.md                     # Project documentation
```

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/CodeIbrah/Backend.git
cd Backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database and Redis credentials

# 4. Start infrastructure (Docker)
docker compose up -d

# 5. Run database migrations
npx prisma migrate dev --schema main/src/prisma/schema.prisma

# 6. Start development servers
npm run dev
```

---

## Development Setup

```bash
# Run the main monolith only
npm run dev -w main

# Run a specific microservice
npm run dev -w microservices/payment-service

# Run all services concurrently
npm run dev:all
```

---

## Environment Variables

Key environment variables are documented in [.env.example](.env.example). The configuration is validated at startup via a centralized config module.

| Variable            | Description                      | Required |
| ------------------- | -------------------------------- | -------- |
| `DATABASE_URL`      | PostgreSQL connection string     | Yes      |
| `REDIS_URL`         | Redis connection string          | Yes      |
| `JWT_SECRET`        | JWT signing secret               | Yes      |
| `JWT_EXPIRES_IN`    | JWT token expiration             | Yes      |
| `SMTP_HOST`         | SMTP server for email            | No       |
| `STRIPE_SECRET_KEY` | Stripe API key (payment service) | No       |

---

## API Endpoints

The main monolith exposes the following API endpoints:

### Authentication

| Method | Path                                 | Description               |
| ------ | ------------------------------------ | ------------------------- |
| POST   | `/api/auth/register`                 | Register new user         |
| POST   | `/api/auth/login`                    | Login with credentials    |
| POST   | `/api/auth/refresh`                  | Refresh access token      |
| POST   | `/api/auth/logout`                   | Invalidate session        |
| POST   | `/api/auth/forgot-password`          | Request password reset    |
| POST   | `/api/auth/reset-password`           | Reset password with token |
| GET    | `/api/auth/oauth/:provider`          | Initiate OAuth2 flow      |
| GET    | `/api/auth/oauth/:provider/callback` | OAuth2 callback           |

### Users

| Method | Path             | Description         |
| ------ | ---------------- | ------------------- |
| GET    | `/api/users`     | List users (admin)  |
| GET    | `/api/users/:id` | Get user by ID      |
| PATCH  | `/api/users/:id` | Update user         |
| DELETE | `/api/users/:id` | Delete user (admin) |

### Products

| Method | Path                | Description            |
| ------ | ------------------- | ---------------------- |
| GET    | `/api/products`     | List products          |
| GET    | `/api/products/:id` | Get product by ID      |
| POST   | `/api/products`     | Create product (admin) |
| PATCH  | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |

### Orders

| Method | Path                     | Description         |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/orders`            | List user orders    |
| GET    | `/api/orders/:id`        | Get order details   |
| POST   | `/api/orders`            | Create order        |
| PATCH  | `/api/orders/:id/status` | Update order status |

---

## Observability

The system integrates the full OpenTelemetry observability stack:

- **Logging**: Winston with structured JSON output aggregated via Loki and Promtail.
- **Metrics**: Prometheus collects CPU, memory, request rate, latency percentiles, and error rates.
- **Tracing**: OpenTelemetry with Jaeger for distributed trace visualization and root cause analysis.
- **Dashboards**: Grafana dashboards for real-time system monitoring.

```bash
# Access observability tools (requires Docker)
Grafana:  http://localhost:3000
Prometheus: http://localhost:9090
Jaeger:   http://localhost:16686
Loki:     http://localhost:3100
```

---

## AI Error Doctor System

An automated multi-agent system for error diagnosis and incident response:

```
Error Collector -> Error Analysis Agent -> Fix Suggestion Agent -> Incident Response Agent -> Alert Service
                                                                                                        |
                                                        Runtime Monitoring Agent -> Auto Recovery System  |
                                                                                                        |
                                                                                                        v
                                                                                                Knowledge Base
```

**Components:**

- **Error Analysis Agent**: Parses logs, analyzes stack traces, classifies severity, detects patterns.
- **Fix Suggestion Agent**: Generates code patches and configuration changes based on error analysis.
- **Runtime Monitoring Agent**: Continuous health monitoring, anomaly detection, triggers auto-recovery.
- **Incident Response Agent**: Manages incident lifecycle, deduplication, alerting, escalation.
- **Auto Recovery System**: Graceful restarts, connection pool reclamation, cache warming.
- **Knowledge Base**: Persistent store of errors, fixes, patterns, and solutions for continuous learning.

---

## Analytics System

User and system analytics with event tracking:

- **User Events**: Registration, login, purchases, feature usage.
- **Performance**: API latency, database query times, cache hit rates.
- **Error Tracking**: Captured and classified errors with frequency analysis.
- **Custom Dashboards**: Configurable metrics views in Grafana.

---

## Queue System

Background job processing with BullMQ and Redis:

- **Email Queue**: Welcome emails, password resets, notifications.
- **Report Queue**: Scheduled and on-demand report generation.
- **Cleanup Queue**: Log rotation, cache invalidation, data retention.
- **Alert Queue**: Priority-based alert dispatch to multiple channels.

```bash
# Monitor queue status
npm run queue:dashboard
# Access BullMQ dashboard at http://localhost:3001
```

---

## Alert System

Multi-channel alerting with severity-based routing:

| Channel   | Critical | High | Medium | Low |
| --------- | -------- | ---- | ------ | --- |
| PagerDuty | Yes      | Yes  | No     | No  |
| Slack     | Yes      | Yes  | Yes    | No  |
| Email     | Yes      | Yes  | Yes    | Yes |
| Webhook   | Yes      | Yes  | Yes    | Yes |

Alerts are triggered by: error rate thresholds, response time degradation, connection pool saturation, memory leak detection, and queue backlog growth.

---

## Automatic Reports

Scheduled report generation with Markdown output:

- **Daily Error Summary**: Error count, top errors, resolved vs new.
- **System Health Report**: CPU, memory, disk, service status.
- **Performance Analysis**: Latency trends, slow queries, optimization candidates.
- **Incident Post-Mortem**: Timeline, root cause, resolution, action items.

Reports are stored in the `reports/` directory and optionally distributed via email or Slack.

---

## Security

- **Authentication**: JWT with refresh token rotation, OAuth2 (Google, GitHub).
- **Authorization**: Role-based access control (RBAC) with NestJS guards.
- **Rate Limiting**: Three-tier rate limiting (global, endpoint, user).
- **Headers**: CORS, CSRF, Helmet security headers, HSTS.
- **Validation**: Input validation with class-validator and Zod.
- **Encryption**: AES-256 at rest, TLS in transit, Argon2 for passwords.
- **Audit Trail**: All sensitive operations are logged with correlation IDs.

---

## Testing

- **API Tests (Postman)**: Comprehensive collection with 25+ endpoints documented. See [docs/postman/POSTMAN-GUIDE.md](docs/postman/POSTMAN-GUIDE.md).
- **Unit Tests**: Jest tests for individual components.
- **Integration Tests**: Prisma and NestJS module integration tests.
- **End-to-End Tests**: Complete flows (register, login, refresh, logout).
- **Load Testing**: k6 and autocannon for performance benchmarking.
- **Security Testing**: Rate limiting, brute force, security header validation.

```bash
# Run all tests
npm test

# Run load tests
npm run test:load
```

---

## Docker Setup

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

The Docker Compose configuration includes: PostgreSQL, Redis, Loki, Promtail, Prometheus, Jaeger, Grafana, and Sentry.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines. All contributions must pass linting and tests before merging.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
