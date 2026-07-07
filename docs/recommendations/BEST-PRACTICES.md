# Mejores Prácticas — Backend Template (NestJS + Express + TypeScript)

> Guía de referencia para mantener un código limpio, tipado, seguro y escalable.

---

## Índice

- [1. TypeScript](#1-typescript)
- [2. NestJS](#2-nestjs)
- [3. Express](#3-express)
- [4. Diseño de API](#4-diseño-de-api)
- [5. Base de Datos (Prisma)](#5-base-de-datos-prisma)
- [6. Manejo de Errores](#6-manejo-de-errores)
- [7. Estructura del Proyecto](#7-estructura-del-proyecto)

---

## 1. TypeScript

### 1.1 Strict Mode Activado

`tsconfig.json` debe habilitar todas las opciones estrictas:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.2 Evitar `any` a Toda Costa

`any` desactiva el sistema de tipos. Alternativas:

| Situación               | Alternativa Tipada                     |
| ----------------------- | -------------------------------------- |
| Datos externos          | `unknown` + `zod` validation           |
| Parámetros flexibles    | Genéricos `<T>`                        |
| Objetos dinámicos       | `Record<string, unknown>`              |
| Callbacks               | Tipo de función específico             |
| `req.query`             | DTO con validación                     |

```typescript
// ❌ MAL
async function process(data: any): Promise<any> {
  return data.value;
}

// ✅ BIEN
async function process<T extends { value: unknown }>(data: T): Promise<T['value']> {
  return data.value;
}
```

### 1.3 Preferir Interfaces sobre Types

Usar `interface` para objetos/contratos y `type` para uniones/intersecciones.

```typescript
// ✅ Para contratos y DTOs
interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

// ✅ Para uniones
type Result<T> = { ok: true; data: T } | { ok: false; error: Error };
```

### 1.4 Enums vs Const Objects

Preferir objetos `as const` sobre `enum` para mejor interoperabilidad con el sistema de tipos:

```typescript
// ✅ Recomendado
export const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

### 1.5 Tipado Explícito en Retornos de Funciones

Siempre declarar el tipo de retorno en funciones públicas:

```typescript
// ✅ BIEN
async function findUserById(id: string): Promise<UserResponse | null> {
  return prisma.user.findUnique({ where: { id } });
}
```

---

## 2. NestJS

### 2.1 Organización de Módulos

Cada módulo debe representar un dominio acotado (bounded context):

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       └── create-user.dto.ts
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       └── dto/
│           └── create-order.dto.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── guards/
│       └── roles.guard.ts
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### 2.2 Inyección de Dependencias

Usar `@Injectable()` con ámbito Singleton por defecto:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
}
```

Evitar dependencias circulares. Si son necesarias, usar `forwardRef`:

```typescript
@Module({
  imports: [forwardRef(() => AuthModule)],
})
export class UsersModule {}
```

### 2.3 Guards

Guards para autorización, no para transformación de datos:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 2.4 Interceptores

Usar interceptores para preocupaciones transversales:

```typescript
// Transformar respuestas
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 2.5 Pipes de Validación Global

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Elimina propiedades no decoradas
    forbidNonWhitelisted: true, // Lanza error si hay propiedades extrañas
    transform: true,            // Transforma tipos automáticamente
  }),
);
```

---

## 3. Express

### 3.1 Orden de Middleware

El orden importa. Seguir esta secuencia:

```typescript
// 1. Seguridad
app.use(helmet());
app.use(cors());
app.use(compression());

// 2. Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Logging / Tracing
app.use(requestLogger);

// 4. Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 5. Rutas
app.use('/api/v1', router);

// 6. Error handling (SIEMPRE al final)
app.use(errorHandler);
```

### 3.2 Helmet y Compression

```typescript
import helmet from 'helmet';
import compression from 'compression';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(compression({
  level: 6,
  threshold: 1024, // Solo comprimir respuestas > 1KB
}));
```

### 3.3 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                    // Máximo 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
  },
});
```

---

## 4. Diseño de API

### 4.1 Convenciones REST

| Método   | Recurso              | Código | Descripción              |
| -------- | -------------------- | ------ | ------------------------ |
| `GET`    | `/api/v1/users`      | 200    | Listar usuarios          |
| `GET`    | `/api/v1/users/:id`  | 200    | Obtener usuario por ID   |
| `POST`   | `/api/v1/users`      | 201    | Crear usuario            |
| `PATCH`  | `/api/v1/users/:id`  | 200    | Actualizar parcialmente  |
| `DELETE` | `/api/v1/users/:id`  | 204    | Eliminar usuario         |

### 4.2 Formato de Respuesta Consistente

```typescript
// Éxito
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "timestamp": "2026-06-29T10:00:00.000Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El email no es válido",
    "details": [
      { "field": "email", "message": "email must be a valid email" }
    ]
  },
  "timestamp": "2026-06-29T10:00:00.000Z"
}
```

### 4.3 Versionado

Usar prefijo de ruta, no headers:

```typescript
// main.ts
app.setGlobalPrefix('api/v1');
```

### 4.4 Paginación

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### 4.5 Códigos de Estado HTTP

| Código | Uso                              |
| ------ | -------------------------------- |
| 200    | Éxito en GET, PATCH             |
| 201    | Creación exitosa (POST)          |
| 204    | Eliminación exitosa (DELETE)     |
| 400    | Error de validación              |
| 401    | No autenticado                   |
| 403    | No autorizado (falta permiso)    |
| 404    | Recurso no encontrado            |
| 409    | Conflicto (duplicado, estado)    |
| 422    | Entidad no procesable            |
| 429    | Rate limit excedido              |
| 500    | Error interno del servidor       |

---

## 5. Base de Datos (Prisma)

### 5.1 Patrón Singleton de PrismaService

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
```

### 5.2 Gestión de Conexiones

```typescript
// Evitar múltiples instancias en desarrollo
// Usar un singleton global

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

### 5.3 Optimización de Queries

```typescript
// ✅ SELECT explícito (nunca incluir campos innecesarios)
await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // NO incluir passwordHash
  },
});

