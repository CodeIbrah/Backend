# Arquitectura de Seguridad — Backend Template

## 1. Principios de Seguridad

El sistema sigue el modelo **Zero Trust** y las mejores prácticas OWASP:

```
+------------------------------------------------------------------+
|                    PRINCIPIOS DE SEGURIDAD                        |
|                                                                   |
|  Principio              │ Descripción                            |
| ─────────────────────── │ ─────────────────────────────────────── |
|  Defense in Depth       │ Múltiples capas de seguridad           |
|  Least Privilege        │ Mínimos permisos necesarios            |
|  Fail Secure            │ Por defecto, denegar acceso            |
|  Secure by Default      │ Configuraciones seguras por defecto    |
|  Never Trust, Verify    │ Validar cada request, incluso internos |
|  Encrypt Everything     │ Datos en tránsito (TLS) y en reposo   |
|  Audit Everything       │ Registrar toda acción relevante        |
|  Input Validation       │ Validar, sanear y escapar toda entrada |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 2. Autenticación JWT

### 2.1 Flujo Completo de Autenticación

```
+-----------+              +-----------+              +-----------+
|  Client   |              |   API     |              |   Auth    |
+-----------+              +-----------+              +-----------+
      |                         |                         |
      |  POST /api/auth/login   |                         |
      |  { email, password }    |                         |
      |────────────────────────▶|                         |
      |                         |  LocalStrategy          |
      |                         |────────────────────────▶|
      |                         |  validate()             |
      |                         |  findByEmail()          |
      |                         |  bcrypt.compare()       |
      |                         |◀────────────────────────|
      |                         |                         |
      |  200 {                  |  Sign JWT (HMAC-SHA256) |
      |    accessToken,         |  Payload: { sub, role } |
      |    refreshToken,        |  exp: 15min             |
      |    expiresIn            |                         |
      |  }                      |                         |
      |◀────────────────────────|                         |
      |                         |                         |
      |  GET /api/users         |                         |
      |  Authorization:         |                         |
      |  Bearer <accessToken>   |                         |
      |────────────────────────▶|                         |
      |                         |  JwtStrategy            |
      |                         |  1. Extraer token       |
      |                         |  2. Verificar firma     |
      |                         |  3. Verificar exp       |
      |                         |  4. Buscar usuario      |
      |                         |  5. Verificar isActive  |
      |                         |                         |
      |  200 { users: [...] }   |                         |
      |◀────────────────────────|                         |
```

### 2.2 Configuración de Tokens

```typescript
// main/src/auth/auth.module.ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m') },
  }),
  inject: [ConfigService],
})
```

**Parámetros de tokens:**

| Parámetro               | Access Token        | Refresh Token          |
| ----------------------- | ------------------- | ---------------------- |
| **Duración**            | 15 minutos          | 30 días                |
| **Almacenamiento**      | Cliente (memoria)   | DB (`refresh_tokens`)  |
| **Rotación**            | —                   | Sí, familia de tokens  |
| **Revocación**          | No (stateless)      | Sí, en base de datos   |
| **Firma**               | HMAC-SHA256         | HMAC-SHA256            |
| **Payload**             | sub, role, iat, exp | tokenHash, userId, exp |

### 2.3 Validación de JWT en Gateway

```typescript
// middleware/auth.middleware.ts (Express)
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      statusCode: 401,
      message: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    const message = err instanceof jwt.TokenExpiredError
      ? 'Token expired'
      : 'Invalid token';
    res.status(401).json({ statusCode: 401, message });
  }
};
```

### 2.4 Validación de JWT en NestJS

```typescript
// main/src/auth/strategies/jwt.strategy.ts
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

### 2.5 Validación en Producción (AppConfigModule)

El módulo de configuración valida que JWT_SECRET cumpla los requisitos
mínimos en producción:

```typescript
// main/src/config/app.config.ts
onModuleInit(): void {
  if (nodeEnv === 'production') {
    if (DEFAULT_SECRETS.includes(jwtSecret?.toLowerCase() || '')) {
      throw new Error(
        'CRITICAL: JWT_SECRET is set to a default value in production.',
      );
    }

    if ((jwtSecret?.length || 0) < 32) {
      throw new Error(
        'CRITICAL: JWT_SECRET must be at least 32 characters in production.',
      );
    }
  }
}
```

---

## 3. Autorización RBAC

