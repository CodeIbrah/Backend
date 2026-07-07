# Consejos de Rendimiento — Backend Template

> Guía de optimización para mantener la aplicación rápida, escalable y eficiente en recursos.

---

## Índice

- [1. Optimización de Base de Datos](#1-optimización-de-base-de-datos)
- [2. Estrategias de Caché](#2-estrategias-de-caché)
- [3. Procesamiento Asíncrono](#3-procesamiento-asíncrono)
- [4. Rendimiento de Node.js](#4-rendimiento-de-nodejs)
- [5. Pruebas de Carga](#5-pruebas-de-carga)

---

## 1. Optimización de Base de Datos

### 1.1 Índices Eficientes

Analizar las queries más lentas y crear índices apropiados:

```prisma
// schema.prisma
model Order {
  id        String   @id @default(cuid())
  userId    String
  status    OrderStatus
  createdAt DateTime @default(now())

  @@index([userId])              // Filtro por usuario
  @@index([status])              // Filtro por estado
  @@index([createdAt])           // Ordenamiento temporal
  @@index([userId, status])      // Índice compuesto (consultas frecuentes)
}
```

**Reglas para índices:**

| Situación                        | Recomendación                           |
| -------------------------------- | --------------------------------------- |
| Columnas en `WHERE`              | Índice simple                           |
| Columnas en `ORDER BY`           | Índice simple                           |
| Combinación frecuente de filtros | Índice compuesto (orden por cardinalidad descendente) |
| Tablas > 100k registros          | Índices obligatorios para todas las queries frecuentes |
| Columnas con baja cardinalidad   | Índice parcial si es posible            |

**Estrategia avanzada de índices compuestos:**
Colocar primero la columna de mayor cardinalidad (más valores distintos).
Ejemplo: `@@index([userId, status])` funciona mejor que `@@index([status, userId])` porque `userId` tiene más valores únicos que `status`.

**Índices parciales para queries filtradas:**
```prisma
@@index([status], where: "status = 'ACTIVE'")
```

**Índices de cobertura (covering indexes):**
Incluir todas las columnas del `SELECT` en el índice para evitar acceso a tabla:
```prisma
@@index([userId, status, createdAt])  // Si SELECT solo usa estas columnas
```

**Contraindicaciones:**
- Evitar índices en tablas con alta carga de escritura (> 10% writes). Cada índice ralentiza INSERT/UPDATE/DELETE.
- No indexar columnas con menos de 100 valores distintos a menos que sea un índice compuesto.
- Monitorear tamaño de índices: índices que ocupan más del 50% del tamaño de la tabla pueden no ser rentables.

### 1.2 SELECT Solo los Campos Necesarios

```typescript
// ❌ MAL: Trae TODOS los campos (incluyendo passwordHash, etc.)
await prisma.user.findUnique({ where: { id } });

// ✅ BIEN: Solo los campos que necesita la respuesta
await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    profile: {
      select: { avatarUrl: true, bio: true },
    },
  },
});

// ✅ Para listas, evitar relaciones anidadas profundas
await prisma.post.findMany({
  take: 20,
  select: {
    id: true,
    title: true,
    createdAt: true,
    author: { select: { id: true, name: true } },
    // NO incluir comments, likes, etc. en listas
  },
});
```

### 1.3 Operaciones por Lote (Batch)

```typescript
// ❌ MAL: N+1 queries en un bucle
for (const userId of userIds) {
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });
}

// ✅ BIEN: updateMany
await prisma.user.updateMany({
  where: { id: { in: userIds } },
  data: { status: 'ACTIVE' },
});

// ✅ BIEN: $transaction para operaciones mixtas
await prisma.$transaction([
  prisma.order.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'PROCESSING' },
  }),
  prisma.notification.createMany({
    data: userIds.map((id) => ({
      userId: id,
      type: 'ORDER_PROCESSING',
      message: 'Tu pedido está siendo procesado',
    })),
  }),
]);
```

### 1.4 Paginación con Cursor vs Offset

```typescript
// ✅ Para grandes datasets: paginación por cursor
async function getOrders(after?: string, limit = 20) {
  const orders = await prisma.order.findMany({
    take: limit + 1, // +1 para saber si hay más
    cursor: after ? { id: after } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasNext = orders.length > limit;
  const nodes = hasNext ? orders.slice(0, limit) : orders;
  const endCursor = nodes.at(-1)?.id;

  return {
    data: nodes,
    meta: {
      hasNext,
      endCursor,
    },
  };
}

// ✅ Para tablas pequeñas (< 10k): offset
async function getUsers(page = 1, limit = 20) {
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### 1.5 Evitar el Problema N+1

```typescript
// ❌ MAL: Lazy loading — 1 query + N queries
for (const order of orders) {
  const user = await prisma.user.findUnique({ where: { id: order.userId } });
}

// ✅ BIEN: Eager loading con include
const ordersWithUsers = await prisma.order.findMany({
  include: {
    user: { select: { id: true, name: true, email: true } },
  },
});
```

### 1.6 Ajuste del Connection Pool

Configurar el pool de conexiones a PostgreSQL para evitar agotamiento:

```typescript
// DATABASE_URL — añadir parámetros de pool
// postgresql://user:pass@host:5432/dbname?connection_limit=20&pool_timeout=30

// Prisma — límite interno (Prisma v5+ maneja su propio pool)
// Configurar pool en el datasource del schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Prisma v5+ usa pg-pool internamente
}
```

**Regla general:** `connection_limit = 80% de max_connections de PostgreSQL`.
Si PostgreSQL tiene `max_connections=100`, usar `connection_limit=20` por instancia de la app.

**Cálculo por instancia:**
```
max_connections_db = 100
instancias_app     = 4
connection_limit   = floor(100 * 0.8 / 4) = 20
pool_timeout       = 30000 (30s — tiempo máximo esperando por conexión)
```

### 1.7 relationLoadStrategy en Prisma

Usar `relationLoadStrategy: 'join'` para evitar N+1 en consultas que traen relaciones:

```typescript
// ✅ BIEN: JOIN en lugar de N+1 queries
await prisma.order.findMany({
  where: { userId },
  include: {
    items: true,
    user: { select: { id: true, name: true } },
  },
  // En Prisma v5.8+: fuerza JOIN en lugar de query separada
  // relationLoadStrategy: 'join',
});

// Para versiones sin relationLoadStrategy: verificar en logs de Prisma
// que no aparezcan queries repetidas idénticas — señal de N+1
```

### 1.8 Detección de N+1 en Prisma Logs

Habilitar logging de queries para detectar el patrón N+1:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Buscar en los logs: si ves la misma query repetida N veces
// con diferentes parámetros, tienes un N+1:
//
// Query: SELECT id, name FROM User WHERE id = ?  ← repetido 100 veces
//
// Solución: reemplazar el bucle con findMany + where: { id: { in: ids } }

// ✅ Batch findMany en lugar de loop
const ids = [1, 2, 3, 4, 5];
// ❌ MAL:
for (const id of ids) {
  await prisma.user.findUnique({ where: { id } });
}
// ✅ BIEN:
await prisma.user.findMany({ where: { id: { in: ids } } });
```

---

## 2. Estrategias de Caché

### 2.1 Arquitectura de Caché

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Cliente  │────▶│  API     │────▶│  L1      │
│          │     │  Server  │     │  Memoria  │
└─────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                 ┌──────────┐     ┌──────────┐
                 │  L2      │────▶│  DB      │
                 │  Redis   │     │          │
                 └──────────┘     └──────────┘
```

### 2.2 Caché en Memoria (L1 — Node.js)

```typescript
// cache/memory-cache.ts
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL: number;

  constructor(defaultTTLSec = 60) {
    this.defaultTTL = defaultTTLSec * 1000;
    // Limpiar expirados cada minuto
    setInterval(() => this.evictExpired(), 60_000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSec?: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlSec ?? this.defaultTTL) * 1000,
    });
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();
```

### 2.3 Caché con Redis (L2)

```typescript
// cache/redis-cache.service.ts
@Injectable()
export class RedisCacheService {
  constructor(
    @Inject('CACHE_OPTIONS')
    private readonly options: { ttl: number },
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, data: T, ttlSec?: number): Promise<void> {
    await redis.set(key, JSON.stringify(data), {
      EX: ttlSec ?? this.options.ttl,
    });
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}
```

### 2.4 Cache-Aside Pattern

```typescript
async function getUserProfile(userId: string): Promise<UserProfile> {
  const cacheKey = `user:profile:${userId}`;

  // 1. Intentar cache
  const cached = await cache.get<UserProfile>(cacheKey);
  if (cached) return cached;

  // 2. Consultar DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, profile: true },
  });
  if (!user) throw new NotFoundError('User', userId);

  // 3. Almacenar en cache
  await cache.set(cacheKey, user, 300); // 5 min TTL

  return user;
}
```

### 2.5 Estrategias de Invalidación

| Estrategia       | Cuándo Usar                    | Ejemplo                            |
| ---------------- | ------------------------------ | ---------------------------------- |
| TTL fijo         | Datos que cambian poco         | Perfiles de usuario, config        |
| Write-through    | Actualización inmediata        | Inventario, balances               |
| Write-behind     | Tolerancia a datos stale       | Contadores, analytics              |
| Manual purge     | Eventos de dominio             | Webhooks, admin actions            |
| Cache tag        | Invalidación por grupo         | `user:*`, `products:category:*`    |

### 2.6 Response Caching (HTTP)

```typescript
// NestJS — Cache interceptor
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: RedisCacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();

    // Solo cachear GETs
    if (request.method !== 'GET') return next.handle();

    const cacheKey = `http:${request.originalUrl}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return of(cached);

    return next.handle().pipe(
      tap((data) => {
        this.cacheService.set(cacheKey, data, 60);
      }),
    );
  }
}

### 2.7 Caché en Dos Niveles: L1 (Memoria LRU) + L2 (Redis)

Patrón para reducir latencia: L1 en memoria (~1μs) → L2 en Redis (~1ms) → DB (~10ms):

```typescript
// cache/two-tier-cache.service.ts
@Injectable()
export class TwoTierCacheService {
  private readonly l1 = new Map<string, { data: unknown; expiresAt: number }>();
  private readonly l1TTL = 30_000; // 30s en memoria

  constructor(private readonly redis: RedisCacheService) {}

  async get<T>(key: string): Promise<T | null> {
    // 1. L1 — memoria (0.001ms)
    const l1 = this.l1.get(key);
    if (l1 && Date.now() < l1.expiresAt) return l1.data as T;
    this.l1.delete(key);

    // 2. L2 — Redis (~1ms)
    const l2 = await this.redis.get<T>(key);
    if (l2) {
      this.l1.set(key, { data: l2, expiresAt: Date.now() + this.l1TTL });
      return l2;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttlSec = 300): Promise<void> {
    this.l1.set(key, { data, expiresAt: Date.now() + this.l1TTL });
    await this.redis.set(key, data, ttlSec);
  }

  async invalidate(key: string): Promise<void> {
    this.l1.delete(key);
    await this.redis.invalidate(key);
  }
}
```

### 2.8 Prevención de Cache Stampede

Evitar que múltiples procesos recalcular el mismo caché simultáneamente:

```typescript
async function getOrCompute<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSec = 300,
): Promise<T> {
  // 1. Intentar cache
  const cached = await cache.get<T>(key);
  if (cached) return cached;

  // 2. Lock atómico en Redis — solo uno computa
  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, '1', {
    NX: true,   // Solo si no existe
    EX: 10,     // Timeout de 10s
  });

  if (!acquired) {
    // Otro proceso está computando — esperar y reintentar
    await new Promise((r) => setTimeout(r, 50));
    return getOrCompute(key, fetcher, ttlSec);
  }

  try {
    // 3. Double-check después del lock
    const doubleCheck = await cache.get<T>(key);
    if (doubleCheck) return doubleCheck;

    // 4. Computar y almacenar
    const data = await fetcher();
    await cache.set(key, data, ttlSec);
    return data;
  } finally {
    await redis.del(lockKey);
  }
}
```

### 2.9 Cache con Content Negotiation

Variar el caché según idioma y encoding del cliente:

```typescript
@Injectable()
export class ContentAwareCacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: RedisCacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    // Incluir variaciones en la clave de cache
    const lang = request.headers['accept-language']?.split(',')[0] ?? 'en';
    const encoding = request.headers['accept-encoding'] ?? 'identity';
    const cacheKey = `http:${request.originalUrl}:lang=${lang}:encoding=${encoding}`;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) return of(cached);

    return next.handle().pipe(
      tap((data) => {
        this.cacheService.set(cacheKey, data, 60);
      }),
    );
  }
}
```

---

## 3. Procesamiento Asíncrono

### 3.1 BullMQ — Colas de Trabajo

```typescript
// queues/email.queue.ts
import { Queue } from 'bullmq';
import { redis } from '../config/redis.config';

