export const ARCHITECTURE_EXTENDED_MD = `# Hybrid Architecture

## System Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "API Gateway"
        GW[main.ts<br/>CORS + Rate Limit + CSP + Compression]
    end
    subgraph "Monolith NestJS"
        AUTH[Auth Module<br/>JWT + bcrypt + OAuth2]
        USERS[Users Module]
        AL[Activity Log Module]
        HEALTH[Health Module]
        OPS[Ops Dashboard]
        METRICS[Prometheus Metrics]
        CACHE[Cache Module<br/>Redis + LRU]
        QUEUE[Queue Module<br/>BullMQ]
        WS[WebSocket Module<br/>Socket.IO]
        GRPC[gRPC Module]
        AUDIT[Audit Module]
        TELE[Telemetry<br/>OpenTelemetry]
    end
    subgraph "Microservices Express"
        MAUTH[auth-service<br/>Token Verification]
        MUSERS[users-service]
        MPAY[payment-service<br/>Stripe Integration]
        MINV[invoice-service]
        MNOTIF[notifications-service]
        MMAIL[mail-service]
        MSMS[sms-service]
    end
    subgraph "Shared Infrastructure"
        PSQL[(PostgreSQL)]
        REDIS[(Redis)]
        MQ[BullMQ Queues]
        PROM[Prometheus]
        GRAF[Grafana]
        LOKI[Loki]
        JAEGER[Jaeger]
    end
    GW --> AUTH & USERS & AL & HEALTH & OPS & METRICS
    AUTH --> MAUTH
    USERS --> MUSERS
    AL --> PSQL
    OPS --> REDIS & MQ
    MPAY --> PSQL
    MINV --> PSQL
    MNOTIF --> MQ
\`\`\`

## Three Layer Architecture

### Layer 1: API Gateway

Configured in \`main.ts\`, the gateway applies globally:

- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **CORS**: Allowed origins via \`CORS_ORIGIN\` env variable
- **Compression**: gzip/brotli on all responses
- **Body size limit**: 1MB max to prevent DoS attacks
- **Global prefix**: All routes use \`/api/v1\` prefix

### Layer 2: Monolith NestJS (Core + Supporting)

| Module | Controller | Base Route | Description |
|--------|-----------|-----------|-------------|
| Auth | \`AuthController\` | \`/api/v1/auth\` | Registration, login, JWT, OAuth2 |
| Users | \`UsersController\` | \`/api/v1/users\` | CRUD users (admin) |
| Activity Log | \`ActivityLogController\` | \`/api/v1/activity-log\` | Audit and activity tracking |
| Health | \`HealthController\` | \`/api/v1/health\` | Health checks + K8s probes |
| Ops | \`OpsController\` | \`/api/v1/ops\` | Operations dashboard |
| Metrics | \`MetricsController\` | \`/api/v1/metrics\` | Prometheus endpoint |
| Cache | \`CacheModule\` | Internal | Redis + LRU 2-tier caching |
| Queue | \`QueueModule\` | Internal | BullMQ job processing |
| WebSocket | \`WebSocketModule\` | \`/ws\` | Socket.IO real-time |
| gRPC | \`gRPCModule\` | Internal | Inter-service low-latency communication |
| Audit | \`AuditModule\` | Internal | Audit trail and compliance |

### Layer 3: Microservices (Express)

| Service | Port | Purpose |
|---------|------|---------|
| auth-service | 3001 | Token verification, permission checks |
| users-service | 3002 | User CRUD operations |
| payment-service | 3003 | Stripe payments, refunds, webhooks |
| invoice-service | 3004 | Invoice generation, receipts |
| notifications-service | 3005 | Push, email, and SMS notifications |
| mail-service | 3006 | Email sending (SMTP, SendGrid) |
| sms-service | 3007 | SMS sending (Twilio) |

## Request Flow

1. Client sends HTTP request
2. Gateway applies security headers, CORS, compression, rate limiting
3. If monolith route, NestJS routes to the appropriate controller
4. Guards verify JWT and roles (if applicable)
5. ValidationPipe transforms and validates DTOs
6. Controller executes business logic through service
7. Service may call microservices (REST) or enqueue jobs (BullMQ)
8. Response passes through TransformInterceptor and LoggingInterceptor
9. Response returned to client with security headers

## Communication Patterns

| Pattern | Protocol | Use Case | Latency |
|---------|----------|----------|---------|
| REST sync | HTTP/2 | Service-to-service calls | Low |
| BullMQ async | Redis | Background jobs, notifications | Medium |
| WebSocket real-time | Socket.IO | Live dashboards, push events | Instant |
| gRPC | HTTP/2 | Inter-service low-latency | Very Low |
`;

