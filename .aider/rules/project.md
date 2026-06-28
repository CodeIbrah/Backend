# backend-template — Aider Rules

## Stack

NestJS (Express) | TypeScript 5.4 | PostgreSQL 16 + Prisma ORM | Redis 7 | Docker

## Architecture

- `main/` — NestJS monolith with modules: auth, users, social-auth, cipher, websocket, cache, audit, grpc
- `skills/` — 13 domain-specific AI agent skill files
- `infrastructure/deploy/` — deployment configs for Render, AWS, Azure, GCP, Netlify

## Auth

- JWT access token (7d) + refresh token (30d) with rotation
- Refresh tokens: SHA-256 hash stored in refresh_tokens table
- Token theft detection: reused revoked tokens revoke ALL user sessions
- Social login: 6 OAuth2 providers (Google, Meta, Microsoft, GitHub, GitLab, Apple)
- User.isActive verified on EVERY request via JwtStrategy

## Code Conventions

- DTOs: class-validator with @IsString, @IsEmail, @IsNotEmpty, @MaxLength(255)
- Exceptions: NestJS HTTP exceptions (NotFoundException, ConflictException)
- Guards: JwtAuthGuard (auth) + RolesGuard + @Roles('ADMIN') (admin)
- DB: Prisma only — no raw SQL
- Validation: global ValidationPipe(whitelist, forbidNonWhitelisted, transform)
- Encryption: AES-256-GCM via CipherService for sensitive fields at rest

## Skills

Available in ./skills/. Load via: `read skills/<name>.skill.md`
error-analysis | security | observability | diagnostics | prisma-debug | performance
docker-ops | queue-management | incident-response | auto-recovery | reporting | analytics | tracing
