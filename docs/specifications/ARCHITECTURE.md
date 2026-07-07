# Arquitectura del Sistema — Backend Template

## 1. Visión General

El **Backend Template** implementa una arquitectura híbrida que combina un monolito
NestJS rico en funcionalidades con microservicios Express independientes. Este
enfoque permite centralizar la lógica de negocio principal en el monolito mientras
se delegan tareas específicas (notificaciones, pagos, autenticación) a servicios
desacoplados que pueden escalar y desplegarse de forma independiente.

```
+-------------------------------------------------------------------------------+
|                        ARQUITECTURA HÍBRIDA                                   |
+-------------------------------------------------------------------------------+
|                                                                               |
|  +-------------------------------------------------------------------+       |
|  |                          API GATEWAY                              |       |
|  |  => Enrutamiento, autenticación, rate limiting, transformación    |       |
|  |  => Validación JWT, CORS, compresión, logging centralizado        |       |
|  +-------------------------------------------------------------------+       |
|            |                    |                    |                         |
|            ▼                    ▼                    ▼                         |
|  +--------------------+  +--------------------+  +--------------------+       |
|  |     MONOLITO       |  |   MICROSERVICIOS   |  |   INFRAESTRUCTURA  |       |
|  |     (NestJS)       |  |     (Express)      |  |    COMPARTIDA      |       |
|  +--------------------+  +--------------------+  +--------------------+       |
|  | Core Domain:      |  | auth-service       |  | PostgreSQL         |       |
|  | Auth, Users,      |  | payment-service    |  | Redis              |       |
|  | Products, Orders  |  | notifications-svc  |  | BullMQ (colas)     |       |
|  |                   |  | users-service      |  | OpenTelemetry      |       |
|  | Supporting:       |  | mail-service       |  | Prometheus/Grafana |       |
|  | Logging,Telemetry |  | sms-service        |  | Loki/Jaeger        |       |
|  | Cache, Reports,   |  | invoice-service    |  | MinIO (S3)         |       |
|  | WebSocket, gRPC   |  +--------------------+  +--------------------+       |
|  | Audit, Activity   |                                                 |       |
|  +--------------------+                                                 |       |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 2. Monolito Principal (NestJS)

El monolito centraliza la lógica de negocio principal y los servicios
transversales del sistema. Está construido con NestJS, un framework progresivo
de Node.js que utiliza TypeScript y patrones de arquitectura modular.

### 2.1 Servicios de Dominio Central

```
+------------------------------------------------------------------+
|                   CORE DOMAIN SERVICES                           |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |   Auth Module     |  |   Users Module    |                    |
|  |  - Login/Register |  |  - CRUD usuarios  |                    |
|  |  - JWT + Refresh  |  |  - Roles y perfiles|                    |
|  |  - Social Auth    |  |  - Estado activo   |                    |
|  |  - Local Strategy  |  |  - Gestión cuenta |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Products Module  |  |   Orders Module   |                    |
|  |  - Catálogo       |  |  - Creación pedido|                    |
|  |  - Inventario     |  |  - Estado entrega |                    |
|  |  - Precios        |  |  - Historial      |                    |
|  |  - Categorías     |  |  - Facturación    |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
+------------------------------------------------------------------+
```

**Auth Module** es el módulo de autenticación central. Implementa:

- **LocalStrategy**: Validación de credenciales email + password con
  `passport-local`. Verifica el hash bcrypt contra la base de datos.
- **JwtStrategy**: Extrae y valida tokens JWT del header `Authorization:
  Bearer <token>`. Verifica la firma HMAC-SHA256 y el estado activo del
  usuario en cada request.
- **SocialAuthModule**: OAuth2 delegado para 6 proveedores (Google, Meta,
  Microsoft, GitHub, GitLab, Apple). Cada proveedor se auto-configura desde
  variables de entorno y solo se registra si tiene credenciales válidas.
- **RefreshToken**: Rotación de tokens con familia de refresh tokens
  almacenados en la tabla `refresh_tokens` con hash SHA-256.

```typescript
// Ejemplo: Estrategia JWT (main/src/auth/strategies/jwt.strategy.ts)
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true, role: true },
    });
    if (!user?.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return { id: user.id, role: user.role, roles: [user.role] };
  }
}
```

### 2.2 Servicios de Soporte

```
+------------------------------------------------------------------+
|                    SUPPORTING SERVICES                            |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Logging Module   |  |  Telemetry Module |                    |
|  |  - Winston        |  |  - OpenTelemetry  |                    |
|  |  - Loki transport |  |  - Jaeger export  |                    |
|  |  - Log levels     |  |  - Spans y traces |                    |
|  |  - Correlation ID |  |  - Context prop.  |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Cache Module     |  |   Queue Module    |                    |
|  |  - Redis (ioredis)|  |  - BullMQ         |                    |
|  |  - TTL por clave  |  |  - Job scheduling |                    |
|  |  - Invalidación   |  |  - Retry/backoff  |                    |
|  |  - Patrones cache |  |  - Colas múltiples|                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Reports Module   |  |  Activity Module  |                    |
|  |  - Reportes auto  |  |  - ActivityLog   |                    |
|  |  - Markdown/HTML  |  |  - Audit trail   |                    |
|  |  - Distribución   |  |  - Analytics     |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  WebSocket Module |  |   gRPC Module     |                    |
|  |  - Socket.IO      |  |  - Server/client  |                    |
|  |  - Eventos real   |  |  - Protobuf       |                    |
|  |  - Salas/notif.   |  |  - Baja latencia  |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.3 Configuración del Módulo Principal (AppModule)

