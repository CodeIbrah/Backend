# Recomendaciones de Seguridad — Backend Template

> Guía de hardening para proteger la API contra las vulnerabilidades más comunes.

---

## Índice

- [1. Autenticación (JWT)](#1-autenticación-jwt)
- [2. Autorización (RBAC)](#2-autorización-rbac)
- [3. Validación de Entrada](#3-validación-de-entrada)
- [4. Headers de Seguridad](#4-headers-de-seguridad)
- [5. Dependencias](#5-dependencias)
- [6. Gestión de Secretos](#6-gestión-de-secretos)
- [7. Protección contra Ataques Comunes](#7-protección-contra-ataques-comunes)
- [8. Auditoría de Seguridad](#8-auditoría-de-seguridad)

---

## 1. Autenticación (JWT)

### 1.1 Configuración de JWT

```typescript
// config/jwt.config.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET,        // Mínimo 256 bits (32 caracteres)
  signOptions: {
    algorithm: 'HS256',                   // Usar HS256 o RS256
    expiresIn: '15m',                     // Access token: 15 minutos
    issuer: 'backend-template',
    audience: 'backend-template-api',
  },
};

// Para RS256 (recomendado en multi-servicio)
// Generar par de llaves:
// openssl genrsa -out private.pem 2048
// openssl rsa -in private.pem -pubout -out public.pem
```

### 1.2 Refresh Token Rotation

```typescript
@Injectable()
export class AuthService {
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  async login(credentials: LoginDto): Promise<TokenPair> {
    const user = await this.validateCredentials(credentials);
    const refreshToken = crypto.randomUUID();

    // Almacenar refresh token en DB (revocable)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        family: crypto.randomUUID(),        // Para rotación segura
      },
    });

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken,
      expiresIn: 900,
    };
  }

  // Rotación: invalidar anterior, crear nuevo
  async refresh(oldRefreshToken: string): Promise<TokenPair> {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Posible robo de token — invalidar toda la familia
      if (stored) {
        await prisma.refreshToken.deleteMany({
          where: { family: stored.family },
        });
      }
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Invalidar el token usado (rotation)
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    // Crear nuevo token
    const newRefreshToken = crypto.randomUUID();
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        family: stored.family,
      },
    });

    return {
      accessToken: this.generateAccessToken(stored.user),
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }
}
```

### 1.3 Estrategia JWT con Passport (NestJS)

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      issuer: 'backend-template',
      audience: 'backend-template-api',
    });
  }

  async validate(payload: JwtPayload): Promise<UserContext> {
    // Verificar que el usuario sigue activo
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, roles: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o eliminado');
    }

    return { id: user.id, email: user.email, roles: user.roles };
  }
}
```

### 1.4 Medidas Adicionales

```typescript
// Blacklist de tokens (logout)
@Injectable()
export class TokenBlacklistService {
  async isBlacklisted(jti: string): Promise<boolean> {
    const exists = await redis.exists(`blacklist:${jti}`);
    return exists === 1;
  }

  async blacklist(jti: string, expiresInSec: number): Promise<void> {
    await redis.set(`blacklist:${jti}`, '1', { EX: expiresInSec });
  }
}

// Detectar múltiples refreshs con el mismo token (posible robo)
// Esto se maneja con "familia" de tokens en la rotación
```

### 1.5 JTI (JWT ID) Claim

Cada access token debe incluir un `jti` (JWT ID) unico para permitir blacklist individual, tracking de sesiones y deteccion de replay.

```typescript
function generateAccessToken(user: User): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    roles: user.roles,
    jti: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
  };

  return this.jwtService.sign(payload, {
    expiresIn: this.accessTokenExpiry,
    algorithm: 'HS256',
    issuer: 'backend-template',
    audience: 'backend-template-api',
  });
}
```

Validar `jti` en el JwtStrategy para rechazar tokens blacklisteados:

```typescript
async validate(payload: JwtPayload): Promise<UserContext> {
  if (await this.tokenBlacklistService.isBlacklisted(payload.jti)) {
    throw new UnauthorizedException('Token invalidado');
  }
  // ... resto de la validacion
}
```

### 1.6 Account Lockout

Bloquear la cuenta temporalmente tras N intentos fallidos consecutivos usando Redis con expiracion automatica.

```typescript
@Injectable()
export class AccountLockoutService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_SEC = 900;
  private readonly LOCKOUT_SEC = 3600;

  async recordFailedAttempt(email: string): Promise<void> {
    const key = `attempts:${email}`;
    const attempts = await redis.incr(key);
    if (attempts === 1) await redis.expire(key, this.WINDOW_SEC);

    if (attempts >= this.MAX_ATTEMPTS) {
      await redis.set(`lockout:${email}`, '1', { EX: this.LOCKOUT_SEC });
      throw new TooManyRequestsException(
        'Cuenta bloqueada temporalmente por demasiados intentos fallidos.',
      );
    }
  }

  async isLocked(email: string): Promise<boolean> {
    return (await redis.get(`lockout:${email}`)) === '1';
  }

  async clearAttempts(email: string): Promise<void> {
    await redis.del(`attempts:${email}`);
    await redis.del(`lockout:${email}`);
  }
}
```

Integrar en el flujo de login:

```typescript
async login(dto: LoginDto): Promise<TokenPair> {
  if (await this.lockoutService.isLocked(dto.email)) {
    throw new TooManyRequestsException('Cuenta bloqueada temporalmente');
  }

  const user = await this.validateCredentials(dto);
  if (!user) {
    await this.lockoutService.recordFailedAttempt(dto.email);
    throw new UnauthorizedException('Credenciales invalidas');
  }

  await this.lockoutService.clearAttempts(dto.email);
  return this.generateTokenPair(user);
}
```

---

## 2. Autorización (RBAC)

### 2.1 Definición de Roles y Permisos

```typescript
// common/types/roles.ts
export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Permissions = {
  users: {
    create: [Role.ADMIN],
    read: [Role.ADMIN, Role.MANAGER, Role.USER],
    update: [Role.ADMIN, Role.MANAGER],
    delete: [Role.ADMIN],
  },
  orders: {
    create: [Role.ADMIN, Role.MANAGER, Role.USER],
    read: [Role.ADMIN, Role.MANAGER, Role.USER],
    update: [Role.ADMIN, Role.MANAGER],
    delete: [Role.ADMIN],
  },
} as const;
```

### 2.2 Guard de Roles (NestJS)

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Ruta pública
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Autenticación requerida');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

// Uso en el controlador
@Post()
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
async createUser(@Body() dto: CreateUserDto): Promise<UserResponse> {
  return this.usersService.create(dto);
}
```

