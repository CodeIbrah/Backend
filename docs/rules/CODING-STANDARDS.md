# Estándares de Codificación — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Aplica a:** Proyectos NestJS + Express + TypeScript con Prisma, Redis y BullMQ

---

## Índice

1. [TypeScript Strict Mode](#1-typescript-strict-mode)
2. [Convenciones de Nomenclatura](#2-convenciones-de-nomenclatura)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Orden de Importaciones](#4-orden-de-importaciones)
5. [Manejo de Errores](#5-manejo-de-errores)
6. [Async / Await](#6-async--await)
7. [Patrones DI de NestJS](#7-patrones-di-de-nestjs)
8. [Validación de DTOs con Zod](#8-validación-de-dtos-con-zod)
9. [Requerimientos de Pruebas](#9-requerimientos-de-pruebas)
10. [Checklist de Code Review](#10-checklist-de-code-review)
11. [Formato y Estilo](#11-formato-y-estilo)
12. [Documentación](#12-documentación)

---

## 1. TypeScript Strict Mode

### 1.1 Configuración obligatoria

El archivo `tsconfig.json` **debe** incluir las siguientes opciones:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.2 Prohibiciones

| Elemento | Estado | Alternativa |
|----------|--------|-------------|
| `any` | ❌ Prohibido | `unknown` + type guard |
| `as` (type assertion) | ⚠️ Excepción controlada | Type narrowing |
| `// @ts-ignore` | ❌ Prohibido | `// @ts-expect-error` con comentario |
| `// @ts-nocheck` | ❌ Prohibido | No usar |
| `namespace` | ❌ Prohibido | `esModule` con `import/export` |
| `{}` como tipo | ❌ Prohibido | `Record<string, unknown>` |
| `Function` | ❌ Prohibido | Firma específica `() => void` |

### 1.3 Uso de `unknown`

```typescript
// ❌ Incorrecto
function process(data: any): void {
  console.log(data.name);
}

// ✅ Correcto
function process(data: unknown): void {
  if (isValidPayload(data)) {
    console.log(data.name);
  }
}
```

---

## 2. Convenciones de Nomenclatura

### 2.1 Tabla general

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Variables | `camelCase` | `userName`, `activeUsers` |
| Constantes (primitivas) | `camelCase` | `maxRetries`, `defaultPort` |
| Constantes (enums/objetos) | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `ERROR_CODES` |
| Funciones | `camelCase` | `getUserById`, `validateToken` |
| Clases | `PascalCase` | `UserService`, `AuthController` |
| Interfaces | `PascalCase` | `UserResponse`, `CreateUserDto` |
| Types | `PascalCase` | `UserRole`, `ApiResponse<T>` |
| Enums | `PascalCase` | `UserRole`, `OrderStatus` |
| Enum members | `UPPER_SNAKE_CASE` | `UserRole.ADMIN` |
| Archivos | `kebab-case` | `user-service.ts`, `auth-controller.ts` |
| Directorios | `kebab-case` | `modules/user/`, `common/guards/` |
| Métodos | `camelCase` | `findAll`, `createUser` |
| Props de clases | `camelCase` | `private readonly userRepository` |
| Decoradores | `PascalCase` | `@Injectable()`, `@Controller()` |
| Parámetros | `camelCase` | `userId: string` |
| Genéricos | `PascalCase` (1 letra o nombre) | `T`, `K`, `V`, `ResponseType` |

### 2.2 Prefijos y sufijos

| Concepto | Convención | Ejemplo |
|----------|-----------|---------|
| Interfaces de DTOs | `I` + nombre (opcional) | `ICreateUserDto` o `CreateUserDto` |
| Tipos de respuesta | Sufijo `Response` | `UserListResponse` |
| Parámetros de query | Sufijo `Query` | `ListUsersQuery` |
| Parámetros de ruta | Sufijo `Params` | `UserIdParams` |
| Servicios | Sufijo `Service` | `UserService`, `EmailService` |
| Controladores | Sufijo `Controller` | `UserController` |
| Guards | Sufijo `Guard` | `JwtAuthGuard`, `RolesGuard` |
| Interceptors | Sufijo `Interceptor` | `LoggingInterceptor` |
| Pipes | Sufijo `Pipe` | `ValidationPipe` |
| Filters | Sufijo `Filter` | `HttpExceptionFilter` |
| Módulos | Sufijo `Module` | `UserModule` |

### 2.3 Archivos

```
# ✅ Correcto
user-service.ts
auth-controller.ts
create-user.dto.ts
jwt-auth.guard.ts
user.repository.ts

# ❌ Incorrecto
userService.ts
AuthController.ts
create_user_dto.ts
UserService.ts
```

---

## 3. Estructura de Archivos

### 3.1 Límite máximo: 250 líneas por archivo

Cada archivo `.ts` **no debe** exceder las 250 líneas de código efectivo (sin contar imports y líneas en blanco).

```typescript
// Si un archivo supera las 250 líneas, debe dividirse:
//
// user.service.ts (190 líneas) ✅
// ├── user-validation.service.ts (120 líneas)
// └── user-notification.service.ts (85 líneas)
```

### 3.2 Una clase por archivo

```typescript
// ✅ Correcto: user.service.ts
export class UserService {
  // ...
}

// ✅ Correcto: user.controller.ts
export class UserController {
  // ...
}

// ❌ Incorrecto: services.ts
export class UserService { ... }
export class AuthService { ... }  // Debe ir en auth.service.ts
```

### 3.3 Estructura de módulo recomendada

```
modules/
  users/
    dto/
      create-user.dto.ts
      update-user.dto.ts
      user-response.dto.ts
      list-users.query.ts
    entities/
      user.entity.ts
    interfaces/
      user-repository.interface.ts
    user.controller.ts
    user.service.ts
    user.module.ts
    user.repository.ts
    user.guard.ts (opcional)
    user.interceptor.ts (opcional)
    tests/
      unit/
        user.service.spec.ts
      integration/
        user.controller.spec.ts
```

---

## 4. Orden de Importaciones

### 4.1 Reglas

Las importaciones **deben** agruparse en este orden, separadas por una línea en blanco:

1. **Módulos nativos de Node.js**
2. **Dependencias externas** (npm)
3. **Módulos internos** (`@/`, `src/`)
4. **Módulos relativos** (`../`, `./`)
5. **Archivos de estilo/config** (`.css`, `.json`)

### 4.2 Ejemplo

```typescript
// 1. Nativos
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

// 2. Externos
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { Queue } from 'bullmq';

// 3. Internos (alias @/)
import { ConfigService } from '@/config/config.service';
import { DatabaseError } from '@/common/errors/database.error';
import { USER_ROLES } from '@/common/constants/user-roles';

// 4. Relativos
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';
import type { IUserResponse } from './interfaces/user-response.interface';
```

### 4.3 Reglas adicionales

- Preferir `import type` para importaciones que solo son tipos
- No usar `import * as` a menos que sea estrictamente necesario
- Las importaciones de tipos deben ir al final de su grupo
- Mantener orden alfabético dentro de cada grupo

---

## 5. Manejo de Errores

### 5.1 Reglas fundamentales

```typescript
// ❌ Prohibido: catch vacío
try {
  await this.userRepository.save(user);
} catch {
  // No hacer nada
}

// ❌ Prohibido: catch con solo console.error
try {
  await this.userRepository.save(user);
} catch (error) {
  console.error(error);
}

// ✅ Correcto: manejo adecuado
try {
  await this.userRepository.save(user);
} catch (error) {
  this.logger.error('Failed to save user', { userId: user.id, error });
  throw new DatabaseError('Failed to save user', { cause: error });
}
```

### 5.2 Capas de error

| Capa | Tipo de Error | Manejo |
|------|--------------|--------|
| Controller | `HttpException` | NestJS Exception Filter |
| Service | `DomainError` | Log + transformar a HTTP |
| Repository | `DatabaseError` | Log + relanzar |
| Queue | `QueueError` | BullMQ retry mechanism |
| Cache | `CacheError` | Degradación graceful |

### 5.3 Jerarquía de errores personalizados

```typescript
// common/errors/base.error.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    message: string,
    options?: { cause?: Error; correlationId?: string },
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
  }
}

// common/errors/not-found.error.ts
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

// common/errors/validation.error.ts
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 422;
}
```

### 5.4 Exception Filter global

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      this.logger.warn(`Domain error: ${exception.code}`, {
        message: exception.message,
        correlationId: exception.correlationId,
      });
      response.status(exception.statusCode).json({
        error: { code: exception.code, message: exception.message },
      });
      return;
    }

    this.logger.error('Unhandled exception', exception);
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  }
}
```

---

## 6. Async / Await

### 6.1 Reglas

- Usar `async/await` en lugar de `.then()`/`.catch()`
- Nunca mezclar `async/await` con callbacks
- Las promesas deben tener `await` o `.catch()` explícito
- Preferir `Promise.all` sobre `await` secuencial para operaciones independientes

### 6.2 Ejemplos

```typescript
// ❌ Incorrecto
function getUser(id: string): Promise<User> {
  return this.userRepository.findById(id).then(user => {
    if (!user) throw new NotFoundError('User not found');
    return user;
  });
}

// ✅ Correcto
async function getUser(id: string): Promise<User> {
  const user = await this.userRepository.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

// ❌ Incorrecto: operaciones secuenciales independientes
const user = await this.userService.findById(id);
const posts = await this.postService.findByUserId(id);
const notifications = await this.notificationService.findByUserId(id);

// ✅ Correcto: paralelizar operaciones independientes
const [user, posts, notifications] = await Promise.all([
  this.userService.findById(id),
  this.postService.findByUserId(id),
  this.notificationService.findByUserId(id),
]);
```

### 6.3 Timeouts y promesas colgantes

```typescript
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new TimeoutError(`Timed out after ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]);
}
```

---

## 7. Patrones DI de NestJS

### 7.1 Uso correcto de decoradores

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('email') private readonly emailQueue: Queue,
    private readonly configService: ConfigService,
  ) {}
}
```

### 7.2 Scope de proveedores

```typescript
// Singleton (por defecto) — para servicios sin estado
@Injectable()
export class UserService {}

// Request — para servicios con estado por request
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {}

// Transient — nueva instancia por inyección
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {}
```

### 7.3 Módulos bien definidos

```typescript
@Module({
  imports: [
    PrismaModule,
    RedisModule,
    BullModule.registerQueue({ name: 'email' }),
    forwardRef(() => AuthModule), // Solo cuando hay dependencias circulares
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // Solo exportar lo necesario
})
export class UserModule {}
```

### 7.4 Prohibiciones en DI

- ❌ No instanciar servicios manualmente (`new UserService(...)`)
- ❌ No usar `@Inject(forwardRef(() => ...))` si se puede evitar
- ❌ No exportar módulos enteros si solo se necesita un service
- ❌ No crear dependencias circulares entre módulos

---

## 8. Validación de DTOs con Zod

### 8.1 Definición de esquemas

```typescript
// dto/create-user.dto.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2).max(100),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
  password: z.string().min(8).max(128),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

### 8.2 Pipe de validación

```typescript
// common/pipes/zod-validation.pipe.ts
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
```

### 8.3 Uso en controladores

```typescript
@Controller('users')
export class UserController {
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto,
  ): Promise<UserResponse> {
    return this.userService.create(dto);
  }
}
```

### 8.4 Prácticas de Zod

```typescript
// ✅ Siempre usar .safeParse() en lugar de .parse()
const result = schema.safeParse(input);
if (!result.success) {
  // Manejar error
  return result.error.flatten();
}

// ✅ Refinar lógica de negocio
export const PasswordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain a number');

// ✅ Transformar datos en el esquema
export const CreateUserSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
  name: z.string().trim().min(2),
});
```

---

## 9. Requerimientos de Pruebas

### 9.1 Cobertura mínima

| Tipo | Cobertura mínima |
|------|-----------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 85% |
| Lines | 80% |

### 9.2 Tipos de prueba

```typescript
// 📦 Unitarias: probar lógica aislada
// Archivo: user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    mockRepo = { findById: jest.fn() };
    service = new UserService(mockRepo);
  });

  it('should return user when found', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1', name: 'Test' });
    const user = await service.getUser('1');
    expect(user).toBeDefined();
    expect(user.name).toBe('Test');
  });
});

// 🔗 Integración: probar interacción entre capas
// Archivo: user.controller.spec.ts

// 🌐 E2E: probar flujo completo HTTP
// Archivo: user.e2e-spec.ts
```

### 9.3 Estructura de tests

```
src/
  modules/
    users/
      tests/
        unit/
          user.service.spec.ts
          user.repository.spec.ts
        integration/
          user.controller.spec.ts
          user.module.spec.ts
tests/
  e2e/
    users/
      create-user.e2e-spec.ts
      get-user.e2e-spec.ts
  mocks/
    prisma.mock.ts
    redis.mock.ts
  fixtures/
    users.fixture.ts
```

---

## 10. Checklist de Code Review

### 10.1 Funcionalidad

- [ ] El código cumple con los requerimientos funcionales
- [ ] Se cubren casos borde (edge cases)
- [ ] No hay regresiones en funcionalidad existente
- [ ] Los cambios son backward-compatible (o se documenta breaking change)

### 10.2 Arquitectura y Diseño

- [ ] Sigue los principios SOLID
- [ ] No hay dependencias circulares
- [ ] La separación de responsabilidades es clara
- [ ] No hay código duplicado (DRY)
- [ ] Los módulos están correctamente encapsulados

### 10.3 Calidad de Código

- [ ] No supera 250 líneas por archivo
- [ ] Una clase/unidad lógica por archivo
- [ ] Nombres de variables/funciones claros y descriptivos
- [ ] No hay `any` ni type assertions innecesarias
- [ ] Las exportaciones/importaciones son correctas
- [ ] No hay comentarios de código muerto

### 10.4 Pruebas

- [ ] Las pruebas unitarias existen y pasan
- [ ] Las pruebas cubren casos de éxito y error
- [ ] Los mocks son adecuados (no mockear lo que no pertenece)
- [ ] La cobertura no disminuye

### 10.5 Seguridad

- [ ] No hay secretos hardcodeados
- [ ] Validación de entrada con Zod
- [ ] Los decoradores de autenticación/roles están presentes
- [ ] Las queries SQL/Prisma son seguras (no SQL injection)
- [ ] Headers de seguridad (Helmet) configurados

### 10.6 Rendimiento

- [ ] No hay N+1 queries (usar `include` o `select` de Prisma)
- [ ] Las operaciones costosas están cacheadas con Redis
- [ ] Los índices de BD cubren las queries
- [ ] No hay bucles innecesarios o procesamiento redundante

### 10.7 Observabilidad

- [ ] Hay logging adecuado (Winston)
- [ ] Las operaciones críticas están trazadas (OpenTelemetry)
- [ ] Las métricas relevantes están expuestas (Prometheus)
- [ ] Los errores tienen correlationId

---

## 11. Formato y Estilo

### 11.1 ESLint + Prettier

El proyecto usa ESLint con reglas estrictas y Prettier para formato.

```jsonc
// .eslintrc.js — reglas clave
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn', // Usar Logger de NestJS
    'max-lines': ['warn', { max: 250 }],
    'max-classes-per-file': ['error', 1],
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
      'newlines-between': 'always',
    }],
  },
};
```

### 11.2 Otras reglas

- **Indentación:** 2 espacios (no tabs)
- **Comillas:** simples por defecto, dobles en JSX/HTML
- **Punto y coma:** requerido al final
- **Línea máxima:** 100 caracteres
- **Línea final:** siempre una línea en blanco al final
- **Espacios:** un espacio después de `//`, un espacio en objetos `{ key: value }`

---

## 12. Documentación

### 12.1 Comentarios JSDoc

```typescript
/**
 * Crea un nuevo usuario en el sistema.
 *
 * @param dto - Datos validados del usuario a crear
 * @returns El usuario creado con su ID asignado
 * @throws {ValidationError} Si los datos no pasan validaciones de negocio
 * @throws {DuplicateError} Si el email ya existe
 *
 * @example
 * const user = await userService.create({
 *   email: 'test@example.com',
 *   name: 'Test User',
 * });
 */
async create(dto: CreateUserDto): Promise<UserResponse>;
```

### 12.2 README de módulos

Cada módulo debe tener un `README.md` en su directorio explicando:

- Propósito del módulo
- Dependencias
- Eventos que emite/consume
- Variables de entorno requeridas
- Ejemplos de uso