El módulo raíz (`main/src/app.module.ts`) orquesta todos los módulos
mediante inyección de dependencias de NestJS:

```typescript
@Module({
  imports: [
    // Core
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TerminusModule,

    // Logging (Winston)
    WinstonModule.forRoot({ ... }),

    // Domain modules
    AuthModule,
    UsersModule,
    LoggingModule,
    ReportsModule,

    // Optional modules
    WebsocketModule,    // Socket.IO
    CacheModule,        // Redis
    AuditModule,        // DB audit trail
    GrpcModule.forRoot(),
    CipherModule,       // AES-256-GCM
    SocialAuthModule,   // 6 providers
    TelemetryModule,     // OpenTelemetry
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
```

---

## 3. Microservicios (Express)

Los microservicios se construyen con Express.js y siguen una estructura
consistente: enrutador -> controlador -> servicio -> middleware. Se comunican
con el monolito y entre sí a través de REST síncrono y colas BullMQ asíncronas.

### 3.1 Catálogo de Microservicios

```
+------------------------------------------------------------------+
|                     INDEPENDENT MICROSERVICES                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Auth Service     |  |  Payment Service  |                    |
|  |  - Express server |  |  - Stripe/PayPal  |                    |
|  |  - JWT emisión    |  |  - Idempotencia   |                    |
|  |  - Refresh tokens |  |  - Facturas/Recibos|                    |
|  |  - Rate limiting  |  |  - Webhooks       |                    |
|  |  Puerto: 4001     |  |  - Ledger contable|                    |
|  |                   |  |  Puerto: 4003     |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Notifications    |  |  Users Service   |                    |
|  |  Service          |  |  - Express server |                    |
|  |  - Email (Nodemail)|  |  - CRUD perfiles  |                    |
|  |  - SMS (Twilio)   |  |  - Búsqueda       |                    |
|  |  - Push (FCM)     |  |  - Paginación     |                    |
|  |  - Templates      |  |  - Puerto: 4004   |                    |
|  |  - Puerto: 4002   |  |                   |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
|  +-------------------+  +-------------------+                    |
|  |  Mail Service     |  |  SMS Service     |                    |
|  |  - Nodemailer     |  |  - Twilio        |                    |
|  |  - Templates HTML |  |  - Proveedores   |                    |
|  |  - Adjuntos       |  |  - Puerto: 4006  |                    |
|  |  - Puerto: 4005   |  |                   |                    |
|  +-------------------+  +-------------------+                    |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.2 Estructura Interna de un Microservicio

Cada microservicio sigue una plantilla consistente:

```
microservices/<service>/
+-- src/
|   +-- index.ts              # Punto de entrada (Express app)
|   +-- controllers/          # Manejadores HTTP
|   +-- services/             # Lógica de negocio
|   +-- middlewares/
|   |   +-- auth.middleware.ts   # Validación JWT
|   |   +-- error.middleware.ts  # Error handler global
|   +-- validators/           # Esquemas de validación
|   +-- routes/               # Definición de rutas Express
|   +-- telemetry/            # OpenTelemetry tracing
|   +-- logging/              # Winston logger
|   +-- utils/                # Utilidades (response helper, etc.)
+-- package.json
+-- tsconfig.json
+-- Dockerfile
```

### 3.3 Ejemplo: Auth Service (Express)

```typescript
// microservices/auth-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRoutes } from './routes/auth.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { morganMiddleware } from './logging/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morganMiddleware);

