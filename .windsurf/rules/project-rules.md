# backend-template — Windsurf Rules

## Stack
NestJS + Express | TypeScript 5.4 | PostgreSQL 16 + Prisma | Redis 7 | Winston + Loki | OpenTelemetry + Jaeger

## Structure
- `main/` — NestJS monolith (auth, users, social-auth, cipher, websocket, cache, audit, grpc)
- `skills/` — 13 AI agent skills
- `infrastructure/deploy/` — deployment configs

## Auth Flow
- JWT access token (7d) + refresh token (30d)
- Refresh tokens: SHA-256 hash stored in `refresh_tokens` table, rotated on use
- Token theft: reused revoked tokens revoke ALL sessions
- Social login: 6 OAuth2 providers (Google, Meta, Microsoft, GitHub, GitLab, Apple)
- Passwords: bcrypt with 10 salt rounds

## API Routes
- `/api/v1/auth/*` — register, login, refresh, logout, profile
- `/api/v1/auth/social/*` — social login
- `/api/v1/users/*` — user management (admin for write, self for read)

## Key Files
- `main/src/app.module.ts` — module registry
- `main/src/main.ts` — bootstrap (helmet, cors, csrf, validation)
- `main/src/prisma/schema.prisma` — database schema
- `main/src/config/app.config.ts` — env validation + startup checks

## Skills (./skills/)
Load by reading: `skills/<name>.skill.md`
- error-analysis | security | observability | diagnostics | prisma-debug
- performance | docker-ops | queue-management | incident-response
- auto-recovery | reporting | analytics | tracing
