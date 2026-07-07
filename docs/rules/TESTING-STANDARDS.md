# Estándares de Pruebas — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Framework:** Jest 29+  
> **Herramientas:** Supertest, Prisma Test Utils, Test Containers

---

## Índice

1. [Introducción](#1-introducción)
2. [Pirámide de Pruebas](#2-pirámide-de-pruebas)
3. [Pruebas Unitarias](#3-pruebas-unitarias)
4. [Pruebas de Integración](#4-pruebas-de-integración)
5. [Pruebas E2E](#5-pruebas-e2e)
6. [Nomenclatura de Pruebas](#6-nomenclatura-de-pruebas)
7. [Estrategia de Mocks](#7-estrategia-de-mocks)
8. [Cobertura Mínima](#8-cobertura-mínima)
9. [Organización de Archivos](#9-organización-de-archivos)
10. [Configuración de Jest](#10-configuración-de-jest)
11. [Fixtures y Factories](#11-fixtures-y-factories)
12. [Pruebas de Base de Datos](#12-pruebas-de-base-de-datos)
13. [Pruebas de Redis y Colas](#13-pruebas-de-redis-y-colas)
14. [Buenas Prácticas](#14-buenas-prácticas)

---

## 1. Introducción

Las pruebas automatizadas son una parte fundamental de nuestro proceso de desarrollo. Este documento define los estándares, herramientas y prácticas para garantizar que el código tenga una cobertura adecuada y que las pruebas sean mantenibles, rápidas y confiables.

### 1.1 Principios

| Principio | Descripción |
|-----------|-------------|
| **Rápidas** | Las pruebas unitarias deben correr en ms |
| **Aisladas** | Ninguna prueba depende de otra |
| **Deterministas** | Mismo resultado siempre, sin flakiness |
| **Legibles** | Nombres descriptivos, estructura clara |
| **Mantenibles** | Fáciles de actualizar cuando cambia el código |

---

## 2. Pirámide de Pruebas

### 2.1 Distribución

```
         ╱╲
        ╱  ╲
       ╱ E2E╲           ← 10% — Pruebas de flujo completo
      ╱──────╲
     ╱        ╲
    ╱ Integra. ╲        ← 30% — Pruebas entre capas
   ╱────────────╲
  ╱              ╲
 ╱   Unitarias    ╲      ← 60% — Pruebas de lógica aislada
╱──────────────────╲
```

| Nivel | Velocidad | Confianza | Mantenimiento | % Esperado |
|-------|-----------|-----------|---------------|------------|
| **Unitarias** | ms | Baja | Bajo | 60% |
| **Integración** | s | Media | Medio | 30% |
| **E2E** | min | Alta | Alto | 10% |

### 2.2 Cuándo usar cada nivel

- **Unitarias:** Lógica de negocio, validación, transformación de datos
- **Integración:** Controladores, servicios con dependencias, endpoints
- **E2E:** Flujos críticos completos (login, crear recurso, verificar)

---

## 3. Pruebas Unitarias

### 3.1 Definición

Prueban una **unidad aislada** de código (función, método, clase) con todas sus dependencias mockeadas.

### 3.2 Estructura

```typescript
// src/modules/users/tests/unit/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@/modules/users/user.service';
import { UserRepository } from '@/modules/users/user.repository';
import { NotFoundError } from '@/common/errors/not-found.error';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user data when user exists', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' };
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.getUser('1');

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getUser('999')).rejects.toThrow(NotFoundError);
    });

    it('should throw DatabaseError when repository fails', async () => {
      repository.findById.mockRejectedValue(new Error('DB connection lost'));
      await expect(service.getUser('1')).rejects.toThrow(DatabaseError);
    });
  });
});
```

### 3.3 Reglas para unitarias

- 100% de las dependencias mockeadas
- Probar casos: éxito, error, edge cases
- No hacer llamadas reales a BD, Redis, HTTP
- Una prueba por comportamiento
- Nombres descriptivos con `should`

---

## 4. Pruebas de Integración

### 4.1 Definición

Prueban la interacción entre **múltiples capas** (controlador + servicio + repositorio real) usando una base de datos real o en memoria.

### 4.2 Estructura

```typescript
// src/modules/users/tests/integration/user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/common/services/prisma.service';
import { createTestUser } from '../../../../tests/fixtures/users.fixture';

describe('UserController (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/users/:id', () => {
    it('should return 200 and user data when user exists', async () => {
      const user = await createTestUser(prisma, {
        email: 'test@test.com',
        name: 'Test User',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body).toEqual({
        id: user.id,
        email: 'test@test.com',
        name: 'Test User',
      });
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body).toEqual({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    });

    it('should return 401 when no auth token provided', async () => {
      await request(app.getHttpServer())
        .get('/api/users/1')
        .expect(401);
    });
  });
});
```

### 4.3 Reglas para integración

- Usar base de datos real (testcontainers o PostgreSQL de test)
- Limpiar datos entre pruebas
- Probar autenticación/autorización
- Probar validación de entrada
- Probar respuestas HTTP (status, body, headers)

---

## 5. Pruebas E2E

### 5.1 Definición

Prueban el **flujo completo** desde la request HTTP hasta la base de datos, incluyendo servicios externos.

### 5.2 Estructura

```typescript
// tests/e2e/users/create-user.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/common/services/prisma.service';

describe('Create User Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('should complete full user creation flow', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'newuser@test.com', password: 'StrongPass1', name: 'New User' })
      .expect(201);

    expect(registerResponse.body).toHaveProperty('id');
    const userId = registerResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'newuser@test.com', password: 'StrongPass1' })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('accessToken');
    const token = loginResponse.body.accessToken;

    const profileResponse = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileResponse.body.id).toBe(userId);

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser).toBeDefined();
    expect(dbUser.email).toBe('newuser@test.com');
  });
});
```

### 5.3 Reglas para E2E

- Probar solo flujos críticos (happy path)
- Usar base de datos limpia para cada suite
- No mockear servicios externos (usar testcontainers)
- Mínimo 1 prueba E2E por módulo principal

---

## 6. Nomenclatura de Pruebas

### 6.1 Nombres de archivos

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Unitarias** | `*.spec.ts` | `user.service.spec.ts` |
| **Integración** | `*.spec.ts` | `user.controller.spec.ts` |
| **E2E** | `*.e2e-spec.ts` | `create-user.e2e-spec.ts` |

### 6.2 Nombres de tests

```typescript
// Formato: should [expected behavior] when [scenario]

// Correcto
it('should return user data when user exists');
it('should throw NotFoundError when user does not exist');
it('should return 401 when no auth token provided');
it('should reject duplicate email on registration');

// Incorrecto
it('should work');
it('test user service');
it('getUser');
it('test 1');
```

### 6.3 Estructura de describe

```typescript
describe('UserService', () => {           // Clase o módulo
  describe('getUser', () => {             // Método o función
    it('should return user when exists');
    it('should throw when not found');
  });
  describe('create', () => {
    it('should create and return new user');
    it('should reject duplicate email');
  });
});
```

---

## 7. Estrategia de Mocks

### 7.1 Qué mockear

| Mockear | NO Mockear |
|---------|------------|
| Repositorios (Prisma) | DTOs y schemas |
| Servicios externos (API) | Helpers puros |
| Colas (BullMQ) | Utilidades de tipos |
| Cache (Redis) | Constantes |
| Email, SMS, notificaciones | Zod validators |
| Módulos de infraestructura | Lógica de negocio simple |

### 7.2 Cómo mockear

```typescript
// Mock completo de un servicio
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Mock de Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock de Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  incr: jest.fn(),
};

// Mock de BullMQ
const mockQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
  remove: jest.fn(),
};
```

### 7.3 Reglas de mocks

- Mockear en el nivel de abstracción correcto
- Resetear mocks entre pruebas (`jest.clearAllMocks()`)
- Verificar interacciones (`toHaveBeenCalledWith`)
- No mockear lo que no se usa en la prueba
- No mockear tipos primitivos o funciones puras

---

## 8. Cobertura Mínima

### 8.1 Umbrales

```jsonc
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 75,
        "functions": 85,
        "lines": 80,
        "statements": 80
      },
      "src/modules/**/*.service.ts": {
        "branches": 80, "functions": 90, "lines": 85
      },
      "src/modules/**/*.controller.ts": {
        "branches": 70, "functions": 80, "lines": 75
      },
      "src/common/**/*.ts": {
        "branches": 80, "functions": 90, "lines": 85
      }
    }
  }
}
```

### 8.2 Áreas obligatorias

| Área | Cobertura mínima | Prioridad |
|------|-----------------|-----------|
| Servicios (lógica de negocio) | 90% | Alta |
| Controladores | 80% | Media |
| Guards | 100% | Alta |
| Pipes de validación | 100% | Alta |
| Filters de error | 100% | Alta |
| DTOs / Schemas | 100% | Media |

### 8.3 Exclusiones permitidas

```jsonc
{
  "coveragePathIgnorePatterns": [
    "src/main.ts", "src/app.module.ts",
    "src/**/*.module.ts", "src/**/*.d.ts",
    "src/common/decorators/*", "src/common/interfaces/*"
  ]
}
```

---

## 9. Organización de Archivos

### 9.1 Estructura

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
    auth/
      tests/
        unit/
          auth.service.spec.ts
          jwt.guard.spec.ts
        integration/
          auth.controller.spec.ts
tests/
  e2e/
    users/create-user.e2e-spec.ts
    auth/login.e2e-spec.ts
  mocks/
    prisma.mock.ts
    redis.mock.ts
    queue.mock.ts
  fixtures/
    users.fixture.ts
    auth.fixture.ts
  helpers/
    test-database.ts
    auth-helper.ts
```

### 9.2 Principio de cercanía

Los tests deben estar lo más cerca posible del código que prueban:

```
// Correcto: Tests junto al módulo
src/modules/users/user.service.ts
src/modules/users/tests/unit/user.service.spec.ts

// Incorrecto: Tests en carpeta separada
src/modules/users/user.service.ts
tests/unit/user-service.spec.ts
```

---

## 10. Configuración de Jest

### 10.1 Configuración base

```javascript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterSetup: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
};

export default config;
```

### 10.2 Scripts de package.json

```jsonc
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern='tests/unit|spec\\.ts$'",
    "test:integration": "jest --testPathPattern='tests/integration'",
    "test:e2e": "jest --config ./jest-e2e.config.ts",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --ci --maxWorkers=2"
  }
}
```

---

## 11. Fixtures y Factories

### 11.1 Factory pattern

```typescript
// tests/fixtures/users.fixture.ts
import { faker } from '@faker-js/faker';
import { PrismaService } from '@/common/services/prisma.service';

interface CreateTestUserOptions {
  email?: string;
  name?: string;
  role?: UserRole;
}

export async function createTestUser(
  prisma: PrismaService,
  options: CreateTestUserOptions = {},
) {
  const data = {
    email: options.email ?? faker.internet.email(),
    name: options.name ?? faker.person.fullName(),
    role: options.role ?? UserRole.USER,
  };

  return prisma.user.create({ data });
}

export function buildUserDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
  return {
    email: 'test@example.com',
    password: 'StrongPass1',
    name: 'Test User',
    ...overrides,
  };
}
```

### 11.2 Faker para datos realistas

```typescript
// Usar faker.js para datos de prueba realistas
import { faker } from '@faker-js/faker';

export function generateUserData() {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    bio: faker.lorem.sentence(),
    avatarUrl: faker.image.avatar(),
  };
}
```

---

## 12. Pruebas de Base de Datos

### 12.1 Testcontainers

```typescript
// tests/global-setup.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export default async function globalSetup() {
  const container = await new PostgreSqlContainer()
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.TEST_CONTAINER = 'true';
}
```

### 12.2 Prisma con datos de prueba

```typescript
// tests/helpers/test-database.ts
import { PrismaClient } from '@prisma/client';

export class TestDatabase {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async cleanDatabase(): Promise<void> {
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" CASCADE;`,
        );
      }
    }
  }
}
```

---

## 13. Pruebas de Redis y Colas

### 13.1 Mock de Redis

```typescript
// tests/mocks/redis.mock.ts
export function createRedisMock() {
  const store = new Map<string, { value: string; ttl?: number }>();

  return {
    get: jest.fn(async (key: string) => store.get(key)?.value ?? null),
    set: jest.fn(async (key: string, value: string, mode?: string, ttl?: number) => {
      store.set(key, { value, ttl });
      return 'OK';
    }),
    del: jest.fn(async (key: string) => store.delete(key) ? 1 : 0),
    expire: jest.fn(async () => true),
    incr: jest.fn(async () => 1),
    sadd: jest.fn(async () => 1),
    sismember: jest.fn(async () => 0),
    smembers: jest.fn(async () => []),
    lpush: jest.fn(async () => 1),
    rpush: jest.fn(async () => 1),
    lrange: jest.fn(async () => []),
    flushall: jest.fn(async () => 'OK'),
    quit: jest.fn(async () => 'OK'),
  } as unknown as jest.Mocked<Redis>;
}
```

### 13.2 Mock de BullMQ

```typescript
// tests/mocks/queue.mock.ts
export function createQueueMock() {
  return {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(true),
    getCompleted: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Queue>;
}
```

---

## 14. Buenas Prácticas

### 14.1 Lo que siempre debes hacer

- Escribir tests antes del código (TDD) cuando sea posible
- Probar comportamientos, no implementaciones
- Usar el patrón AAA (Arrange, Act, Assert)
- Mantener los tests independientes y ordenables
- Usar `describe` anidado para organizar
- Priorizar la legibilidad del test

### 14.2 Lo que nunca debes hacer

- Compartir estado mutable entre tests
- Usar `it.only` o `describe.only` en commits
- Escribir tests que dependan del orden de ejecución
- Probar implementaciones privadas
- Dejar tests flaky sin marcar
- Ignorar tests fallidos

### 14.3 Patrón AAA

```typescript
it('should return filtered users when query matches', async () => {
  // Arrange — Preparar datos y mocks
  const query = 'john';
  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@test.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@test.com' },
  ];
  repository.search.mockResolvedValue([mockUsers[0]]);

  // Act — Ejecutar la acción
  const result = await service.searchUsers(query);

  // Assert — Verificar resultados
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('John Doe');
  expect(repository.search).toHaveBeenCalledWith(query);
});
```

### 14.4 Tests de errores y edge cases

```typescript
describe('error handling', () => {
  it('should handle null input gracefully', async () => {
    await expect(service.process(null)).rejects.toThrow(ValidationError);
  });

  it('should handle empty array input', async () => {
    const result = await service.processBatch([]);
    expect(result).toEqual({ processed: 0, failed: 0 });
  });

  it('should handle concurrent requests without race conditions', async () => {
    const results = await Promise.all([
      service.incrementCounter('key'),
      service.incrementCounter('key'),
      service.incrementCounter('key'),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  it('should timeout when service is unresponsive', async () => {
    repository.findById.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10000)),
    );
    await expect(service.getUserWithTimeout('1', 100)).rejects.toThrow(TimeoutError);
  });
});
```

### 14.5 Test de guards y pipes

```typescript
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  it('should allow access when valid token is provided', async () => {
    const context = createMockExecutionContext({
      headers: { authorization: 'Bearer valid-token' },
      user: { sub: '1', role: UserRole.USER },
    });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should deny access when no token is provided', async () => {
    const context = createMockExecutionContext({ headers: {} });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
```