export const DATABASE_MD = `# Database Schema

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    User ||--o{ SocialAccount : has
    User ||--o{ RefreshToken : has
    User ||--o{ ActivityLog : generates
    User ||--o{ Payment : makes
    Payment ||--|| Invoice : generates
    Payment ||--|| Receipt : generates
\`\`\`

## Tables

### User

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| email | String | Unique, Not Null | User email address |
| name | String | Not Null | Display name |
| password | String | Not Null | bcrypt hashed password |
| role | Enum (USER, ADMIN) | Default: USER | Access level |
| isActive | Boolean | Default: true | Account status |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

### SocialAccount

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| userId | String | FK -> User.id | Owner |
| provider | String | Not Null | OAuth provider (google, github) |
| providerId | String | Not Null | External account ID |
| createdAt | DateTime | Auto | Creation timestamp |

### RefreshToken

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| userId | String | FK -> User.id | Token owner |
| token | String | Unique, Not Null | JWT refresh token |
| expiresAt | DateTime | Not Null | Expiration timestamp |
| createdAt | DateTime | Auto | Creation timestamp |

### ActivityLog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| userId | String | FK -> User.id (nullable) | Actor |
| type | Enum | Not Null | LOGIN, LOGOUT, PAYMENT, etc. |
| severity | Enum (INFO, WARNING, ERROR, CRITICAL) | Default: INFO | Severity level |
| action | String | Not Null | Action name |
| resource | String | Not Null | API endpoint |
| description | Text | Not Null | Human-readable description |
| ipAddress | String | Nullable | Origin IP |
| metadata | JSON | Nullable | Additional context |
| createdAt | DateTime | Auto | Creation timestamp |

### Payment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| userId | String | FK -> User.id | Payer |
| amount | Decimal | Not Null | Payment amount |
| currency | String | Default: USD | Currency code |
| status | Enum | Not Null | PENDING, COMPLETED, FAILED, REFUNDED |
| stripePaymentId | String | Unique (nullable) | Stripe reference |
| createdAt | DateTime | Auto | Creation timestamp |

### Invoice

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| paymentId | String | FK -> Payment.id | Related payment |
| invoiceNumber | String | Unique, Not Null | Human-readable invoice ID |
| amount | Decimal | Not Null | Total amount |
| tax | Decimal | Not Null | Tax amount |
| total | Decimal | Not Null | Amount + tax |
| status | Enum | Not Null | DRAFT, SENT, PAID, CANCELLED |
| pdfUrl | String | Nullable | Generated PDF URL |
| createdAt | DateTime | Auto | Creation timestamp |

### Receipt

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PK | Unique identifier |
| paymentId | String | FK -> Payment.id | Related payment |
| receiptNumber | String | Unique, Not Null | Human-readable receipt ID |
| amount | Decimal | Not Null | Amount paid |
| pdfUrl | String | Nullable | Generated PDF URL |
| sentAt | DateTime | Auto | Email sent timestamp |
| createdAt | DateTime | Auto | Creation timestamp |

## Prisma ORM Configuration

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}
\`\`\`

- **Connection pooling**: Prisma manages a connection pool to PostgreSQL (default: 10 connections)
- **Migrations**: Managed via \`prisma migrate\` with full history in \`prisma/migrations/\`
- **Client generation**: \`prisma generate\` produces type-safe client

## Redis Usage

| Use | Strategy | Description |
|-----|----------|-------------|
| Cache | 2-tier (Redis + LRU) | API response caching with local in-memory fallback |
| BullMQ backend | Redis lists + streams | Job queue persistence and scheduling |
| Session store | Redis key-value | Refresh token blacklist and session management |

## Indexes

- User: unique index on \`email\`, index on \`role\`
- ActivityLog: composite index on \`(userId, createdAt)\`, index on \`type\`, index on \`severity\`
- Payment: index on \`userId\`, index on \`status\`
- RefreshToken: unique index on \`token\`, index on \`userId\`

## Constraints

- Cascade deletes: User -> SocialAccount, RefreshToken (ON DELETE CASCADE)
- Soft relationship: ActivityLog.userId is nullable (system actions)
- Unique constraints: email, refresh token, invoice number, receipt number
`;

