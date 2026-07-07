# Política de Seguridad — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Contacto de seguridad:** security@your-org.com

---

## Índice

1. [Versiones Soportadas](#1-versiones-soportadas)
2. [Reporte de Vulnerabilidades](#2-reporte-de-vulnerabilidades)
3. [Medidas de Seguridad](#3-medidas-de-seguridad)
4. [JWT y Autenticación](#4-jwt-y-autenticación)
5. [Encriptación](#5-encriptación)
6. [Helmet y Headers de Seguridad](#6-helmet-y-headers-de-seguridad)
7. [Rate Limiting](#7-rate-limiting)
8. [Validación de Entrada](#8-validación-de-entrada)
9. [CORS](#9-cors)
10. [Dependencias Seguras](#10-dependencias-seguras)
11. [Gestión de Secretos](#11-gestión-de-secretos)
12. [GDPR y Privacidad](#12-gdpr-y-privacidad)
13. [Seguridad en Base de Datos](#13-seguridad-en-base-de-datos)
14. [Seguridad en Redis](#14-seguridad-en-redis)
15. [Seguridad en BullMQ](#15-seguridad-en-bullmq)
16. [Auditoría y Logging](#16-auditoría-y-logging)

---

## 1. Versiones Soportadas

### 1.1 Matriz de soporte

| Versión | Soportada | Parches de seguridad |
|---------|-----------|----------------------|
| 1.x | ✅ Sí | Recibe parches activamente |
| 0.x | ❌ No | Sin soporte |

### 1.2 Ciclo de vida de versiones

| Fase | Duración | Acciones |
|------|----------|----------|
| **Activa** | 12 meses desde release | Parches de seguridad + features |
| **Mantenimiento** | 6 meses adicionales | Solo parches de seguridad críticos |
| **Fin de vida** | Indefinido | Sin parches. Migrar a versión soportada |

### 1.3 Política de backport

Los parches de seguridad se aplican a:

- **Última versión mayor:** Inmediatamente
- **Versión mayor anterior:** Dentro de 7 días hábiles
- **Versiones anteriores:** Solo bajo acuerdo explícito

---

## 2. Reporte de Vulnerabilidades

### 2.1 Canales de reporte

| Canal | Dirección | Respuesta esperada |
|-------|-----------|-------------------|
| **Correo privado** | `security@your-org.com` | 24-48h |
| **PGP key** | `https://your-org.com/pgp-key.asc` | - |

### 2.2 Información requerida

Al reportar una vulnerabilidad, incluir:

```markdown
## Resumen
[Tipo de vulnerabilidad, impacto potencial]

## Pasos para reproducir
1. [Paso 1]
2. [Paso 2]
3. [Ver exploit]

## Entorno
- Versión del proyecto: [ej. 1.2.3]
- Node.js: [ej. 20.11.0]
- SO: [ej. Ubuntu 22.04]

## PoC / Exploit
[Código o instrucciones para reproducir]

## Impacto estimado
[Qué puede hacer un atacante con esto]

## Mitigación sugerida
[Si aplica]
```

### 2.3 Proceso de respuesta

```
Día 0  ─ Reporte recibido y acuse de recibo
Día 1  ─ Triaje y clasificación de severidad
Día 2  ─ Desarrollo de fix interno
Día 3  ─ Revisión del fix por equipo de seguridad
Día 4  ─ Release del parche (CRITICAL/HIGH)
Día 7  ─ Divulgación pública coordinada
```

### 2.4 Clasificación de severidad

| Severidad | Tiempo de respuesta | Tiempo de fix |
|-----------|---------------------|---------------|
| **CRÍTICA** | 24h | 72h |
| **ALTA** | 48h | 7 días |
| **MEDIA** | 7 días | 30 días |
| **BAJA** | 30 días | 90 días |

### 2.5 Divulgación responsable

- **No** publicar la vulnerabilidad en issues públicos
- **No** explotar la vulnerabilidad en sistemas de producción
- **No** compartir el reporte con terceros no autorizados
- Dar tiempo razonable para la corrección antes de divulgar públicamente

---

## 3. Medidas de Seguridad

### 3.1 Stack de seguridad

| Capa | Medida | Implementación |
|------|--------|----------------|
| **Transporte** | HTTPS/TLS | Certmanager + Let's Encrypt |
| **Headers HTTP** | Helmet | `helmet()` middleware |
| **Autenticación** | JWT + Refresh Tokens | `@nestjs/jwt` |
| **Autorización** | RBAC | Guards + decoradores personalizados |
| **Rate Limiting** | Throttler | `@nestjs/throttler` |
| **Validación** | Zod | ZodValidationPipe global |
| **CORS** | Orígenes permitidos | Configuración explícita |
| **CSRF** | Tokens dobles | (si aplica para cookies) |
| **SQL Injection** | Prisma ORM | Query parametrizadas |
| **XSS** | Helmet + escape | Headers + sanitización |
| **Dependencias** | Dependabot + npm audit | Automatizado |

### 3.2 Configuración de seguridad base

```typescript
// src/main.ts — bootstrap de seguridad
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));

  // CORS
  app.enableCors({
    origin: configService.getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  // Rate limiting global
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation pipe global
  app.useGlobalPipes(new ZodValidationPipe());

  await app.listen(3000);
}
```

---

## 4. JWT y Autenticación

### 4.1 Configuración JWT

```typescript
// src/config/auth.config.ts
@Injectable()
export class AuthConfig {
  // Access token: corto (15 min)
  readonly jwtAccessSecret: string;
  readonly jwtAccessExpiration = '15m';

  // Refresh token: largo (7 días)
  readonly jwtRefreshSecret: string;
  readonly jwtRefreshExpiration = '7d';

  // Algoritmo
  readonly jwtAlgorithm = 'RS256'; // Preferir asimétrico

  // Rotación de refresh tokens
  readonly refreshTokenRotation = true;

  // Rate limit por usuario
  readonly maxLoginAttempts = 5;
  readonly loginLockoutDuration = 15 * 60 * 1000; // 15 min
}
```

### 4.2 Guards de autenticación

```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtPayload>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        'Invalid or expired token',
        'TOKEN_INVALID',
      );
    }
    return user;
  }
}

// src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    // Verificar si el token no está revocado (blacklist en Redis)
    const isRevoked = await this.redis.sismember(
      `blacklist:tokens`,
      user.jti,
    );
    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return requiredRoles.includes(user.role);
  }
}
```

### 4.3 Buenas prácticas JWT

- ✅ Usar RS256 con par de llaves asimétricas
- ✅ Access token de corta duración (15 minutos máximo)
- ✅ Refresh token rotation obligatorio
- ✅ Blacklist de tokens revocados en Redis
- ✅ Incluir `jti` (JWT ID) único para cada token
- ✅ No incluir información sensible en el payload

```typescript
// Payload JWT seguro
interface JwtPayload {
  sub: string;        // ID del usuario
  email: string;      // Solo si es necesario
  role: UserRole;     // Para RBAC
  jti: string;        // JWT ID único
  iat: number;        // Issued at
  exp: number;        // Expiration
  type: 'access' | 'refresh';
}

// ❌ Nunca incluir
// - password
// - ssn / taxId
// - creditCard
// - secretKey
```

---

## 5. Encriptación

### 5.1 En reposo (datos almacenados)

| Dato | Algoritmo | Dónde |
|------|-----------|-------|
| Passwords | `bcrypt` (rounds=12) | BD |
| Tokens de refresh | `SHA-256` hash | BD |
| PII (email, teléfono) | `AES-256-GCM` | BD |
| API Keys de terceros | `AES-256-GCM` | BD / Vault |

```typescript
// src/common/utils/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), tag };
}

export function decrypt(data: { encrypted: string; iv: string; tag: string }): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 5.2 En tránsito

| Capa | Medida |
|------|--------|
| HTTP → HTTPS | Redirect forzado |
| TLS | v1.3 mínimo |
| Cipher suites | Solo seguras: `TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384` |
| Redis TLS | `rediss://` protocol |
| PostgreSQL TLS | `sslmode=require` |

### 5.3 Hash de passwords

```typescript
// src/common/utils/password.ts
import { hash, compare } from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}
```

---

## 6. Helmet y Headers de Seguridad

### 6.1 Headers configurados

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Content-Security-Policy` | `default-src 'self'` | Prevenir XSS |
| `X-Content-Type-Options` | `nosniff` | Evitar MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevenir clickjacking |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forzar HTTPS |
| `X-XSS-Protection` | `0` | Desactivar legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controlar referrer |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Restringir APIs del navegador |

### 6.2 Implementación

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'https://your-cdn.com'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  originAgentCluster: true,
  dnsPrefetchControl: { allow: false },
}));
```

---

## 7. Rate Limiting

### 7.1 Configuración

```typescript
// Usando @nestjs/throttler
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,        // 1 minuto
        limit: 100,         // 100 requests por minuto
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 5,           // 5 intentos de login por minuto
      },
    ]),
  ],
})
export class AppModule {}
```

### 7.2 Límites por endpoint

| Endpoint | Límite | Ventana | Justificación |
|----------|--------|---------|---------------|
| Global | 100 req | 1 minuto | Protección general |
| `POST /auth/login` | 5 req | 1 minuto | Prevenir brute force |
| `POST /auth/register` | 3 req | 1 hora | Prevenir creación masiva |
| `POST /auth/reset-password` | 2 req | 1 hora | Prevenir abuse |
| `POST /api/contact` | 10 req | 1 hora | Prevenir spam |
| `GET /api/users/:id` | 60 req | 1 minuto | Rate normal |

### 7.3 Rate limiting por usuario

```typescript
// Guard personalizado con Redis
@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const key = `ratelimit:user:${userId}`;

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minuto
    }

    if (current > 100) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    return true;
  }
}
```

---

## 8. Validación de Entrada

### 8.1 Estrategia

```
Cliente → HTTP Request
              │
              ▼
         ZodValidationPipe (global)
              │
              ▼
         DTO con Zod Schema
              │
              ▼
         Service (reglas de negocio)
              │
              ▼
         Prisma / Redis / Queue
```

### 8.2 Reglas de validación

```typescript
// Validación Zod estricta
export const CreateUserSchema = z.object({
  email: z
    .string()
    .email('Formato de email inválido')
    .max(255, 'Email demasiado largo')
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128, 'Máximo 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número'),
  name: z
    .string()
    .min(2, 'Nombre demasiado corto')
    .max(100, 'Nombre demasiado largo')
    .trim(),
});

// Sanitización de entrada
export const SearchQuerySchema = z.object({
  q: z
    .string()
    .max(200)
    .transform((s) => s.replace(/[<>"'&]/g, '')), // Eliminar caracteres peligrosos
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

---

## 9. CORS

### 9.1 Configuración

```typescript
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = configService.getAllowedOrigins();

    // Permitir requests sin origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new BadRequestException('Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Correlation-Id',
    'X-Requested-With',
  ],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24h — cache preflight
});
```

### 9.2 Reglas

- ✅ Lista blanca explícita de orígenes
- ✅ No usar `origin: '*'` en producción
- ✅ Cache de preflight con `maxAge`
- ✅ Solo métodos HTTP necesarios
- ✅ Headers específicos permitidos

---

## 10. Dependencias Seguras

### 10.1 Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
    open-pull-requests-limit: 10
    labels:
      - 'dependencies'
      - 'security'
    assignees:
      - 'security-team'
    reviewers:
      - 'security-team'
    allow:
      - dependency-type: 'direct'
    ignore:
      - dependency-name: 'typescript'
        versions: ['>=6.x']
```

### 10.2 npm audit

```bash
# Verificación en CI
npm audit --audit-level=high

# Salida esperada: 0 vulnerabilidades críticas/altas
# Si falla, el pipeline debe bloquearse
```

### 10.3 Política de dependencias

| Regla | Descripción |
|-------|-------------|
| **Pin de versiones** | Usar versiones exactas, no rangos (`1.2.3` no `^1.2.3`) |
| **Lockfile** | `package-lock.json` debe estar en VCS |
| **Auditoría semanal** | `npm audit` cada lunes |
| **Dependencias mínimas** | No agregar sin justificación |
| **Deprecadas** | Reemplazar inmediatamente |
| **Dev vs Prod** | Separar estrictamente |

---

## 11. Gestión de Secretos

### 11.1 Qué es un secreto

```typescript
// ✅ Variables de entorno
process.env.DATABASE_URL      // ✅ Correcto
process.env.JWT_SECRET        // ✅ Correcto
process.env.REDIS_PASSWORD    // ✅ Correcto

// ❌ Hardcodeado
const SECRET = 'my-super-secret-key';  // ❌ Incorrecto
const API_KEY = 'sk_live_123456';       // ❌ Incorrecto
```

### 11.2 Buenas prácticas

- ✅ Usar `.env` para desarrollo local (no commits)
- ✅ Usar Vault / AWS Secrets Manager / GCP Secret Manager en producción
- ✅ Rotar secretos cada 90 días
- ✅ Usar llaves asimétricas para JWT
- ✅ Nunca loguear secretos
- ✅ Escanear código en CI con `git-secrets` o `trufflehog`

### 11.3 .env.example

```env
# === Database ===
DATABASE_URL=postgresql://user:password@localhost:5432/db
DATABASE_URL_READ_REPLICA=postgresql://user:password@replica:5432/db

# === Redis ===
REDIS_URL=redis://:password@localhost:6379
REDIS_TLS_ENABLED=false

# === JWT ===
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ALGORITHM=RS256

# === Encryption ===
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# === External Services ===
SENDGRID_API_KEY=
STRIPE_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# === Observability ===
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
LOKI_HOST=http://localhost:3100
```

---

## 12. GDPR y Privacidad

### 12.1 Datos personales manejados

| Categoría | Datos | Almacenamiento |
|-----------|-------|----------------|
| Identificación | Email, nombre | Encriptado AES-256-GCM |
| Autenticación | Password hash | bcrypt, rounds=12 |
| Comunicación | Dirección, teléfono | Encriptado + consentimiento |
| Técnicos | IP, User-Agent, Logs | Retención 90 días |

### 12.2 Derechos GDPR implementados

```typescript
// src/modules/users/services/gdpr.service.ts
@Injectable()
export class GdprService {
  constructor(private readonly prisma: PrismaService) {}

  // Derecho al olvido
  async deleteUserData(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.delete({ where: { id: userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      this.prisma.personalData.deleteMany({ where: { userId } }),
    ]);
    await this.anonymizeLogs(userId);
  }

  // Derecho de acceso (portabilidad)
  async exportUserData(userId: string): Promise<UserDataExport> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sessions: true, personalData: true },
    });
    return {
      exportedAt: new Date(),
      data: this.decryptPersonalData(user),
      format: 'json',
    };
  }

  // Consentimiento
  async recordConsent(
    userId: string,
    type: ConsentType,
    granted: boolean,
  ): Promise<void> {
    await this.prisma.consentLog.create({
      data: { userId, type, granted, timestamp: new Date() },
    });
  }
}
```

### 12.3 Política de retención

| Tipo de dato | Retención | Justificación |
|-------------|-----------|---------------|
| Logs de aplicación | 90 días | Debugging y seguridad |
| Logs de auditoría | 1 año | Compliance |
| Datos de usuario | Hasta solicitud de borrado | Consentimiento |
| Sesiones expiradas | 7 días post-expiración | Limpieza |
| Refresh tokens | 90 días | Rotación |

---

## 13. Seguridad en Base de Datos

### 13.1 Prisma Security

```typescript
// ✅ Query parametrizadas (seguras por defecto)
await this.prisma.user.findUnique({ where: { id: userId } });

// ❌ RAW queries solo con validación estricta
await this.prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;

// ✅ Usar select para evitar over-fetching
await this.prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, name: true }, // No incluir passwordHash
});

// ✅ Usar @password en schema.prisma
// schema.prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String?
  @@map("users")
}
```

### 13.2 Conexión segura

```env
# Encriptación en tránsito
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Certificados
DATABASE_CA_CERT=/etc/ssl/certs/server-ca.pem
DATABASE_CLIENT_CERT=/etc/ssl/certs/client-cert.pem
DATABASE_CLIENT_KEY=/etc/ssl/certs/client-key.pem
```

---

## 14. Seguridad en Redis

```typescript
// ✅ Conexión TLS
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS_ENABLED === 'true' ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// ✅ No almacenar datos sensibles en Redis
await this.redis.set(`session:${sessionId}`, JSON.stringify({
  userId: user.id,
  role: user.role,
  // ❌ No incluir passwordHash, tokens, PII
}), 'EX', 3600);
```

---

## 15. Seguridad en BullMQ

```typescript
// ✅ Colas con autenticación
const queue = new Queue('email', {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS_ENABLED === 'true' ? {} : undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 * 24, count: 1000 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

// ✅ Validar datos del job al recibir
const worker = new Worker('email', async (job) => {
  const schema = z.object({
    to: z.string().email(),
    subject: z.string().max(200),
    body: z.string(),
  });
  const data = schema.parse(job.data);
  // Procesar...
});
```

---

## 16. Auditoría y Logging

### 16.1 Eventos auditables

| Evento | Log | Retención |
|--------|-----|-----------|
| Login exitoso | `INFO` | 1 año |
| Login fallido | `WARN` | 1 año |
| Cambio de password | `INFO` | 1 año |
| Creación de usuario | `INFO` | 1 año |
| Eliminación de datos | `WARN` | 1 año |
| Rate limit excedido | `WARN` | 90 días |
| Token revocado | `INFO` | 90 días |
| Acceso denegado | `WARN` | 90 días |

### 16.2 Logging seguro

```typescript
// ✅ Nunca loguear datos sensibles
this.logger.log('User logged in', {
  userId: user.id,
  correlationId,
  ip: maskIp(request.ip),
  userAgent: request.headers['user-agent'],
  // ❌ No incluir: email, password, token, session
});

// Función helper para sanitizar logs
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization'];
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      sensitiveKeys.some((k) => key.toLowerCase().includes(k))
        ? '[REDACTED]'
        : value,
    ]),
  );
}
```
