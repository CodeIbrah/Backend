# Especificaciones de API — Backend Template

## 1. Principios de Diseño

La API sigue los principios **RESTful** con las siguientes convenciones:

```
+------------------------------------------------------------------+
|                    PRINCIPIOS DE DISEÑO REST                      |
|                                                                   |
|  Recurso         │ Método │ Acción     │ Códigos HTTP            |
| ──────────────── │ ────── │ ────────── │ ─────────────────────── |
| /api/users       │ GET    │ Listar     │ 200, 401, 403           |
| /api/users/:id   │ GET    │ Obtener    │ 200, 404, 401, 403     |
| /api/users       │ POST   │ Crear      │ 201, 400, 409, 401     |
| /api/users/:id   │ PATCH  │ Actualizar │ 200, 400, 404, 409     |
| /api/users/:id   │ DELETE │ Eliminar   │ 204, 404, 401, 403     |
|                                                                   |
|  Convenciones:                                                    |
|  - Nombres de recursos en plural                                  |
|  - IDs UUID v4 en path params                                     |
|  - Query params para filtrado y paginación                        |
|  - Versión en prefijo de ruta (/api/v1/*)                         |
|  - Content-Type: application/json                                 |
|  - Autenticación vía Bearer token (JWT)                           |
+------------------------------------------------------------------+
```

---

## 2. Autenticación y Autorización

### 2.1 Flujo JWT

```
+-----------+                    +-----------+                    +-----------+
|  Client   |                    |    API    |                    |   Auth    |
+-----------+                    +-----------+                    +-----------+
      |                               |                               |
      |  POST /api/auth/login         |                               |
      |  { email, password }          |                               |
      |──────────────────────────────▶|                               |
      |                               |  LocalStrategy.validate()     |
      |                               |──────────────────────────────▶|
      |                               |  bcrypt.compare               |
      |                               |◀──────────────────────────────|
      |                               |                               |
      |  200 { accessToken,           |                               |
      |        refreshToken,          |                               |
      |        expiresIn }            |                               |
      |◀──────────────────────────────|                               |
      |                               |                               |
      |  GET /api/users               |                               |
      |  Authorization: Bearer <at>   |                               |
      |──────────────────────────────▶|                               |
      |                               |  JwtStrategy.validate()       |
      |                               |  Extrae payload, verifica     |
      |                               |  sub, role, exp               |
      |                               |                               |
      |  200 { users: [...] }         |                               |
      |◀──────────────────────────────|                               |
```

### 2.2 Formato de Token JWT

```json
{
  "sub": "uuid-del-usuario",
  "role": "ADMIN",
  "iat": 1700000000,
  "exp": 1700000600
}
```

**Header requerido para endpoints protegidos:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 2.3 Refresh Token

| Endpoint                | Descripción                          |
| ----------------------- | ------------------------------------ |
| `POST /api/auth/login`  | Autenticación, devuelve ambos tokens |
| `POST /api/auth/refresh`| Renueva access token con refresh     |
| `POST /api/auth/logout` | Revoca refresh token                 |

```typescript
// Solicitud de refresh
POST /api/auth/refresh
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "refreshToken": "string"
}

// Respuesta exitosa
{
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyBp...",
  "expiresIn": 900
}
```

---

## 3. Rate Limiting

El sistema implementa rate limiting en tres capas:

```
+------------------------------------------------------------------+
|                      RATE LIMITING STACK                          |
|                                                                   |
|  Capa 1: API Gateway (Nginx/Caddy)                                |
|  ├─ Límite global: 1000 req/min por IP                            |
|  ├─ Burst: 50 req/s                                               |
|  └─ Conexiones concurrentes: 100                                  |
|                                                                   |
|  Capa 2: NestJS ThrottlerModule                                   |
|  ├─ Por defecto: 100 req/60s por usuario                          |
|  ├─ Endpoints sensibles (/auth): 20 req/60s                       |
|  └─ Almacenamiento: Redis (ThrottlerStorageRedisService)          |
|                                                                   |
|  Capa 3: Microservicios (express-rate-limit)                      |
|  ├─ 100 req/min por IP                                            |
|  └─ Headers: X-RateLimit-Limit, X-RateLimit-Remaining            |
|                                                                   |
+------------------------------------------------------------------+
```

**Respuesta en caso de límite excedido (HTTP 429):**

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 45,
  "timestamp": "2026-06-29T10:30:00.000Z"
}
```

---

## 4. Formato de Respuestas

### 4.1 Respuesta Exitosa Estandarizada

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-06-29T10:00:00.000Z",
    "requestId": "req-abc-123-def"
  }
}
```