### 2.3 Permisos a Nivel de Recurso

```typescript
// Ownership guard — verificar que el usuario es dueño del recurso
@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;

    // Admin puede acceder a cualquier recurso
    if (user.roles.includes(Role.ADMIN)) return true;

    const resourceId = params.id;
    const resource = await this.prisma.order.findUnique({
      where: { id: resourceId },
      select: { userId: true },
    });

    if (!resource) throw new NotFoundException('Order not found');

    return resource.userId === user.id;
  }
}
```

---

## 3. Validación de Entrada

### 3.1 Zod Schemas (Recomendado)

```typescript
// modules/users/dto/create-user.dto.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email demasiado largo')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      'La contraseña debe contener mayúscula, minúscula, número y carácter especial',
    ),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo')
    .transform((name) => name.trim()),
  role: z.nativeEnum(Role).optional().default(Role.USER),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// Uso
@Post()
async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
  // Zod ya validó en el pipe global
  return this.usersService.create(dto);
}
```

### 3.2 Zod Pipe para NestJS

```typescript
// common/pipes/zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      throw new ValidationError(errors);
    }

    return result.data;
  }
}

// Uso con decorador personalizado
export const ZodBody = (schema: ZodSchema) => Body(new ZodValidationPipe(schema));
```

### 3.3 Sanitización

```typescript
// Prevenir XSS en entradas de texto
import sanitizeHtml from 'sanitize-html';

function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],       // No permitir etiquetas HTML
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

// Schema Zod con sanitización
export const profileSchema = z.object({
  bio: z
    .string()
    .max(500)
    .transform((val) => sanitizeInput(val)),
  website: z
    .string()
    .url()
    .optional()
    .transform((val) => val ? new URL(val).origin : val), // Solo origen
});
```

### 3.4 Protección contra Ataques Comunes

```typescript
// Límite de tamaño en body (evitar DoS por payload grande)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// SQL Injection — Prisma usa parametrización, pero evitar raw queries
// ❌ MAL
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ BIEN
await prisma.user.findUnique({ where: { email } });

// NoSQL Injection
// ❌ MAL
await collection.find({ email: req.body.email });

// ✅ BIEN — validar tipo antes de la consulta
```

### 3.5 Multi-Layer Validation Strategy

La validacion debe aplicarse en tres capas independientes para defensa en profundidad:

