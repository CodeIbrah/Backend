# backend-template — Claude Code Project Rules

## Project Overview

Enterprise-ready backend template with hybrid monolith + microservices architecture. Built with NestJS and Express, featuring comprehensive observability, AI-powered error diagnosis, and automated incident response.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript 5.4
- **Framework**: NestJS with Express
- **Database**: PostgreSQL 16 via Prisma ORM
- **Cache**: Redis 7 via ioredis
- **Logging**: Winston + Loki
- **Tracing**: OpenTelemetry + Jaeger
- **Auth**: JWT (passport) + OAuth2 social login
- **Encryption**: AES-256-GCM at rest
- **Infrastructure**: Docker, Docker Compose

## Project Structure

```
backend-template/
├── main/                          # Main NestJS monolith
│   └── src/
│       ├── auth/                  # JWT auth + social login
│       ├── users/                 # User management
│       ├── social-auth/           # OAuth2 providers (6)
│       ├── cipher/                # AES-256-GCM encryption
│       ├── websocket/             # Analytics WebSocket
│       ├── cache/                 # Redis cache layer
│       ├── audit/                 # DB audit trail
│       ├── grpc/                  # gRPC server/client
│       ├── activity-log/          # Activity logging
│       ├── common/                # Guards, decorators, filters
│       └── prisma/                # Schema and migrations
├── microservices/                 # Independent services
├── infrastructure/deploy/         # Deployment configs
├── skills/                        # AI agent skills (13 domains)
└── docs/                          # Documentation

## Available Skills (./skills/)

Invoke via: read `skills/<name>.skill.md`

- `error-analysis.skill.md`  — Stack trace parsing, root cause detection
- `security.skill.md`        — Input sanitization, secret detection, anomaly detection
- `observability.skill.md`   — Metrics, logging, tracing, dashboards
- `diagnostics.skill.md`     — System diagnostics and health
- `prisma-debug.skill.md`    — Prisma query optimization, N+1 detection
- `performance.skill.md`     — Performance profiling and optimization
- `docker-ops.skill.md`      — Docker operations and management
- `queue-management.skill.md` — Queue monitoring and management
- `incident-response.skill.md` — Incident lifecycle management
- `auto-recovery.skill.md`    — Automated system recovery
- `reporting.skill.md`       — Report generation
- `analytics.skill.md`       — Analytics and metrics
- `tracing.skill.md`          — Distributed tracing

## Security Rules

- Never commit `.env` files or real secrets
- Never use `any` type — prefer proper types
- Never suppress type errors with `@ts-ignore` or `@ts-expect-error`
- Always validate inputs with class-validator DTOs
- Always use JWT guards for authenticated endpoints
- Hash passwords with bcrypt (salt rounds >= 10)
- Encrypt sensitive fields at rest with CipherService
- Rotate refresh tokens; watch for token theft signals
- Log security events via ActivityLogService

## Code Style

- NestJS module structure with clear separation (controller, service, module)
- Prisma for all database access — no raw SQL
- DTOs with class-validator decorators for all inputs
- Services throw NestJS HTTP exceptions (NotFoundException, etc.)
- Guards for auth, decorators for metadata
- Global ValidationPipe with whitelist + forbidNonWhitelisted
```