### 3.1 Roles del Sistema

```
+------------------------------------------------------------------+
|                      MATRIZ DE PERMISOS                          |
|                                                                   |
|  Recurso              │ ADMIN  │ MODERATOR │ USER  │ Público    |
| ───────────────────── │ ────── │ ───────── │ ───── │ ────────── |
|  GET /products        │   ✅   │    ✅     │  ✅   │    ✅     |
|  POST /products       │   ✅   │    ✅     │  ❌   │    ❌     |
|  PATCH /products/:id  │   ✅   │    ✅     │  ❌   │    ❌     |
|  DELETE /products/:id │   ✅   │    ❌     │  ❌   │    ❌     |
|  GET /users           │   ✅   │    ❌     │  ❌   │    ❌     |
|  GET /users/:id       │   ✅   │    ❌     │  ❌   │    ❌     |
|  PATCH /users/:id     │   ✅   │    ❌     │  ❌   │    ❌     |
|  DELETE /users/:id    │   ✅   │    ❌     │  ❌   │    ❌     |
|  PATCH /users/:id/toggle│ ✅   │    ❌     │  ❌   │    ❌     |
|  POST /orders         │   ✅   │    ✅     │  ✅   │    ❌     |
|  GET /audit-logs      │   ✅   │    ❌     │  ❌   │    ❌     |
|  GET /reports         │   ✅   │    ❌     │  ❌   │    ❌     |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.2 Implementación de Guards RBAC

```typescript
// main/src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

```typescript
// Uso en controladores
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['ADMIN'])
@Get()
async findAll() { ... }
```

---

## 4. Pipeline de Validación de Entradas

```
+------------------------------------------------------------------+
|                    PIPELINE DE VALIDACIÓN                         |
|                                                                   |
|  Request HTTP                                                     |
|       │                                                           |
|       ▼                                                           |
|  +---------------------------+                                    |
|  | 1. Parsing (body, params) |                                    |
|  +---------------------------+                                    |
|       │                                                           |
|       ▼                                                           |
|  +---------------------------+                                    |
|  | 2. Schema Validation      |  ← Zod / Joi / class-validator   |
|  |    - Tipos correctos      |                                    |
|  |    - Rangos válidos       |                                    |
|  |    - Formato esperado     |                                    |
|  |    - Sanitización         |                                    |
|  +---------------------------+                                    |
|       │                                                           |
|       ▼                                                           |
|  +---------------------------+                                    |
|  | 3. Business Validation    |  ← Lógica de negocio             |
|  |    - Existencia de recurso|                                    |
|  |    - Permisos             |                                    |
|  |    - Estado válido        |                                    |
|  |    - Restricciones        |                                    |
|  +---------------------------+                                    |
|       │                                                           |
|       ▼                                                           |
|  +---------------------------+                                    |
|  | 4. ORM (Prisma)           |  ← Type-safe queries             |
|  |    - Prepared statements  |                                    |
|  |    - Escape automático    |                                    |
|  |    - SQL injection safe   |                                    |
|  +---------------------------+                                    |
|       │                                                           |
|       ▼                                                           |
|  +---------------------------+                                    |
|  | 5. Response Formatting    |                                    |
|  +---------------------------+                                    |
|       │                                                           |
|       ▼                                                           |
|  Response HTTP                                                    |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.1 Validación con Zod

```typescript
// microservices/payment-service/src/validators/payment.validator.ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive().max(999999.99),
  currency: z.enum(['USD', 'EUR', 'GBP', 'MXN']).default('USD'),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CRYPTO', 'WALLET']),
  idempotencyKey: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
```

### 4.2 Validación con Joi (Config)

```typescript
// main/src/config/app.config.ts
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  ENCRYPTION_KEY: Joi.string().min(0).default(''),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
```

### 4.3 Validación con class-validator (NestJS)

```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
```

---

## 5. Helmet, CORS y Rate Limiting

### 5.1 Helmet (Seguridad de Headers HTTP)

Helmet configura headers de seguridad HTTP para proteger contra
ataques comunes (XSS, clickjacking, MIME sniffing, etc.):

```typescript
// Express — microservicios
import helmet from 'helmet';
app.use(helmet());