export const API_CONVENTIONS_MD = `# API Design Conventions

## RESTful Principles

All endpoints follow RESTful resource naming conventions:

| Principle | Convention | Example |
|-----------|-----------|---------|
| Resource names | Plural nouns | \`/users\`, \`/payments\` |
| Hierarchy | Nested for sub-resources | \`/users/:id/orders\` |
| Actions | HTTP methods | GET (read), POST (create), PATCH (update), DELETE (remove) |
| Versioning | URI prefix | \`/api/v1/*\` |
| Filters | Query parameters | \`?status=active&role=ADMIN\` |
| Pagination | Query parameters | \`?page=1&limit=10\` |

## Authentication

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

- All protected endpoints require a valid JWT in the \`Authorization\` header
- Tokens are issued after successful login or registration
- Access tokens expire after 15 minutes
- Refresh tokens expire after 30 days

## Pagination

### Request

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| \`page\` | integer | 1 | Page number (min: 1) |
| \`limit\` | integer | 10-20 | Items per page (max: 100) |

### Response

\`\`\`json
{
  "data": [],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
\`\`\`

## Error Format

All errors follow a consistent structure:

\`\`\`json
{
  "statusCode": 400,
  "message": "Description of the error",
  "error": "Bad Request",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
\`\`\`

Validation errors return per-field messages as an array:

\`\`\`json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
\`\`\`

## Standard Headers

| Header | When | Description |
|--------|------|-------------|
| \`Content-Type\` | All requests | \`application/json\` for API calls |
| \`Authorization\` | Protected routes | \`Bearer <token>\` for JWT auth |
| \`X-Correlation-Id\` | All requests | Correlation ID for distributed tracing |
| \`Accept\` | All requests | \`application/json\` |

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation failure, malformed input |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient role permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate email, conflicting state |
| 413 | Payload Too Large | Body exceeds 1MB limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Base URL

All endpoints are prefixed with:

\`\`\`
/api/v1/
\`\`\`

In development: \`http://localhost:3000/api/v1/*\`
In production: \`https://api.example.com/api/v1/*\`
`;

export const OBSERVABILITY_MD = `# Observability Setup

## Three Pillars

\`\`\`mermaid
graph LR
    APP["Application"] --> LOG["Winston Logs"]
    APP --> MET["Prometheus Metrics"]
    APP --> TRC["OpenTelemetry Traces"]
    LOG --> LOKI["Loki"]
    MET --> PROM["Prometheus"]
    TRC --> JAEGER["Jaeger"]
    LOKI --> GRAF["Grafana"]
    PROM --> GRAF
    JAEGER --> GRAF
\`\`\`

## Logging (Winston -> Loki -> Grafana)

Structured JSON logging with Winston. Logs are shipped to Loki for aggregation and queried via Grafana.

### Log Format

\`\`\`json
{
  "timestamp": "2026-07-04T12:00:00.123Z",
  "level": "error",
  "message": "Database connection timeout",
  "correlationId": "corr-abc-123",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "service": "order-service",
  "context": {
    "userId": "user-456",
    "endpoint": "POST /api/orders",
    "duration": 30000
  }
}
\`\`\`

### Log Levels

| Level | Priority | Usage |
|-------|----------|-------|
| error | 0 | Runtime errors, exceptions, failures |
| warn | 1 | Deprecations, high latency, retries |
| info | 2 | Business events, state changes |
| http | 3 | HTTP request/response logging |
| debug | 4 | Development diagnostics (disabled in production) |

## Metrics (Prometheus)

### Default Metrics

| Metric | Type | Description |
|--------|------|-------------|
| \`process_cpu_user_seconds_total\` | Counter | CPU time spent in user space |
| \`process_resident_memory_bytes\` | Gauge | RSS memory usage |
| \`http_requests_total\` | Counter | Total HTTP requests by method, route, status |
| \`http_request_duration_seconds\` | Histogram | Request latency distribution |
| \`http_errors_total\` | Counter | Error count by status code |

### Custom Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| \`db_query_duration_seconds\` | Histogram | query, table | Database query latency |
| \`cache_hit_ratio\` | Gauge | cache | Redis + LRU cache hit ratio |
| \`queue_jobs_total\` | Counter | queue, status | BullMQ job counts |
| \`active_connections\` | Gauge | database | Active DB connections |

## Tracing (OpenTelemetry -> Jaeger)

Distributed tracing across all services using OpenTelemetry SDK.

### Trace Context Propagation

\`\`\`
Client Request
     |
     | X-Correlation-ID: corr-abc-123
     v
API Gateway            traceId: t1, spanId: s1
     |
     | REST call
     v
User Service           traceId: t1, spanId: s2
     |
     | Database query
     v
PostgreSQL             traceId: t1, spanId: s3
\`\`\`

### Spans

Each service operation creates spans that include:

- **Span name**: Operation name (e.g., \`POST /api/users\`)
- **Attributes**: HTTP method, URL, status code, user ID
- **Events**: Error messages, log entries
- **Status**: OK, ERROR, or UNSET

## Correlation ID Propagation

A \`correlationId\` is generated for every incoming request and propagated:

1. Client sends \`X-Correlation-Id\` header (optional; generated if missing)
2. All logs include \`correlationId\` for request-level aggregation
3. Metrics include \`correlationId\` as a label
4. Traces carry \`correlationId\` as a span attribute
5. Downstream microservices receive it via HTTP headers

This enables full request tracing across the entire system.

## Grafana Dashboards

| Dashboard | Description | Panels |
|-----------|-------------|--------|
| System Health | Overall system status | CPU, Memory, Uptime, Error rate |
| API Performance | HTTP traffic analysis | Requests/sec, Latency p50/p95/p99, Status codes |
| Errors | Error tracking | Error rate, Top errors, Stack traces |
| Database | DB performance | Query latency, Connection pool, Slow queries |
| Queue | Job queue monitoring | Queue depth, Processing time, Failure rate |
`;