export const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { age: 3600 }, // Limpiar después de 1h
    removeOnFail: { age: 86400 },     // Retener fallos por 24h
  },
});

// queues/email.processor.ts
import { Worker } from 'bullmq';

const worker = new Worker<EmailJobData>(
  'email',
  async (job) => {
    const { to, subject, body } = job.data;
    // Lógica de envío
    await sendEmail(to, subject, body);
  },
  {
    connection: redis,
    concurrency: 5,         // 5 trabajos simultáneos por worker
    limiter: {
      max: 10,              // Máximo 10 por...
      duration: 1000,       // ...segundo
    },
  },
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} falló: ${err.message}`);
});
```

### 3.2 Cuándo Usar Background Jobs

| Operación                        | Síncrona | Asíncrona (Cola) |
| -------------------------------- | -------- | ---------------- |
| Envío de emails                  | ❌       | ✅               |
| Procesamiento de imágenes        | ❌       | ✅               |
| Generación de reportes           | ❌       | ✅               |
| Notificaciones push              | ❌       | ✅               |
| Webhooks a terceros              | ❌       | ✅               |
| Operaciones CRUD simples         | ✅       | ❌               |
| Lecturas de cache                | ✅       | ❌               |
| Validación de datos              | ✅       | ❌               |
| Consultas rápidas a DB (< 100ms) | ✅       | ❌               |