| Capa | Lugar | Responsabilidad | Ejemplo |
| ---- | ----- | --------------- | ------- |
| 1 — Sintaxis y tipo | DTO / Pipe (class-validator, Zod) | Rechazar datos malformados, tipos incorrectos, valores fuera de rango | `z.string().email().max(255)` |
| 2 — Reglas de negocio | Service layer | Validar reglas de dominio (unicidad, estado, permisos) | `if (order.status !== 'PENDING') throw ...` |
| 3 — Base de datos | Prisma schema (unique, check, not null) | Ultima barrera: garantizar integridad referencial | `@Unique([email])`, `@UpdatedAt` |

```typescript
// Capa 1: Zod DTO (sintaxis y tipo)
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

// Capa 2: Service (reglas de negocio)
async create(dto: CreateUserDto): Promise<User> {
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (existing) {
    throw new ConflictException('El email ya esta registrado');
  }
  return this.prisma.user.create({ data: dto });
}

// Capa 3: Schema de base de datos (Prisma)
// model User {
//   id        String   @id @default(cuid())
//   email     String   @unique
//   password  String
//   createdAt DateTime @default(now())
// }
```

### 3.6 Zod Pipe compatible con ValidationPipe de NestJS

Pipe que permite usar Zod con el `ValidationPipe` nativo de NestJS sin conflictos:

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors.map((e) => ({
          field: e.path.join('.'),
          code: e.code,
          message: e.message,
        })),
      });
    }
    return result.data;
  }
}
```

Uso con decoradores nativos:

```typescript
@Post()
@UsePipes(new ZodValidationPipe(createUserSchema))
async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
  return this.usersService.create(dto);
}
```

---

## 4. Headers de Seguridad

### 4.1 Helmet — Configuración Recomendada

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,      // 1 año
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  ieNoOpen: true,
}));
```

> **Nota para Swagger UI en desarrollo**: Si usas `@nestjs/swagger`, el CSP debe relajarse para permitir los recursos de Swagger. Crea una configuracion condicional:
>
> ```typescript
> function getHelmetConfig(isDev: boolean) {
>   const config: Parameters<typeof helmet>[0] = {
>     referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
>     hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
>     frameguard: { action: 'deny' },
>     noSniff: true,
>     xssFilter: true,
>     hidePoweredBy: true,
>     ieNoOpen: true,
>   };
>
>   if (isDev) {
>     config.contentSecurityPolicy = {
>       directives: {
>         defaultSrc: ["'self'"],
>         scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
>         styleSrc: ["'self'", "'unsafe-inline'"],
>         imgSrc: ["'self'", 'data:', 'https:'],
>         connectSrc: ["'self'"],
>         fontSrc: ["'self'"],
>         objectSrc: ["'none'"],
>         frameAncestors: ["'none'"],
>         formAction: ["'self'"],
>         baseUri: ["'self'"],
>         upgradeInsecureRequests: [],
>       },
>     };
>   }
>
>   return config;
> }
>
> // Uso
> app.use(helmet(getHelmetConfig(process.env.NODE_ENV === 'development')));
> ```

### 4.2 CORS

```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://miapp.com',
  'https://admin.miapp.com',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, scripts)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400, // 24h — cachear preflight
}));
```

### 4.3 Headers Personalizados de Seguridad

```typescript
// Middleware para añadir headers de seguridad adicionales
function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Desactivado por obsoleto, CSP lo cubre
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
}
```

---

## 5. Dependencias

### 5.1 npm Audit

```bash
# Auditoría regular
npm audit

# Auditoría con salida JSON (para CI)
npm audit --json

# Arreglar vulnerabilidades automáticamente
npm audit fix

# Forzar fix de dependencias transitivas
npm audit fix --force
```

### 5.2 Configuración Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Mexico_City"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
    reviewers:
      - "team-leads"
    allow:
      - dependency-type: "direct"
    ignore:
      - dependency-name: "typescript"
        versions: [">=6.x"]
```

### 5.3 Buenas Prácticas

| Práctica                       | Descripción                                    |
| ------------------------------ | ---------------------------------------------- |
| Pin versions                   | Usar versiones exactas (sin `^` o `~`) en producción |
| Lockfile                       | Committear `package-lock.json` o `yarn.lock`   |
| Actualizar semanalmente        | Mantener dependencias al día                   |
| Revisar breaking changes        | Antes de actualizar major versions             |
| Eliminar no usadas             | `depcheck` o `npm prune`                       |
| Usar `--omit=dev` en producción | `npm ci --omit=dev`                            |

---

## 6. Gestión de Secretos

### 6.1 Variables de Entorno (`.env`)

```env
# .env (NUNCA committear)
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=tu-secreto-de-al-menos-32-caracteres-aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Redis
REDIS_URL=redis://:password@localhost:6379/0