export const BEST_PRACTICES_MD = `# Development Best Practices

## TypeScript

- **Strict mode**: \`strict: true\` in tsconfig
- **No \`any\`**: Use proper types, generics, or \`unknown\` with type guards
- **Interfaces over types**: Prefer \`interface\` for object shapes, \`type\` for unions/intersections
- **Explicit returns**: Always annotate function return types
- **Imports**: Use barrel files (\`index.ts\`) for clean module exports
- **No \`@ts-ignore\`**: Never suppress TypeScript errors

## NestJS Architecture

- **Modular design**: Each domain has its own module with controller, service, and DTOs
- **Dependency injection**: Use constructor injection with \`@Injectable()\` decorators
- **Single responsibility**: Each class has one clear purpose
- **DTOs**: Use classes with \`class-validator\` decorators for validation
- **Guards**: Auth and role guards are reusable and composable

\`\`\`typescript
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
\`\`\`

## Error Handling

- **Typed exceptions**: Use NestJS built-in \`HttpException\` subclasses (\`BadRequestException\`, \`NotFoundException\`, etc.)
- **Exception filters**: Global exception filter catches unhandled errors
- **Business logic errors**: Use domain-specific error codes

\`\`\`typescript
if (!user) {
  throw new NotFoundException(\`User #\${id} not found\`);
}
\`\`\`

## Validation

- **class-validator**: DTO validation with decorators (\`@IsEmail()\`, \`@MinLength(8)\`, etc.)
- **Zod**: Runtime validation for complex nested objects
- **ValidationPipe**: Global pipe transforms and validates all inputs
- **Sanitization**: Strip unknown properties from DTOs

## Database

- **N+1 prevention**: Use Prisma \`include\` or \`select\` to eager-load relations
- **Connection pooling**: Prisma automatically manages pool; configure \`connectionLimit\` in datasource URL
- **Query optimization**: Use indexes, avoid SELECT \*, limit result sets
- **Transactions**: Use Prisma \`$transaction\` for atomic operations
- **Migrations**: Always use \`prisma migrate dev\` for schema changes

\`\`\`typescript
const user = await prisma.user.findUnique({
  where: { id },
  include: { payments: true },
});
\`\`\`

## Security

- **Helmet**: Enables security headers (CSP, HSTS, X-Frame-Options)
- **CORS**: Restrict origins to known domains
- **Rate limiting**: 3-tier protection against abuse
- **Input validation**: Never trust user input; validate everything
- **SQL injection**: Prevented by Prisma parameterized queries
- **XSS**: CSP headers + output encoding
- **CSRF**: Token-based protection in production

## Code Quality

- **Linting**: ESLint with strict rules
- **Formatting**: Prettier with consistent config
- **Testing**: Unit tests for services, e2e for endpoints
- **Documentation**: JSDoc for public APIs, README for modules
- **Naming**: camelCase for variables/functions, PascalCase for classes/types, kebab-case for files

\`\`\`typescript
// services/user.service.ts
export class UsersService {
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    // implementation
  }
}
\`\`\`
`;

