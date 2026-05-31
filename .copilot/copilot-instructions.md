# backend-template — GitHub Copilot Instructions

## Project Context
Enterprise-ready backend with NestJS monolith + microservices. PostgreSQL via Prisma, Redis cache, JWT auth with OAuth2 social login, AES-256-GCM encryption.

## Code Generation Rules

### TypeScript / NestJS
- Use strict TypeScript with proper types — never `any` or `@ts-ignore`
- DTOs must have class-validator decorators: `@IsString()`, `@IsEmail()`, `@IsNotEmpty()`, `@MaxLength(255)`
- Services must throw NestJS HTTP exceptions (NotFoundException, ConflictException, etc.)
- All auth endpoints need `@UseGuards(JwtAuthGuard)` — admin endpoints add `@Roles('ADMIN')` + `RolesGuard`
- Prisma for all DB access — never raw SQL or query builders
- Use `@CurrentUser()` decorator to extract authenticated user in controllers

### Security
- Never log passwords, tokens, or secrets
- Never commit .env files
- Validate all inputs via DTOs
- Encrypt sensitive fields with CipherService (AES-256-GCM)

### Skills Available (./skills/)
Reference these for domain-specific code:
- `error-analysis.skill.md` — Error handling patterns
- `security.skill.md` — Security best practices
- `prisma-debug.skill.md` — Prisma query optimization
- `performance.skill.md` — Performance patterns
- `observability.skill.md` — Logging and metrics