// NestJS — monolito
import helmet from 'helmet';
app.use(helmet());
```

**Headers configurados por Helmet:**

| Header                          | Valor por defecto                     |
| ------------------------------- | ------------------------------------- |
| `Content-Security-Policy`      | `default-src 'self'`                 |
| `X-Content-Type-Options`       | `nosniff`                             |
| `X-Frame-Options`              | `SAMEORIGIN`                          |
| `X-XSS-Protection`             | `0` (deshabilitado en navegadores)   |
| `Strict-Transport-Security`    | `max-age=15552000; includeSubDomains` |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`     |
| `Permissions-Policy`           | `geolocation=(), microphone=()`      |

### 5.2 CORS (Cross-Origin Resource Sharing)

```typescript
// NestJS — main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24h — cache de preflight
});

// Express — microservicios
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));
```

### 5.3 Rate Limiting

```typescript
// NestJS — ThrottlerModule con Redis
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

```typescript
// Express — express-rate-limit
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
  },
});

app.use(limiter);
```

---

## 6. Cifrado de Datos

### 6.1 Cifrado en Tránsito (TLS)

Todas las comunicaciones externas usan TLS 1.3:

```
+-----------+                   +-----------+                   +-----------+
|  Client   |  HTTPS (TLS 1.3)  |  Gateway  |  HTTP (internal)  |  Service  |
|           |──────────────────▶|           |──────────────────▶|           |
|           |◀──────────────────|           |◀──────────────────|           |
+-----------+                   +-----------+                   +-----------+

  Configuración TLS:
  - TLS 1.3 mínimo (TLS 1.2 como fallback)
  - Cipher suites: ECDHE-ECDSA-AES256-GCM, ECDHE-RSA-AES256-GCM
  - HSTS: max-age=15552000; includeSubDomains
  - Certificados: Let's Encrypt (Auto-renewal)
```

### 6.2 Cifrado en Reposo (AES-256-GCM)

Campos sensibles cifrados con AES-256-GCM mediante CipherModule:

```typescript
// main/src/cipher/cipher.service.ts
@Injectable()
export class CipherService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly ivLength = 16;

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
    this.key = crypto.scryptSync(keyHex, 'salt', 32);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

**Campos cifrados:**

| Tabla               | Campo cifrado      | Algoritmo   |
| ------------------- | ------------------ | ----------- |
| `social_accounts`   | `accessToken`      | AES-256-GCM |
| `social_accounts`   | `refreshToken`     | AES-256-GCM |
| `users`             | `password`         | bcrypt      |

> Nota: `password` usa bcrypt (hash one-way), no AES. Los tokens OAuth
> se cifran con AES-256-GCM porque necesitan ser descifrados para renovación.

### 6.3 Hash de Contraseñas (bcrypt)

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## 7. Gestión de API Keys

### 7.1 Política de API Keys

```
+------------------------------------------------------------------+
|                    POLÍTICA DE API KEYS                           |
|                                                                   |
|  Aspecto              │ Valor                                    |
| ───────────────────── │ ───────────────────────────────────────── |
|  Longitud mínima      │ 32 caracteres                            |
|  Formato              │ bk_<prefix>_<random-64-chars-hex>        |
|  Almacenamiento       │ Hash SHA-256 en DB (nunca texto plano)   |
|  Rotación             │ Cada 90 días                             |
|  Máximo por usuario   │ 5 keys activas                           |
|  Permisos             │ Scope-based (read, write, admin)          |
|  Estado               │ active, expired, revoked                  |
|                                                                   |
+------------------------------------------------------------------+
```

### 7.2 Implementación de API Key Middleware

```typescript
// microservices/payment-service/src/middlewares/auth.middleware.ts
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      statusCode: 401,
      message: 'API key required',
    });
    return;
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const storedKey = await prisma.apiKey.findUnique({ where: { keyHash } });

  if (!storedKey || storedKey.status !== 'active') {
    res.status(401).json({
      statusCode: 401,
      message: 'Invalid or revoked API key',
    });
    return;
  }

  req.apiKey = storedKey;
  next();
};
```

---

## 8. Webhooks y Verificación de Firmas

### 8.1 Verificación de Webhooks Stripe

```typescript
// microservices/payment-service/src/services/stripe.service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function verifyWebhook(
  payload: Buffer,
  signature: string,
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${(err as Error).message}`);
  }
}
```

### 8.2 Verificación de Webhooks Salientes

```typescript
// main/src/reports/report.webhook.ts
import crypto from 'crypto';