export const MICROSERVICES_MD = `# Microservices Reference

## Service Overview

| Service | Port | Technology | Database | Purpose |
|---------|------|------------|----------|---------|
| auth-service | 3001 | Express + JWT | Redis | Token verification, permission checks |
| users-service | 3002 | Express | PostgreSQL | User CRUD, profile management |
| payment-service | 3003 | Express + Stripe | PostgreSQL | Payment processing, refunds, webhooks |
| invoice-service | 3004 | Express | PostgreSQL | Invoice generation, PDF, receipts |
| notifications-service | 3005 | Express | BullMQ/Redis | Push, email, and SMS dispatch |
| mail-service | 3006 | Express + Nodemailer | - | Email sending via SMTP/SendGrid |
| sms-service | 3007 | Express + Twilio | - | SMS sending and delivery tracking |

## Communication Architecture

\`\`\`mermaid
graph LR
    MONO["NestJS Monolith"] -->|REST :3001| AUTH["auth-service"]
    MONO -->|REST :3002| USERS["users-service"]
    MONO -->|REST :3003| PAY["payment-service"]
    MONO -->|REST :3004| INV["invoice-service"]
    MONO -->|BullMQ| NOTIF["notifications-service"]
    NOTIF -->|REST :3006| MAIL["mail-service"]
    NOTIF -->|REST :3007| SMS["sms-service"]
    PAY -->|Webhook| STRIPE["Stripe API"]
    INV -->|Generate PDF| PDF["PDF Generator"]
\`\`\`

## Service Details

### auth-service (:3001)

Handles JWT token verification and permission resolution.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/auth/verify\` | POST | Verify JWT token, return decoded payload |
| \`/api/auth/permissions\` | GET | Get permissions for authenticated user |
| \`/api/auth/roles\` | GET | List all roles and their permissions |

**Flow**: Monolith AuthModule delegates token verification to auth-service for distributed systems. The service checks token signature, expiry, and blacklist status in Redis.

### users-service (:3002)

Independent user management service.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/users\` | GET | List users with pagination |
| \`/api/users/:id\` | GET | Get user by ID |
| \`/api/users\` | POST | Create user |
| \`/api/users/:id\` | PATCH | Update user |
| \`/api/users/:id\` | DELETE | Delete user |

**Flow**: User CRUD operations can be routed to either the NestJS monolith or this microservice depending on deployment configuration.

### payment-service (:3003)

Handles all payment operations via Stripe.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/payments\` | POST | Create payment intent |
| \`/api/payments/:id\` | GET | Get payment details |
| \`/api/payments/:id/confirm\` | POST | Confirm payment |
| \`/api/payments/:id/refund\` | POST | Process refund |
| \`/api/payments/webhook\` | POST | Stripe webhook handler |

**Flow**: Monolith delegates payment creation to payment-service. The service interacts with Stripe API, stores records in its own PostgreSQL, and emits events via BullMQ for invoice generation.

### invoice-service (:3004)

Generates invoices and receipts for completed payments.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/invoices\` | GET | List invoices |
| \`/api/invoices/:id\` | GET | Get invoice details |
| \`/api/invoices/:id/pdf\` | GET | Download invoice PDF |
| \`/api/invoices/from-payment/:paymentId\` | POST | Generate invoice from payment |

**Flow**: Triggered by BullMQ after payment completion. Generates PDF, stores invoice record, and triggers email dispatch via notifications-service.

### notifications-service (:3005)

Orchestrates push, email, and SMS notifications.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/notifications\` | GET | List notification history |
| \`/api/notifications/send\` | POST | Queue a notification |
| \`/api/notifications/preferences\` | GET | Get user notification preferences |

**Flow**: Receives notification requests via BullMQ queue. Routes to mail-service for emails and sms-service for SMS. Stores delivery status and retries on failure.

### mail-service (:3006)

Dedicated email sending service.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/mail/send\` | POST | Send email |
| \`/api/mail/templates\` | GET | List available email templates |

**Flow**: Accepts email requests from notifications-service. Uses Nodemailer with SMTP or SendGrid. Supports HTML templates with dynamic variables.

### sms-service (:3007)

SMS sending via Twilio.

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/api/sms/send\` | POST | Send SMS message |
| \`/api/sms/status\` | GET | Check message delivery status |

**Flow**: Accepts SMS requests from notifications-service. Sends via Twilio API and tracks delivery status.

## Data Flow Between Services

\`\`\`
Payment Request Flow:

Client -> NestJS Monolith -> payment-service (REST :3003)
  payment-service -> Stripe API (create payment intent)
  payment-service -> PostgreSQL (store payment)
  payment-service -> BullMQ (emit "payment.completed" event)
nofications-service (BullMQ consumer)
  -> invoice-service (generate invoice PDF)
  -> mail-service (send invoice email)
  -> sms-service (send payment confirmation SMS)
\`\`\`
`;
