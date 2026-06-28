# Backend Template - API Reference

## Base URL

- Docker: `http://backend-main:3000/api/v1`
- Local: `http://localhost:3010/api/v1`
- Frontend proxy: `/api/v1`

## Authentication

### POST /auth/register

**Body:** `{ email: string, password: string, name: string }`
**Response:** `{ data: { accessToken, refreshToken, user: { id, email, name, role, isActive, createdAt } } }`

### POST /auth/login

**Body:** `{ email: string, password: string }`
**Response:** Same as register

### POST /auth/refresh

**Body:** `{ refreshToken: string }`
**Response:** `{ data: { accessToken } }`

### POST /auth/logout

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { message: "Logged out successfully" } }`

### GET /auth/profile

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { id, email, name, role, isActive, createdAt, updatedAt } }`

## Users

### GET /users

**Headers:** `Authorization: Bearer <token>`
**Query:** `?page=1&limit=10`
**Response:** `{ data: { items: User[], total, page, limit } }`

### GET /users/:id

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: User }`

### PATCH /users/:id

**Headers:** `Authorization: Bearer <token>`
**Body:** `{ email?, name?, role?, isActive? }`
**Response:** `{ data: User }`

### DELETE /users/:id

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { message: "User deleted successfully" } }`

### PATCH /users/:id/active

**Headers:** `Authorization: Bearer <token>`
**Body:** `{ isActive: boolean }`
**Response:** `{ data: User }`

## Activity Logs

### GET /activity-log

**Headers:** `Authorization: Bearer <token>`
**Query:** `?page=1&limit=20&severity=INFO|WARNING|ERROR|CRITICAL&type=&action=`
**Response:** `{ data: { items: ActivityLog[], total, page, limit } }`

### GET /activity-log/:id

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: ActivityLog }`

### GET /activity-log/stats

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { total, bySeverity, byType, byDay } }`

### GET /activity-log/critical

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: ActivityLog[] }`

### POST /activity-log/export

**Headers:** `Authorization: Bearer <token>`
**Body:** `{ format: "csv" | "json", filters? }`
**Response:** File download

## Analytics

### GET /analytics/overview

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { totalUsers, activeUsers, totalRequests, errorRate, avgResponseTime, requestsPerMinute } }`

### GET /analytics/usage

**Headers:** `Authorization: Bearer <token>`
**Query:** `?period=day|week|month`
**Response:** `{ data: { chart: [{ date, requests, errors }], topEndpoints, topUsers } }`

### GET /analytics/errors

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { total, byType, recent: [{ type, count, lastSeen }] } }`

### GET /analytics/performance

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { avgLatency, p50, p95, p99, byEndpoint } }`

## Reports

### GET /reports

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: Report[] }`

### POST /reports/generate

**Headers:** `Authorization: Bearer <token>`
**Body:** `{ type: "daily" | "weekly" | "monthly" | "custom", dateRange? }`
**Response:** `{ data: { message: "Report generated", report: Report } }`

### GET /reports/:filename

**Headers:** `Authorization: Bearer <token>`
**Response:** File download

## Health

### GET /health

**Response:** `{ data: { status: "ok", info, error, details } }`

## Ops

### GET /ops

**Headers:** `Authorization: Bearer <token>`
**Response:** `{ data: { uptime, memory: { rss, heapUsed, heapTotal }, cpu: { usage } } }`

## Metrics

### GET /metrics

**Headers:** `Authorization: Bearer <token>` (protected)
**Response:** Prometheus metrics (text/plain)

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER' | 'MODERATOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string;
  userId: string | null;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  action: string;
  resource: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string | null;
  createdAt: string;
}
```

### Report

```typescript
interface Report {
  id: string;
  filename: string;
  type: string;
  createdAt: string;
}
```
