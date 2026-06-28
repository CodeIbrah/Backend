# backend-template — OpenCode Project Rules

## Identity

Este proyecto es un backend enterprise-ready con NestJS monolith + microservices.

## Stack

NestJS + Express | TypeScript 5.4 | PostgreSQL 16 + Prisma | Redis 7 | Docker

## Módulos Principales (main/src/)

- `auth/` — JWT auth con refresh token rotation + detección de robo
- `social-auth/` — OAuth2 login (Google, Meta, Microsoft, GitHub, GitLab, Apple)
- `cipher/` — Cifrado AES-256-GCM en reposo
- `users/` — CRUD de usuarios con paginación
- `websocket/` — WebSocket analytics broadcasting
- `cache/` — Redis cache layer (getOrSet, invalidatePattern)
- `audit/` — Database audit trail
- `grpc/` — gRPC server/client template
- `activity-log/` — Activity logging
- `common/` — Guards (JwtAuthGuard, RolesGuard), decorators, filters, interceptors
- `config/` — Joi env validation + startup security checks

## Security

- JWT access token (7d) + refresh (30d) con rotación + hash SHA-256 en DB
- Token theft: refresh reusado revoca TODAS las sesiones del usuario
- User.isActive verificado en cada request
- DTOs con class-validator (@IsString, @IsEmail, @IsNotEmpty, @MaxLength)
- bcrypt(10) para passwords
- AES-256-GCM para datos sensibles en reposo
- CORS default: http://localhost:3000 (multi-origin por comma)

## Skills (./skills/)

13 skills disponibles para tareas específicas. Cargar con read:

- error-analysis.skill.md — Análisis de errores y causa raíz
- security.skill.md — Auditoría de seguridad y detección de secretos
- observability.skill.md — Métricas, logs y tracing
- diagnostics.skill.md — Diagnóstico del sistema
- prisma-debug.skill.md — Optimización de queries Prisma
- performance.skill.md — Perfilamiento de rendimiento
- docker-ops.skill.md — Operaciones Docker
- queue-management.skill.md — Gestión de colas
- incident-response.skill.md — Manejo de incidentes
- auto-recovery.skill.md — Recuperación automática
- reporting.skill.md — Generación de reportes
- analytics.skill.md — Analítica y métricas
- tracing.skill.md — Tracing distribuido