### 3.3 Monitoreo de Colas

```typescript
// health/queue.health.ts
async function checkQueueHealth(): Promise<QueueHealth> {
  const [waiting, active, failed, completed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getFailedCount(),
    emailQueue.getCompletedCount(),
  ]);

  return {
    queue: 'email',
    waiting,
    active,
    failed,
    completed,
    isHealthy: failed < 100, // Alerta si más de 100 fallos
  };
}
```

---

## 4. Rendimiento de Node.js

### 4.1 Event Loop — No Bloquear el Hilo Principal

```typescript
// ❌ MAL: Bloquea el event loop
function hashPassword(password: string): string {
  for (let i = 0; i < 100_000_000; i++) {
    // Cómputo pesado síncrono
  }
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ✅ BIEN: Delegar a Worker Threads
import { Worker } from 'worker_threads';

function hashPasswordAsync(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./hash.worker.js', {
      workerData: { password },
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

### 4.2 Gestión de Memoria

```typescript
// Configuración recomendada para Node.js
// --max-old-space-size=2048   (2GB para heap)
// --gc-interval=100           (ejecutar GC cada 100ms en idle)
// --expose-gc                 (permitir gc() manual)

// Monitorear uso de memoria
function logMemoryUsage(): void {
  const usage = process.memoryUsage();
  logger.info({
    event: 'memory.usage',
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`,
  });
}
```

### 4.3 GC Tuning

| Variable                      | Valor   | Efecto                            |
| ----------------------------- | ------- | --------------------------------- |
| `--max-old-space-size`        | 2048    | Límite de heap (ajustar según RAM disponible) |
| `--optimize-for-size`         | activo  | Optimiza para uso de memoria      |
| `--max-semi-space-size`       | 64      | Tamaño del semi-space (afecta GC joven) |

**Recomendaciones según perfil de la app:**

| Perfil                        | `--max-old-space-size` | `--max-semi-space-size` | Razon                          |
| ----------------------------- | ---------------------- | ----------------------- | ------------------------------ |
| API REST (uso general)        | 2048                   | 64                      | Balance entre throughput y memoria |
| API con caching pesado        | 4096                   | 128                     | Mas heap para datos cacheados  |
| Procesamiento de archivos     | 1024                   | 256                     | Prioriza GC joven para objetos temporales |
| Microservicio de colas        | 512                    | 32                      | Liviano, pocos objetos longevos |

**Monitoreo de GC en produccion:**

```typescript
import { performance, PerformanceObserver } from 'perf_hooks';

const gcObserver = new PerformanceObserver((list) => {
  const entry = list.getEntries()[0];
  logger.warn({
    event: 'gc.pause',
    duration: `${entry.duration.toFixed(2)}ms`,
    type: entry.detail?.kind,
    timestamp: new Date().toISOString(),
  });
});
gcObserver.observe({ entryTypes: ['gc'] });
```

### 4.4 Streaming para Payloads Grandes

```typescript
// ✅ Usar streams para archivos grandes
@Get('/export')
async exportData(@Res() res: Response): Promise<void> {
  const stream = await prisma.user.findStream({
    select: { id: true, email: true, name: true },
    batchSize: 1000,
  });

  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  let first = true;

  for await (const user of stream) {
    if (!first) res.write(',');
    res.write(JSON.stringify(user));
    first = false;
  }

  res.write(']');
  res.end();
}
```

### 4.5 Conexiones Persistentes

```typescript
// Habilitar Keep-Alive en Express
const server = app.listen(3000);
server.keepAliveTimeout = 61_000; // Ligeramente mayor que el LB
server.headersTimeout = 65_000;   // Mayor que keepAliveTimeout
server.requestTimeout = 30_000;

// Configurar agente HTTP para llamadas externas
import https from 'https';

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,     // Máximo 50 conexiones simultáneas
  maxFreeSockets: 10,
  timeout: 30_000,    // Timeout para socket idle
});
```

### 4.6 Perfilado con Clinic.js

Flujo de diagnostico de rendimiento con Clinic.js:

```bash
# 1. Clinic Doctor — analisis rapido
npx clinic doctor -- node dist/main.js

# 2. Clinic Flame — identificar funciones lentas
npx clinic flame -- node dist/main.js

# 3. Clinic Bubbleprof — latencia entre operaciones async
npx clinic bubbleprof -- node dist/main.js

# 4. Combinar con autocannon para carga controlada
npx clinic doctor -- autocannon -c 10 -d 30 http://localhost:3000/api/v1/health
```

**Uso en desarrollo:**
Ejecutar Clinic Doctor despues de identificar endpoints lentos en produccion.
El reporte HTML muestra CPU flame graph, async traces y sugerencias de optimizacion.

### 4.7 Monitoreo del Event Loop

Detectar bloqueos del event loop con `monitorEventLoopDelay`:

```typescript
import { monitorEventLoopDelay } from 'perf_hooks';

const eventLoopMonitor = monitorEventLoopDelay();
eventLoopMonitor.enable();

// Health check endpoint
@Get('/health/event-loop')
getEventLoopHealth() {
  const p50 = eventLoopMonitor.percentile(50) / 1e6; // ms
  const p95 = eventLoopMonitor.percentile(95) / 1e6;
  const p99 = eventLoopMonitor.percentile(99) / 1e6;

  return {
    eventLoopDelayMs: { p50, p95, p99 },
    healthy: p99 < 50, // Alerta si p99 > 50ms
  };
}
```

### 4.8 Gestion de Contexto Asincrono

Evitar el uso de `AsyncLocalStorage` en hot paths por su overhead:

```typescript
// ❌ MAL: AsyncLocalStorage en cada request (hot path)
import { AsyncLocalStorage } from 'async_hooks';
const als = new AsyncLocalStorage();

// ✅ BIEN: cls-rtracer (optimizado) o pasar correlationId manualmente
import { Express } from 'express';
import * as clsRtr from 'cls-rtracer';

// En main.ts
app.use(clsRtr.expressMiddleware());

// En cualquier servicio
import { getRContext } from 'cls-rtracer';
const correlationId = getRContext() as string;
```

**Alternativas recomendadas:**
- `cls-rtracer` — bajo overhead, especifico para correlacion de logs
- Pasar `correlationId` como parametro explicito en llamadas internas
- Usar `AsyncLocalStorage` solo para casos donde realmente se necesita contexto global

### 4.9 diagnostics_channel (Node 20+)

Canal nativo de diagnosticos de Node.js para metricas de runtime:

```typescript
import { subscribe } from 'diagnostics_channel';

// Monitorear creacion de HTTP requests
subscribe('http.client.request.start', (data) => {
  logger.debug({ event: 'http.request', method: data.method, url: data.url });
});

// Monitorear eventos del event loop
subscribe('tick', (data) => {
  // Procesar metricas de tick
});

// Monitorear consultas de base de datos
subscribe('prisma:query', (data) => {
  logger.debug({ event: 'prisma.query', duration: data.duration, query: data.query });
});
```

### 4.10 HTTP/2

Node 20+ soporta HTTP/2 nativamente para reducir latencia con multiplexacion:

```typescript
import http2 from 'http2';
import { readFileSync } from 'fs';

const server = http2.createSecureServer({
  key: readFileSync('server.key'),
  cert: readFileSync('server.cert'),
});

server.on('stream', (stream, headers) => {
  stream.respond({ ':status': 200 });
  stream.end('Hello HTTP/2');
});

server.listen(3000);
```

**Cuando usar HTTP/2:**
- Microservicios con muchas peticiones concurrentes
- APIs con multiples recursos empaquetados
- Detras de un reverse proxy que termina HTTP/2 (Nginx, Cloudflare)

---

## 5. Pruebas de Carga

### 5.1 Herramientas Recomendadas

| Herramienta       | Uso                    |
| ----------------- | ---------------------- |
| **k6**            | Pruebas de carga modernas con scripting JS |
| **autocannon**    | Benchmark HTTP rápido  |
| **artillery**     | Pruebas de estrés con escenarios          |
| **wrk**           | Benchmark HTTP básico  |

### 5.2 Script de Prueba con k6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Subir a 100 usuarios
    { duration: '5m', target: 100 },  // Mantener
    { duration: '2m', target: 200 },  // Escalar a 200
    { duration: '5m', target: 200 },  // Mantener
    { duration: '2m', target: 0 },    // Bajar
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% de requests bajo 500ms
    errors: ['rate<0.05'],            // Errores < 5%
  },
};

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:3000/api/v1';

export default function () {
  const token = __ENV.TEST_TOKEN;

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // GET /users
  const res = http.get(`${BASE_URL}/users?page=1&limit=20`, params);
  check(res, {
    'status es 200': (r) => r.status === 200,
    'respueesta menor a 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);

  sleep(1);
}
```

### 5.3 Métricas Clave a Monitorear

| Métrica                      | Límite Saludable | Acción si se Excede          |
| ---------------------------- | ---------------- | ---------------------------- |
| `p95 response time`          | < 500ms          | Optimizar query o cache      |
| `p99 response time`          | < 1000ms         | Revisar cuellos de botella   |
| `Error rate`                 | < 1%             | Revisar logs de error        |
| `CPU usage`                  | < 70%            | Escalar horizontalmente      |
| `Memory usage`               | < 80%            | Revisar memory leaks         |
| `DB connection pool usage`   | < 70%            | Aumentar pool o optimizar    |
| `Event loop delay`           | < 50ms           | Revisar tareas bloqueantes   |

### 5.4 Objetivos de Rendimiento Referencia

| Operación            | Tiempo Esperado | Condición                  |
| -------------------- | --------------- | -------------------------- |
| GET lista (20 items) | < 100ms         | Con cache habilitado       |
| GET detalle          | < 50ms          | Con cache habilitado       |
| POST creación        | < 200ms         | Sin procesos asíncronos    |
| PATCH actualización  | < 150ms         | Sin notificaciones         |
| Autenticación        | < 300ms         | Incluyendo JWT sign/verify |

### 5.5 Benchmark Rapido con autocannon

```bash
# Benchmark basico — 100 conexiones concurrentes durante 30s
npx autocannon -c 100 -d 30 http://localhost:3000/api/v1/health

# Con pipeline (multiples peticiones por conexion)
npx autocannon -c 50 -p 10 -d 60 http://localhost:3000/api/v1/users

# Salida en JSON para procesar
npx autocannon -c 100 -d 30 --json http://localhost:3000/api/v1/health > benchmark.json
```

**Interpretacion de resultados:**
| Stat    | 2.5% | 50%  | 97.5% | 99%  | Avg     | Stdev   | Max  |
| ------- | ---- | ---- | ----- | ---- | ------- | ------- | ---- |
| Latency | 5 ms | 12 ms| 45 ms |78 ms | 15.2 ms | 23.4 ms | 350  |

### 5.6 Clinic.js + autocannon

Generar perfil de rendimiento bajo carga real:

```bash
# 1. Iniciar la app con Clinic Doctor
npx clinic doctor -- node dist/main.js &
CLINIC_PID=$!

# 2. Esperar que inicie
sleep 3

# 3. Ejecutar carga con autocannon
npx autocannon -c 50 -d 30 http://localhost:3000/api/v1/health

# 4. Detener Clinic
kill $CLINIC_PID
# El reporte .html se abre automaticamente
```

### 5.7 Umbral de Duracion de Queries Prisma en k6

Extender el script de k6 para verificar duracion de queries Prisma:

```javascript
// load-test.js — anadir threshold para Prisma
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_duration: ['p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    // Threshold personalizado para queries lentas
    'prisma_query_duration': ['p(95)<100'], // 95% de queries < 100ms
  },
};
```

---

> **Revisión**: Los objetivos de rendimiento deben recalibrarse trimestralmente basándose en datos de producción.