### 4.2 Error Response (RFC 7807 — Problem Details)

Todos los errores siguen el formato **Problem Details**:

```json
{
  "type": "https://api.backend-template.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The request body contains invalid fields",
  "instance": "/api/users",
  "timestamp": "2026-06-29T10:00:00.000Z",
  "requestId": "req-abc-123-def",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "code": "invalid_email"
    },
    {
      "field": "password",
      "message": "Must be at least 8 characters",
      "code": "min_length"
    }
  ]
}
```

### 4.3 Códigos de Error Comunes

| HTTP | Código interno          | Descripción                       |
| ---- | ----------------------- | --------------------------------- |
| 400  | `VALIDATION_ERROR`      | Datos de entrada inválidos        |
| 401  | `UNAUTHORIZED`          | Token ausente, expirado o inválido|
| 403  | `FORBIDDEN`             | Sin permisos para el recurso      |
| 404  | `NOT_FOUND`             | Recurso no encontrado             |
| 409  | `CONFLICT`              | Conflicto (email duplicado, etc.) |
| 422  | `UNPROCESSABLE_ENTITY`  | Entidad no procesable             |
| 429  | `RATE_LIMIT_EXCEEDED`   | Demasiadas solicitudes            |
| 500  | `INTERNAL_ERROR`        | Error interno del servidor        |
| 502  | `BAD_GATEWAY`           | Error en microservicio upstream   |
| 503  | `SERVICE_UNAVAILABLE`   | Servicio temporalmente no disponible|

### 4.4 Implementación del Filtro Global de Excepciones

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      type: `https://api.backend-template.com/errors/${status}`,
      title: this.getTitleForStatus(status),
      status,
      detail: exception instanceof HttpException
        ? exception.message
        : 'An unexpected error occurred',
      instance: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id'] || '',
    };

    response.status(status).json(errorResponse);
  }

  private getTitleForStatus(status: number): string {
    const titles: Record<number, string> = {
      400: 'Validation Error',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return titles[status] || 'Error';
  }
}
```

---

## 5. Paginación, Filtrado y Ordenamiento

### 5.1 Parámetros de Consulta

| Parámetro | Tipo   | Por defecto | Ejemplo                | Descripción                         |
| --------- | ------ | ----------- | ---------------------- | ----------------------------------- |
| `page`    | number | 1           | `?page=2`              | Número de página (1-indexed)        |
| `limit`   | number | 20          | `?limit=50`            | Elementos por página (max 100)      |
| `sort`    | string | `createdAt` | `?sort=name`           | Campo de ordenamiento               |
| `order`   | enum   | `desc`      | `?order=asc`           | Dirección: `asc` o `desc`           |
| `search`  | string | —           | `?search=john`         | Búsqueda textual                    |
| `filter`  | object | —           | `?filter[role]=ADMIN`  | Filtro por campo exacto             |
| `fields`  | string | —           | `?fields=id,name,email`| Selección de campos en respuesta    |
| `from`    | date   | —           | `?from=2026-01-01`     | Filtro por fecha inicial            |
| `to`      | date   | —           | `?to=2026-06-30`       | Filtro por fecha final              |

### 5.2 Formato de Respuesta Paginada

```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### 5.3 Ejemplo de Filtrado Complejo

```
GET /api/users?page=1&limit=10&sort=createdAt&order=desc&filter[role]=ADMIN&search=john
```

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-06-28T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### 5.4 Implementación en NestJS

```typescript
@Get()
@UseGuards(JwtAuthGuard)
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20,
  @Query('sort') sort: string = 'createdAt',
  @Query('order') order: 'asc' | 'desc' = 'desc',
  @Query('filter') filter?: Record<string, string>,
  @Query('search') search?: string,
) {
  return this.usersService.findAll({ page, limit, sort, order, filter, search });
}
```

---

## 6. Versionado de API

### 6.1 Esquema de Versionado

La API utiliza **versionado por prefijo de ruta**:

```
/api/v1/auth/login
/api/v1/users
/api/v1/v2/products
```

**Política de versionado:**

- `v1`: Estable — solo cambios retrocompatibles
- `v2`: En desarrollo — puede romper compatibilidad
- Las versiones antiguas se deprecarán con 6 meses de aviso
- Header de deprecación: `Sunset: Sat, 31 Dec 2027 23:59:59 GMT`

### 6.2 Control de Versiones por Header

Como alternativa al prefijo de ruta, se soporta negociación por header:

```
Accept: application/vnd.backend-template.v1+json
```

---

## 7. WebSocket (Socket.IO)

### 7.1 Eventos Disponibles