# APIs externas
SENDGRID_API_KEY=sg_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
```

### 6.2 Validación de Variables de Entorno

```typescript
// config/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  REDIS_URL: z.string().url('REDIS_URL debe ser una URL válida').optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Variables de entorno inválidas:');
    for (const error of result.error.errors) {
      console.error(`  - ${error.path.join('.')}: ${error.message}`);
    }
    process.exit(1);
  }

  return result.data;
}
```

### 6.3 Reglas de Seguridad para Secretos

```yaml
# .gitignore — asegurar que estos archivos NO se committean
.env
.env.*.local
*.key
*.pem
secrets/
service-account.json
credentials.json
```

```bash
# Detectar secretos committeados (usar antes de push)
npx secretlint "src/**/*"
npx trufflehog git --since-commit HEAD~5

# Si se committea un secreto por error:
# 1. Rotar el secreto inmediatamente
# 2. Usar git filter-repo para eliminar del historial
```

### 6.4 Uso de Vault (Producción)

```typescript
// secrets/vault.service.ts
@Injectable()
export class VaultService {
  private client: VaultClient;

  async getSecret(path: string): Promise<Record<string, string>> {
    const response = await this.client.read(path);
    return response.data;
  }

  async rotateSecret(path: string): Promise<void> {
    const newSecret = crypto.randomBytes(32).toString('hex');
    await this.client.write(path, { value: newSecret });

    // Invalidar caché local
    await redis.del(`vault:${path}`);
  }
}
```

---

## 7. Protección contra Ataques Comunes

### 7.1 Rate Limiting por Endpoint

```typescript
import rateLimit from 'express-rate-limit';

// Global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Endpoints sensibles (login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,            // Máximo 5 intentos cada 15 minutos
  message: {
    success: false,
    error: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
  },
  skipSuccessfulRequests: true, // Solo contar fallos
});

app.use('/api/v1/auth/login', authLimiter);
```

#### Alternativa con @nestjs/throttler (NestJS nativo)

```typescript
// app.module.ts — tres niveles de rate limiting
ThrottlerModule.forRoot([
  {
    name: 'short',    // Endpoints rapidos (login, submit)
    ttl: 1000,        // 1 segundo
    limit: 3,         // max 3 requests
  },
  {
    name: 'medium',   // Endpoints normales
    ttl: 10000,       // 10 segundos
    limit: 20,        // max 20 requests
  },
  {
    name: 'long',     // Endpoints lentos (reportes, export)
    ttl: 60000,       // 60 segundos
    limit: 100,       // max 100 requests
  },
]),
```

Uso con decorador por endpoint:

```typescript
import { Throttle } from '@nestjs/throttler';