app.use('/api/auth', authRoutes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
```

---

## 4. API Gateway

El API Gateway es el punto único de entrada que maneja el enrutamiento,
autenticación, rate limiting, y transformación de respuestas. Opera como una
capa intermedia entre los clientes externos y los servicios internos.

```
+------------------------------------------------------------------+
|                        API GATEWAY                                |
|                                                                   |
|  Client Request                                                    |
|       |                                                           |
|       ▼                                                           |
|  +-----------+   +-----------+   +-----------+   +-----------+    |
|  | TLS       |▶️ | Rate     |▶️ | JWT      |▶️ | Router   |    |
|  | Term.     |   | Limiter  |   | Validate |   |          |    |
|  +-----------+   +-----------+   +-----------+   +-----------+    |
|                                                      |           |
|           +------------------------------------------+-------+   |
|           |                  |                  |           |   |
|           ▼                  ▼                  ▼           |   |
|     +-----------+     +-----------+     +-----------+      |   |
|     | Monolith  |     | Auth MS  |     | Payment  |      |   |
|     | /api/*    |     | /auth/*  |     | /pay/*   |      |   |
|     +-----------+     +-----------+     +-----------+      |   |
|           |                  |                  |           |   |
|           +------------------+------------------+-----------+   |
|                              |                                   |
|                              ▼                                   |
|                        +-----------+                             |
|                        | Response  |                             |
|                        | Transform |                             |
|                        +-----------+                             |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.1 Patrones de Comunicación

| Patrón               | Protocolo     | Uso                                | Caso de uso                |
| -------------------- | ------------ | ---------------------------------- | -------------------------- |
| **REST síncrono**    | HTTP/HTTPS   | Llamadas directas entre servicios  | CRUD, consultas inmediatas |
| **Colas BullMQ**     | Redis        | Trabajos asíncronos                | Envío emails, webhooks     |
| **Eventos**          | Redis Pub/Sub| Notificaciones en tiempo real      | Invalidación caché, alerts |
| **WebSocket**        | Socket.IO    | Streaming bidireccional            | Notificaciones UI, logs    |
| **gRPC**             | HTTP/2       | Comunicación interna baja latencia | Servicios internos         |
| **OpenTelemetry**    | OTLP/gRPC    | Trazabilidad distribuida           | Tracing cross-service      |

### 4.2 Ejemplo: Enrutamiento en Gateway

```typescript
// gateway/src/routes.ts
const routes = [
  { path: '/api/auth',       target: 'http://monolith:3000/auth' },
  { path: '/api/users',      target: 'http://monolith:3000/users' },
  { path: '/api/products',   target: 'http://monolith:3000/products' },
  { path: '/api/orders',     target: 'http://monolith:3000/orders' },
  { path: '/api/payments',   target: 'http://payment-svc:4003' },
  { path: '/api/notifications', target: 'http://notifications-svc:4002' },
  { path: '/api/inventory',  target: 'http://inventory-svc:4007' },
];
```

---

## 5. Stack Tecnológico

### 5.1 Tecnologías Principales

| Componente          | Tecnología                      | Propósito                              |
| ------------------- | ------------------------------- | -------------------------------------- |
| **Monolito**        | NestJS + TypeScript             | Framework backend modular              |
| **Microservicios**  | Express.js + TypeScript         | Servicios ligeros desacoplados         |
| **ORM**             | Prisma                          | Modelado y acceso a datos              |
| **Base de datos**   | PostgreSQL 15                   | Base de datos relacional principal     |
| **Cache**           | Redis 7                         | Caché distribuido, sesiones, rate limit|
| **Colas**           | BullMQ                          | Procesamiento asíncrono de trabajos    |
| **Logging**         | Winston + Loki                  | Logs estructurados y agregados         |
| **Tracing**         | OpenTelemetry + Jaeger          | Trazabilidad distribuida               |
| **Métricas**        | Prometheus + Grafana            | Monitoreo y dashboards                 |
| **Autenticación**   | JWT (HMAC-SHA256) + Passport    | Auth stateless con refresh tokens      |
| **WebSocket**       | Socket.IO                       | Eventos en tiempo real                 |
| **gRPC**            | @nestjs/microservices           | Comunicación interna eficiente         |
| **Cifrado**         | AES-256-GCM                     | Cifrado de campos sensibles            |

### 5.2 Diagrama de Infraestructura

```
+------------------------------------------------------------------+
|                    INFRAESTRUCTURA COMPLETA                       |
|                                                                   |
|  +----------------------------+  +----------------------------+   |
|  |        NODE.js APPS        |  |         INFRA DB           |   |
|  |                            |  |                            |   |
|  |  +----------------------+  |  |  +----------------------+  |   |
|  |  | API Gateway (NestJS) |  |  |  | PostgreSQL (Prisma) |  |   |
|  |  | Puerto: 443 (TLS)    |  |  |  | Pool: 20 conexiones |  |   |
|  |  +----------------------+  |  |  | SSL/TLS en prod     |  |   |
|  |                            |  |  +----------------------+  |   |
|  |  +----------------------+  |  |                            |   |
|  |  | Monolith (NestJS)    |  |  |  +----------------------+  |   |
|  |  | Puerto: 3000         |  |  |  | Redis 7              |  |   |
|  |  +----------------------+  |  |  | - Cache              |  |   |
|  |                            |  |  | - BullMQ queues      |  |   |
|  |  +----------------------+  |  |  | - Rate limit store   |  |   |
|  |  | Auth MS (Express)    |  |  |  | - Session store      |  |   |
|  |  | Puerto: 4001         |  |  |  +----------------------+  |   |
|  |  +----------------------+  |  |                            |   |
|  |                            |  |  +----------------------+  |   |
|  |  +----------------------+  |  |  | MinIO (S3-compat)   |  |   |
|  |  | Payment MS (Express)  |  |  |  | - Reportes PDF     |  |   |
|  |  | Puerto: 4003         |  |  |  | - Archivos         |  |   |
|  |  +----------------------+  |  |  | - Backups          |  |   |
|  |                            |  |  +----------------------+  |   |
|  |  +----------------------+  |  +----------------------------+   |
|  |  | Notifications MS     |  |                                |
|  |  | (Express) Puerto:4002|  |  +----------------------------+   |
|  |  +----------------------+  |  |      OBSERVABILITY          |   |
|  |                            |  |  +----------------------+  |   |
|  |  +----------------------+  |  |  | Prometheus           |  |   |
|  |  | Users MS (Express)   |  |  |  | Métricas cada 10s   |  |   |
|  |  | Puerto: 4004         |  |  |  +----------------------+  |   |
|  |  +----------------------+  |  |                            |   |
|  |                            |  |  +----------------------+  |   |
|  |  +----------------------+  |  |  | Grafana              |  |   |
|  |  | Mail MS (Express)    |  |  |  | Dashboards          |  |   |
|  |  | Puerto: 4005         |  |  |  +----------------------+  |   |
|  |  +----------------------+  |  |                            |   |
|  |                            |  |  +----------------------+  |   |
|  |  +----------------------+  |  |  | Loki (logs)         |  |   |
|  |  | SMS MS (Express)     |  |  |  | + Jaeger (traces)  |  |   |
|  |  | Puerto: 4006         |  |  |  +----------------------+  |   |
|  |  +----------------------+  |  +----------------------------+   |
|  +----------------------------+                                |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 6. Flujo de Datos Transaccional

### 6.1 Creación de Pedido (Flujo Completo)

```
Cliente                  API Gateway            Monolito              Microservicios
   |                         |                    |                        |
   |  POST /api/orders       |                    |                        |
   |────────────────────────▶|  Validar JWT      |                        |
   |                         |───────▶           |                        |
   |                         |     Verificar     |                        |
   |                         |     usuario/stock |                        |
   |                         |◀───────           |                        |
   |                         |  Encolar pago     |                        |
   |                         |───────────────────|──── BullMQ ──────────▶ |
   |                         |                    |     Payment MS        |
   |  201 Created            |                    |    Procesar pago      |
   |◀────────────────────────|                    |    Enviar email       │
   |                         |                    |    (Mail MS)          │
   |                         |                    |    Notificar (WS)     │
```

### 6.2 Flujo de Autenticación

```
+-----------+     +-----------+     +-----------+     +-----------+
|  Client   |     |   Auth    |     |    JWT    |     |   Users   |
|           |     | Controller|     |  Strategy |     |  Service  |
+-----------+     +-----------+     +-----------+     +-----------+
      |                |                  |                |
      | POST /login    |                  |                |
      | email+password |                  |                |
      |───────────────▶|                  |                |
      |                | LocalStrategy    |                |
      |                | validate()       |                |
      |                |─────────────────▶|                |
      |                |                  | findByEmail()  |
      |                |                  |───────────────▶|
      |                |                  |◀───────────────|
      |                |  bcrypt.compare  |                |
      |                |◀─────────────────|                |
      |                |                  |                |
      |  { accessToken |  Sign JWT +      |                |
      |    refreshToken|  Store refresh   |                |
      |    user }      |  token hash      |                |
      |◀───────────────|                  |                |
      |                |                  |                |
```

---

## 7. Patrones de Diseño Clave

### 7.1 Inyección de Dependencias (NestJS)

NestJS utiliza un contenedor IoC (Inversión de Control) que resuelve
automáticamente las dependencias declaradas en los constructores:

```typescript
// El contenedor resuelve PrismaService automáticamente
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Optional() private cacheService?: CacheService,
  ) {}
}
```

### 7.2 Middleware Pipeline (Express)

```typescript
// microservices/<service>/src/index.ts
app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 60000, max: 100 }));
app.use(authenticate);
app.use('/api', routes);
app.use(errorMiddleware);
```

### 7.3 Manejo Global de Excepciones

```typescript
// main/src/common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      message: exception instanceof HttpException
        ? exception.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 8. Observabilidad

### 8.1 Trazabilidad Distribuida (OpenTelemetry)

Todas las solicitudes fluyen con un `correlationId` único que se propaga
a través de todos los servicios, logs y trazas:

```
Header: X-Correlation-ID: corr-abc-123

Monolith                   Auth MS                 Payment MS
  traceId: abc              traceId: abc             traceId: abc
  spanId: span1             spanId: span2            spanId: span3
  corrId: corr-abc-123      corrId: corr-abc-123     corrId: corr-abc-123
       |                        |                         |
       ▼                        ▼                         ▼
  Winston Log              Winston Log               Winston Log
  Loki                     Loki                      Loki
```

### 8.2 Exportación de Métricas

```typescript
// main/src/telemetry/telemetry.service.ts
const meter = metrics.getMeter('backend-template');
const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total HTTP requests',
});

// Incrementa por endpoint y status
requestCounter.add(1, {
  method: 'GET',
  route: '/api/users',
  status: '200',
});
```

---

## 9. Estrategias de Despliegue

| Estrategia            | Componente          | Escalado       | Despliegue         |
| --------------------- | ------------------- | -------------- | ------------------ |
| **Monolito**          | NestJS App          | Vertical       | Docker / VM        |
| **Microservicios**    | Express Apps        | Horizontal     | K8s / Docker Swarm |
| **Base de datos**     | PostgreSQL          | Read replicas  | RDS / Cloud SQL    |
| **Cache**             | Redis Cluster       | Horizontal     | ElastiCache / Self |
| **Colas**             | BullMQ + Redis      | Worker pools   | K8s Jobs           |
| **Frontend**          | SPA / Mobile        | CDN + Static   | Vercel / Netlify   |

---

## 10. Resumen de Puertos y Servicios

| Servicio              | Puerto | Protocolo | Tipo                |
| --------------------- | ------ | --------- | ------------------- |
| API Gateway           | 443    | HTTPS     | Proxy inverso       |
| Monolito (NestJS)     | 3000   | HTTP      | REST + WebSocket    |
| Auth Service          | 4001   | HTTP      | REST                |
| Notifications Service | 4002   | HTTP      | REST                |
| Payment Service       | 4003   | HTTP      | REST                |
| Users Service         | 4004   | HTTP      | REST                |
| Mail Service          | 4005   | HTTP      | REST                |
| SMS Service           | 4006   | HTTP      | REST                |
| Invoice Service       | 4007   | HTTP      | REST                |
| PostgreSQL            | 5432   | TCP       | Base de datos       |
| Redis                 | 6379   | TCP       | Cache + Colas       |
| Prometheus            | 9090   | HTTP      | Métricas            |
| Grafana               | 3001   | HTTP      | Dashboards          |
| Loki                  | 3100   | HTTP      | Logs                |
| Jaeger                | 16686  | HTTP      | Trazas              |
| MinIO                 | 9000   | HTTP      | Object Storage      |
| gRPC                  | 50051  | HTTP/2    | Comunicación interna|