```
+------------------------------------------------------------------+
|                    WEBSOCKET EVENTS                               |
|                                                                   |
|  Evento               │ Dirección   │ Descripción                |
| ───────────────────── │ ─────────── │ ────────────────────────── |
| notification          │ Server→Client│ Nueva notificación         |
| incident_update       │ Server→Client│ Cambio en incidente       |
| order_status          │ Server→Client│ Estado de pedido actualizado|
| system_alert          │ Server→Client│ Alerta del sistema        |
| metric_update         │ Server→Client│ Métrica en tiempo real    |
| user_online           │ Bidireccional│ Estado de conexión        |
| subscribe             │ Client→Server│ Suscribirse a sala        |
| unsubscribe           │ Client→Server│ Desuscribirse de sala     |
|                                                                   |
+------------------------------------------------------------------+
```

### 7.2 Autenticación WebSocket

```typescript
// main/src/websocket/websocket.gateway.ts
@WebSocketGateway({
  namespace: '/ws',
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.token
      || client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }
}
```

### 7.3 Sala por Usuario

Cada usuario autenticado se une automáticamente a una sala privada:

```typescript
// Enviar notificación a usuario específico
this.wsGateway.server.to(`user:${userId}`).emit('notification', {
  id: 'notif-uuid',
  title: 'Payment received',
  message: 'Your payment of $49.99 was successful.',
});
```

---

## 8. Listado de Endpoints Comunes

### 8.1 Autenticación (`/api/auth`)

| Método | Ruta              | Auth     | Descripción                    |
| ------ | ----------------- | -------- | ------------------------------ |
| POST   | `/auth/register`  | No       | Registrar nuevo usuario        |
| POST   | `/auth/login`     | No       | Iniciar sesión                 |
| POST   | `/auth/refresh`   | Bearer   | Renovar access token           |
| POST   | `/auth/logout`    | Bearer   | Cerrar sesión (revocar refresh)|
| POST   | `/auth/forgot-password` | No | Solicitar restablecimiento     |
| POST   | `/auth/reset-password` | No | Restablecer contraseña         |
| GET    | `/auth/me`        | Bearer   | Obtener perfil actual          |
| PATCH  | `/auth/me`        | Bearer   | Actualizar perfil actual       |
| PATCH  | `/auth/me/password`| Bearer  | Cambiar contraseña             |

### 8.2 Usuarios (`/api/users`)

| Método | Ruta                | Auth     | Roles       | Descripción             |
| ------ | ------------------- | -------- | ----------- | ----------------------- |
| GET    | `/users`            | Bearer   | ADMIN       | Listar usuarios         |
| GET    | `/users/:id`        | Bearer   | ADMIN/OWNER | Obtener usuario         |
| POST   | `/users`            | Bearer   | ADMIN       | Crear usuario           |
| PATCH  | `/users/:id`        | Bearer   | ADMIN/OWNER | Actualizar usuario      |
| DELETE | `/users/:id`        | Bearer   | ADMIN       | Eliminar usuario        |
| PATCH  | `/users/:id/toggle-active` | Bearer | ADMIN | Activar/desactivar     |
| GET    | `/users/:id/activity`| Bearer  | ADMIN/OWNER | Actividad del usuario   |

### 8.3 Productos (`/api/products`)

| Método | Ruta                    | Auth     | Descripción               |
| ------ | ----------------------- | -------- | ------------------------- |
| GET    | `/products`             | No       | Listar productos          |
| GET    | `/products/:id`         | No       | Obtener producto          |
| POST   | `/products`             | Bearer   | Crear producto (ADMIN)    |
| PATCH  | `/products/:id`         | Bearer   | Actualizar (ADMIN)        |
| DELETE | `/products/:id`         | Bearer   | Eliminar (ADMIN)          |
| GET    | `/products/categories`  | No       | Listar categorías         |
| GET    | `/products/search`      | No       | Búsqueda full-text        |

### 8.4 Pedidos (`/api/orders`)

| Método | Ruta                  | Auth     | Descripción               |
| ------ | --------------------- | -------- | ------------------------- |
| POST   | `/orders`             | Bearer   | Crear pedido              |
| GET    | `/orders`             | Bearer   | Listar mis pedidos        |
| GET    | `/orders/:id`         | Bearer   | Detalle del pedido        |
| PATCH  | `/orders/:id/status`  | Bearer   | Actualizar estado (ADMIN) |
| POST   | `/orders/:id/cancel`  | Bearer   | Cancelar pedido           |

### 8.5 Pagos (`/api/payments`)