@Post('login')
@Throttle({ default: { ttl: 1000, limit: 3 } })
async login(@Body() dto: LoginDto): Promise<TokenPair> { ... }
```

### 7.2 Brute Force Protection

```typescript
async function checkBruteForce(email: string): Promise<void> {
  const key = `bruteforce:${email}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 900); // Expirar después de 15 min
  }

  if (attempts > 10) {
    // Bloquear cuenta temporalmente
    await redis.set(`lockout:${email}`, '1', { EX: 3600 });
    throw new TooManyRequestsException('Cuenta temporalmente bloqueada');
  }
}
```

### 7.3 Webhook Security

```typescript
// Verificar firma de webhooks
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature),
  );
}
```

### 7.4 Redis-Backed Throttling (Multi-Instance)

Para entornos con multiples instancias (horizontal scaling), usar Redis como backend de rate limiting:

```bash
npm install @nestjs/throttler-storage-redis
```

```typescript
// app.module.ts — condicional: Redis si REDIS_URL existe, si no memoria local
import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';
import Redis from 'ioredis';

const throttlerStorage = process.env.REDIS_URL
  ? new ThrottlerStorageRedisService(new Redis(process.env.REDIS_URL))
  : undefined;

ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },
  { name: 'medium', ttl: 10000, limit: 20 },
  { name: 'long', ttl: 60000, limit: 100 },
], {
  storage: throttlerStorage,
}),
```

### 7.5 Auth Endpoint Rate Limiting

Para el endpoint de login, combinar rate limiting global con cuenta de intentos especifica por email:

```typescript
@Post('login')
@Throttle({ default: { ttl: 900000, limit: 5 } }) // 5 intentos cada 15 min
@UseGuards(LocalAuthGuard)
async login(@Body() dto: LoginDto): Promise<TokenPair> {
  if (await this.lockoutService.isLocked(dto.email)) {
    throw new TooManyRequestsException('Cuenta bloqueada temporalmente');
  }
  // ... validacion de credenciales
}
```

> **Nota**: La verificacion de firmas con `crypto.timingSafeEqual` (seccion 7.3) previene ataques de timing que permitirian adivinar la firma comparando byte a byte. Usar SIEMPRE timing-safe compare en lugar de `===` o `==` para validar credenciales, firmas, tokens y secretos. `timingSafeEqual` requiere que ambos buffers tengan la misma longitud; normalizar siempre ambos valores antes de comparar.

---

## 8. Auditoria de Seguridad

### 8.1 Estructura del Registro de Auditoria

Cada evento de seguridad debe registrar un conjunto estandarizado de campos para facilitar el analisis forense y la correlacion con trazas distribuidas.

```typescript
interface AuditEvent {
  id: string;
  timestamp: string;
  correlationId: string;
  action: AuditAction;
  actor: {
    id: string;
    email: string;
    roles: string[];
  };
  target?: {
    type: string;
    id: string;
  };
  context: {
    ip: string;
    userAgent: string;
    requestId: string;
  };
  outcome: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, unknown>;
}

type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGIN_FAILED'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'TOKEN_REFRESHED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'SETTINGS_CHANGED';
```

### 8.2 Servicio de Auditoria

El proyecto ya incluye un `AuditService` en `main/src/audit/audit.service.ts` con persistencia via Prisma y un `AuditController` para consultar el trail. A continuacion, un wrapper orientado a eventos de seguridad que extiende esa base:

```typescript
@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly auditService: AuditService,
    private readonly logger: winston.Logger,
  ) {}

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    await this.auditService.log({
      userId: event.actor.id,
      action: this.mapAuditAction(event.action),
      entity: event.target?.type ?? event.action,
      entityId: event.target?.id,
      ipAddress: event.context.ip,
      userAgent: event.context.userAgent,
      metadata: { correlationId: event.correlationId, outcome: event.outcome, ...event.metadata },
    });

    this.logger.info(`[SECURITY_AUDIT] ${event.action}`, auditEvent);
  }

  private mapAuditAction(action: AuditAction): AuditEntry['action'] {
    if (action === 'USER_LOGIN') return 'LOGIN';
    if (action === 'USER_CREATED') return 'CREATE';
    if (action === 'USER_DELETED') return 'DELETE';
    if (action === 'ROLE_CHANGED' || action === 'PERMISSION_CHANGED') return 'UPDATE';
    return 'CONFIG_CHANGE';
  }
}
```

### 8.3 Eventos a Auditar

| Evento | Disparador | Informacion sensible |
| ------ | ---------- | ------------------- |
| `USER_LOGIN` | Inicio de sesion exitoso | IP, user-agent, timestamp |
| `USER_LOGIN_FAILED` | Credenciales invalidas | IP, email (nunca la contrasena) |
| `USER_LOGOUT` | Cierre de sesion explicito | Token jti invalidado |
| `PASSWORD_CHANGED` | Cambio de contrasena | Fecha, IP (nunca la contrasena) |
| `ROLE_CHANGED` | Modificacion de roles | Antiguo rol, nuevo rol, quien lo modifico |
| `ACCOUNT_LOCKED` | Superado maximo de intentos | Email, IP, timestamp de desbloqueo estimado |
| `TOKEN_REFRESHED` | Rotacion de refresh token | Familia de tokens, IP |

### 8.4 Correlacion con Trazas Distribuidas

Incluir siempre el `correlationId` (X-Correlation-ID) y el `traceId` de OpenTelemetry en cada evento de auditoria para poder reconstruir el flujo completo de una solicitud a traves de todos los servicios.

```typescript
// middleware de correlacion
function correlationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.correlationId = req.headers['x-correlation-id'] as string ?? crypto.randomUUID();
  req.traceId = req.headers['x-trace-id'] as string;
  next();
}
```

### 8.5 Retencion y Ciclo de Vida

| Aspecto | Recomendacion |
| ------- | ------------- |
| Retencion minima | 90 dias (regulacion GDPR: 12 meses) |
| Rotacion | Diaria con compresion (gzip) |
| Almacenamiento | Base de datos + archivo JSON |
| Backup | Incluir en backup diario de BD |
| Purga automatica | Job cron semanal que elimina registros > 90 dias |
| Immutabilidad | Los registros de auditoria NO deben ser actualizables ni eliminables por usuarios |
| Acceso | Solo lectura para el equipo de seguridad, nunca para usuarios finales |

```sql
-- Job de purge (ejecutar semanalmente via cron o worker)
DELETE FROM "AuditLog"
WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

---

> **Recursos adicionales**: OWASP Top 10, [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/), [nodejs.org/en/security](https://nodejs.org/en/security).