export function signWebhookPayload(
  payload: Record<string, unknown>,
  secret: string,
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  return `t=${timestamp},s=${signature}`;
}
```

---

## 9. Seguridad de Infraestructura

### 9.1 Firewall de Red

```
+------------------------------------------------------------------+
|                    REGLAS DE FIREWALL                             |
|                                                                   |
|  Origen        │ Destino        │ Puerto │ Protocolo │ Permitido │
| ────────────── │ ────────────── │ ────── │ ───────── │ ───────── │
|  Internet      │ Gateway        │ 443    │ TCP       │ ✅       │
|  Gateway       │ Monolith       │ 3000   │ TCP       │ ✅       │
|  Gateway       │ Microservices  │ 4001+  │ TCP       │ ✅       │
|  Servicios     │ PostgreSQL     │ 5432   │ TCP       │ ✅       │
|  Servicios     │ Redis          │ 6379   │ TCP       │ ✅       │
|  Monolith      │ MinIO          │ 9000   │ TCP       │ ✅       │
|  Monolith      │ Prometheus     │ 9090   │ TCP       │ ✅       │
|  Internet      │ Cualquiera     │ *      │ *         │ ❌       │
|                                                                   |
+------------------------------------------------------------------+
```

### 9.2 Seguridad de Contenedores

```dockerfile
# Dockerfile — Buena práctica de seguridad
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++

FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

USER appuser

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 10. Auditoría y Logging de Seguridad

### 10.1 Eventos de Seguridad Auditados

| Evento                    | Descripción                          | Retención |
| ------------------------- | ------------------------------------ | --------- |
| `LOGIN`                   | Inicio de sesión exitoso             | 1 año     |
| `LOGIN_FAILED`            | Intento fallido de autenticación     | 1 año     |
| `LOGOUT`                  | Cierre de sesión                     | 90 días   |
| `ROLE_CHANGED`            | Cambio de rol de usuario             | 1 año     |
| `PASSWORD_CHANGED`        | Cambio de contraseña                 | 1 año     |
| `PERMISSION_GRANTED`      | Concesión de permiso                 | 1 año     |
| `PERMISSION_REVOKED`      | Revocación de permiso                | 1 año     |
| `API_KEY_CREATED`         | Creación de API key                  | 1 año     |
| `API_KEY_REVOKED`         | Revocación de API key                | 1 año     |
| `AUDIT_ENABLED_CHANGED`   | Cambio en configuración de auditoría | 1 año     |
| `CONFIG_CHANGED`          | Cambio en configuración del sistema  | 1 año     |
| `DATA_EXPORTED`           | Exportación de datos sensibles       | 1 año     |
| `SYSTEM_ALERT`            | Alerta de seguridad del sistema      | 90 días   |

### 10.2 Implementación de Audit Log

```typescript
// main/src/audit/audit.service.ts
@Injectable()
export class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: `${entry.entity}:${entry.entityId || '*'}`,
        details: entry.diff || entry.metadata,
        ipAddress: entry.ipAddress,
      },
    });
  }
}
```

---

## 11. Checklist de Seguridad

### 11.1 Pre-Despliegue

```
[ ] JWT_SECRET: ≥ 32 caracteres, aleatorio (openssl rand -hex 32)
[ ] ENCRYPTION_KEY: ≥ 32 caracteres
[ ] TLS habilitado en todos los endpoints externos
[ ] CORS restringido a dominios conocidos
[ ] Rate limiting configurado (100 req/min por defecto)
[ ] Helmet configurado con CSP restrictiva
[ ] Base de datos con contraseña fuerte
[ ] Redis con contraseña (requirepass)
[ ] Auditoría habilitada (AUDIT_ENABLED=true)
[ ] Logs de error no exponen datos sensibles
[ ] Validación de entrada activa en todos los endpoints
[ ] Pruebas de penetración realizadas
```

### 11.2 Monitoreo Continuo

```
[ ] Monitoreo de intentos de autenticación fallidos
[ ] Alertas por rate limiting excedido
[ ] Detección de patrones de ataque (OWASP)
[ ] Rotación de API keys cada 90 días
[ ] Revisión de logs de auditoría
[ ] Escaneo de vulnerabilidades (semanal)
[ ] Actualización de dependencias (npm audit, Dependabot)
[ ] Revisión de permisos de usuarios
```