| Método | Ruta                      | Auth     | Descripción                |
| ------ | ------------------------- | -------- | -------------------------- |
| POST   | `/payments`               | Bearer   | Crear intención de pago    |
| GET    | `/payments`               | Bearer   | Historial de pagos         |
| GET    | `/payments/:id`           | Bearer   | Detalle del pago           |
| POST   | `/payments/:id/refund`    | Bearer   | Solicitar reembolso        |
| POST   | `/payments/webhook`       | No*      | Webhook Stripe/PayPal      |
| GET    | `/payments/invoices`      | Bearer   | Listar facturas            |
| GET    | `/payments/invoices/:id`  | Bearer   | Descargar factura PDF      |
| GET    | `/payments/receipts/:id`  | Bearer   | Descargar recibo PDF       |

> *Los webhooks se validan mediante firma HMAC, no JWT.

### 8.6 Notificaciones (`/api/notifications`)

| Método | Ruta                        | Auth     | Descripción                |
| ------ | --------------------------- | -------- | -------------------------- |
| GET    | `/notifications`            | Bearer   | Listar notificaciones      |
| GET    | `/notifications/unread-count`| Bearer  | Contador no leídas         |
| PATCH  | `/notifications/:id/read`   | Bearer   | Marcar como leída          |
| PATCH  | `/notifications/read-all`   | Bearer   | Marcar todas como leídas   |
| DELETE | `/notifications/:id`        | Bearer   | Eliminar notificación      |

### 8.7 Sistema y Salud

| Método | Ruta                | Auth     | Descripción                    |
| ------ | ------------------- | -------- | ------------------------------ |
| GET    | `/health`           | No       | Health check del sistema       |
| GET    | `/health/ready`     | No       | Readiness probe                |
| GET    | `/health/live`      | No       | Liveness probe                 |
| GET    | `/metrics`          | Bearer   | Métricas Prometheus            |
| GET    | `/version`          | No       | Versión actual del API         |

### 8.8 Social Auth (`/api/auth/social`)

| Método | Ruta                           | Auth     | Descripción                    |
| ------ | ------------------------------ | -------- | ------------------------------ |
| GET    | `/auth/social/providers`       | No       | Listar proveedores configurados|
| GET    | `/auth/social/:provider/url`   | No       | Obtener URL de OAuth2          |
| GET    | `/auth/social/:provider/callback` | No   | Callback OAuth2                |
| POST   | `/auth/social/link`            | Bearer   | Vincular cuenta social         |
| DELETE | `/auth/social/:provider`       | Bearer   | Desvincular cuenta social      |

### 8.9 Auditoría y Actividad

| Método | Ruta                  | Auth     | Roles     | Descripción                |
| ------ | --------------------- | -------- | --------- | -------------------------- |
| GET    | `/audit-logs`         | Bearer   | ADMIN     | Listar logs de auditoría   |
| GET    | `/activity-log`       | Bearer   | ADMIN     | Listar actividad del sistema|

### 8.10 Reportes

| Método | Ruta                  | Auth     | Roles | Descripción                       |
| ------ | --------------------- | -------- | ----- | --------------------------------- |
| POST   | `/reports/generate`   | Bearer   | ADMIN | Generar reporte bajo demanda      |
| GET    | `/reports`            | Bearer   | ADMIN | Listar reportes generados         |
| GET    | `/reports/:id`        | Bearer   | ADMIN | Descargar reporte                 |

---

## 9. Headers HTTP Estandarizados

| Header               | Tipo     | Descripción                      | Obligatorio |
| -------------------- | -------- | -------------------------------- | ----------- |
| `Authorization`      | Bearer   | Token JWT de acceso              | En protegidos|
| `Content-Type`       | MIME     | `application/json`               | En POST/PATCH|
| `Accept`             | MIME     | `application/json`               | Recomendado |
| `X-Request-ID`       | UUID     | ID de solicitud (idempotencia)   | Recomendado |
| `X-Correlation-ID`   | UUID     | ID de correlación entre servicios| Interno     |
| `X-Idempotency-Key`  | String   | Clave de idempotencia (pagos)    | En pagos    |
| `User-Agent`         | String   | Identificador del cliente        | Recomendado |
| `Accept-Language`    | Locale   | `es`, `en`, `fr`, etc.           | Opcional    |

---

## 10. Idempotencia en Pagos

Los endpoints de pago soportan idempotencia mediante el header
`X-Idempotency-Key`:

```typescript
POST /api/payments
X-Idempotency-Key: unique-key-123
Content-Type: application/json

{
  "amount": 49.99,
  "currency": "USD",
  "method": "CREDIT_CARD"
}
```

- Si se recibe la misma clave en 24h, se devuelve la respuesta cacheada
- Las claves se almacenan en Redis con TTL de 24 horas
- Previene cargos duplicados por reintentos de red