// ✅ Paginación con cursor (recomendado para grandes datasets)
await prisma.user.findMany({
  take: 20,
  skip: 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});

// ✅ Batch operations
await prisma.$transaction([
  prisma.order.updateMany({ where: { status: 'PENDING' }, data: { status: 'PROCESSING' } }),
  prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, message: 'Pedido procesado' })),
  }),
]);
```

### 5.4 Migraciones Seguras

```bash
# Crear migración
npx prisma migrate dev --name add_user_role

# Aplicar en producción
npx prisma migrate deploy

# Verificar estado
npx prisma migrate status
```

---

## 6. Manejo de Errores

### 6.1 Errores Tipados

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', 404, `${resource} con ID ${id} no encontrado`);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown[]) {
    super('VALIDATION_ERROR', 400, 'Error de validación', details);
  }
}
```

### 6.2 Global Exception Filter (NestJS)

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    const errorResponse = {
      success: false,
      error: {
        code: exception instanceof AppError ? exception.code : 'INTERNAL_ERROR',
        message: exception instanceof HttpException
          ? exception.message
          : 'Error interno del servidor',
        details: exception instanceof AppError ? exception.details : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }
}
```

### 6.3 Logging Estructurado

```typescript
// winston.config.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'backend-template',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.prettyPrint(),
    }),
  ],
});
```

---

## 7. Estructura del Proyecto

```
src/
├── main.ts                        # Punto de entrada
├── app.module.ts                  # Módulo raíz
├── app.controller.ts              # Health check
├── config/                        # Configuración (env, valores)
│   ├── env.config.ts
│   └── app.config.ts
├── modules/                       # Módulos de dominio
│   ├── auth/
│   ├── users/
│   └── orders/
├── common/                        # Código compartido
│   ├── decorators/
│   ├── dto/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── types/
├── prisma/                        # Servicio Prisma
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── prisma.constants.ts
└── utils/                         # Utilidades puras (sin dependencias Nest)
    ├── date.utils.ts
    └── hash.utils.ts
```

---

> **Mantenimiento**: Este documento debe revisarse con cada PR significativo que introduzca nuevas dependencias o patrones.
