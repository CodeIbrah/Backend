# Esquema de Base de Datos — Backend Template

## 1. Tecnología y Configuración

### 1.1 Stack de Base de Datos

| Componente          | Tecnología                  | Propósito                         |
| ------------------- | --------------------------- | --------------------------------- |
| **ORM**             | Prisma ORM v6               | Modelado, migraciones, queries    |
| **Motor**           | PostgreSQL 15               | Base de datos relacional principal |
| **Cache**           | Redis 7                     | Caché, sesiones, rate limiting    |
| **Pool de conexiones**| Prisma internas (pgbouncer)| Conexiones concurrentes           |
| **Migraciones**     | `prisma migrate`            | Versionado de esquema             |

### 1.2 Configuración de Conexión

```prisma
// packages/shared-prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [uuid-ossp, pg_trgm]
}
```

```typescript
// main/src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

### 1.3 Connection Pooling

```
+------------------------------------------------------------------+
|                    CONNECTION POOLING                             |
|                                                                   |
|  Prisma Client                                                    |
|       │                                                           |
|       │  DATABASE_URL=postgresql://user:pass@host:5432/db         |
|       │  Connection limit: 20 (configurable via DATABASE_URL)    |
|       ▼                                                           |
|  +----------------------------------------------------------+    |
|  |              PgBouncer (Transaction mode)                 |    |
|  |  Pool size: 20 ─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─  |    |
|  +----------------------------------------------------------+    |
|       │                                                           |
|       ▼                                                           |
|  +----------------------------------------------------------+    |
|  |              PostgreSQL 15 (max_connections=100)          |    |
|  |  Shared buffers: 2GB, Work mem: 256MB                    |    |
|  +----------------------------------------------------------+    |
|                                                                   |
+------------------------------------------------------------------+
```

---

## 2. Modelos de Datos

### 2.1 Diagrama Entidad-Relación

```
+------------------+       +------------------+       +------------------+
|      User        |       |   SocialAccount  |       |   RefreshToken   |
+------------------+       +------------------+       +------------------+
| id (PK, UUID)    |◀──┐  | id (PK, UUID)    |       | id (PK, UUID)    |
| email (UQ)       |   ├──│ userId (FK)       |       | userId (FK)      |
| password?        |   │  │ provider          |       | tokenHash (UQ)   |
| name?            |   │  │ providerAccountId |       | expiresAt        |
| role (enum)      |   │  │ email?            |       | revokedAt?       |
| isActive         |   │  │ accessToken?      |       | createdAt        |
| createdAt        |   │  │ refreshToken?     |       +------------------+
| updatedAt        |   │  │ profileData?      |
+------------------+   │  +------------------+
       │               │
       │               │
       ├───────────────┘
       ▼
+------------------+       +------------------+       +------------------+
|    ActivityLog   |       |    AuditLog      |       |  AnalyticsEvent  |
+------------------+       +------------------+       +------------------+
| id (PK, UUID)    |       | id (PK, UUID)    |       | id (PK, UUID)    |
| userId (FK)       |       | userId (FK)?     |       | type (enum)      |
| type (enum)      |       | action           |       | userId (FK)?     |
| severity (enum)  |       | resource         |       | metadata (Json?) |
| action           |       | details (Json?)  |       | timestamp        |
| resource?        |       | ipAddress?       |       | traceId?         |
| description?     |       | userAgent?       |       | service?         |
| metadata (Json?) |       | createdAt        |       +------------------+
| ipAddress?       |       +------------------+
| traceId?         |                              +------------------+
| createdAt        |                              |    ErrorLog      |
+------------------+                              +------------------+
       │                                          | id (PK, UUID)    |
       │                                          | message          |
       ▼                                          | stack?           |
+------------------+       +------------------+    | level            |
|   Incident       |       |  Notification   |    | service          |
+------------------+       +------------------+    | traceId?         |
| id (PK, UUID)    |       | id (PK, UUID)    |    | context (Json?)  |
| severity (enum)  |       | userId (FK)      |    | createdAt        |
| title            |       | type (enum)      |    +------------------+
| description      |       | status (enum)    |
| rootCause?       |       | title            |
| suggestedFix?    |       | message          |
| status (enum)    |       | channel?         |
| userId (FK)?     |       | metadata (Json?) |
| createdAt        |       | sentAt?          |
| updatedAt        |       | readAt?          |
| resolvedAt?      |       | failedAt?        |
+------------------+       +------------------+

+------------------+       +------------------+       +------------------+
|     Payment      |       |  PaymentLedger   |       |    Invoice       |
+------------------+       +------------------+       +------------------+
| id (PK, UUID)    |       | id (PK, UUID)    |       | id (PK, UUID)    |
| userId (FK)      |       | paymentId (FK)   |       | number (UQ)      |
| amount (Decimal) |       | entryType        |       | userId (FK)      |
| currency         |       | amount (Decimal) |       | paymentId (UQ,FK)|
| status (enum)    |       | balance (Decimal)|       | amount (Decimal) |
| method (enum)    |       | description      |       | currency         |
| provider (enum)  |       | createdAt        |       | status           |
| providerId?      |       +------------------+       | dueDate          |
| idempotencyKey   |                                  | paidAt?          |
| metadata (Json?) |       +------------------+       | metadata (Json?) |
| failureReason?   |       |    Receipt       |       | createdAt        |
| refundedAmount   |       +------------------+       | updatedAt        |
| createdAt        |       | id (PK, UUID)    |       +------------------+
| completedAt?     |       | paymentId (FK)   |
| refundedAt?      |◀──────│ userId (FK)      |
+------------------+       | number (UQ)      |
       │                   | amount (Decimal) |
       ▼                   | currency         |
       │                   | issuedAt         |
       │                   | metadata (Json?) |
       │                   +------------------+
```

### 2.2 Modelo: User

```prisma
enum Role {
  ADMIN
  USER
  MODERATOR
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?
  name      String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  analyticsEvents AnalyticsEvent[]
  incidents       Incident[]
  auditLogs       AuditLog[]
  activityLogs    ActivityLog[]
  socialAccounts  SocialAccount[]
  refreshTokens   RefreshToken[]
  payments        Payment[]
  invoices        Invoice[]
  receipts        Receipt[]
  notifications   Notification[]

  @@index([email])
  @@index([role])
  @@index([isActive, createdAt(sort: Desc)])
  @@map("users")
}
```

### 2.3 Modelo: Payment (Transacciones Financieras)

```prisma
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  BANK_TRANSFER
  CRYPTO
  WALLET
}

enum PaymentProvider {
  STRIPE
  PAYPAL
  MOCK
}

model Payment {
  id              String         @id @default(uuid())
  userId          String
  user            User           @relation(fields: [userId], references: [id])
  amount          Decimal        @db.Decimal(10, 2)
  currency        String         @default("USD")
  status          PaymentStatus  @default(PENDING)
  method          PaymentMethod
  provider        PaymentProvider @default(MOCK)
  providerId      String?
  idempotencyKey  String         @unique
  metadata        Json?
  failureReason   String?
  refundedAmount  Decimal        @default(0) @db.Decimal(10, 2)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  completedAt     DateTime?
  refundedAt      DateTime?

  invoice         Invoice?
  receipts        Receipt[]
  ledgerEntries   PaymentLedger[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([provider, createdAt(sort: Desc)])
  @@index([idempotencyKey])
  @@map("payments")
}
```

### 2.4 Modelo: Notification

```prisma
enum NotificationType {
  EMAIL
  SMS
  PUSH
  IN_APP
  WEBHOOK
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

model Notification {
  id            String             @id @default(uuid())
  userId        String
  user          User               @relation(fields: [userId], references: [id])
  type          NotificationType
  status        NotificationStatus @default(PENDING)
  title         String
  message       String
  channel       String?
  metadata      Json?
  sentAt        DateTime?
  readAt        DateTime?
  failedAt      DateTime?
  failureReason String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  @@index([userId, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([type, createdAt(sort: Desc)])
  @@map("notifications")
}
```

### 2.5 Modelo: Invoice y Receipt

```prisma
model Invoice {
  id        String   @id @default(uuid())
  number    String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  paymentId String?  @unique
  payment   Payment? @relation(fields: [paymentId], references: [id])
  amount    Decimal  @db.Decimal(10, 2)
  currency  String   @default("USD")
  status    String   @default("draft")
  dueDate   DateTime
  paidAt    DateTime?
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@index([number])
  @@map("invoices")
}

model Receipt {
  id        String   @id @default(uuid())
  paymentId String
  payment   Payment  @relation(fields: [paymentId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  number    String   @unique
  amount    Decimal  @db.Decimal(10, 2)
  currency  String   @default("USD")
  issuedAt  DateTime @default(now())
  metadata  Json?

  @@index([paymentId])
  @@index([userId])
  @@index([number])
  @@map("receipts")
}
```

### 2.6 Modelo: SocialAccount (OAuth2)

```prisma
model SocialAccount {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider          String
  providerAccountId String
  email             String?
  name              String?
  avatarUrl         String?
  accessToken       String?
  refreshToken      String?
  tokenExpiresAt    DateTime?
  profileData       Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@index([provider])
  @@map("social_accounts")
}
```

### 2.7 Modelo: ActivityLog y AuditLog

```prisma
enum ActivityType {
  LOGIN, LOGOUT, LOGIN_FAILED
  PAYMENT_CREATED, PAYMENT_COMPLETED, PAYMENT_FAILED, PAYMENT_REFUNDED
  INVOICE_GENERATED, INVOICE_DOWNLOADED
  USER_CREATED, USER_UPDATED, USER_DELETED
  ROLE_CHANGED, PASSWORD_CHANGED, SETTINGS_UPDATED
  DATA_EXPORTED, PERMISSION_GRANTED, PERMISSION_REVOKED
  API_KEY_CREATED, API_KEY_REVOKED, CONFIG_CHANGED, SYSTEM_ALERT
}

model ActivityLog {
  id          String           @id @default(uuid())
  userId      String?
  user        User?            @relation(fields: [userId], references: [id])
  type        ActivityType
  severity    ActivitySeverity @default(INFO)
  action      String
  resource    String?
  description String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  traceId     String?
  createdAt   DateTime         @default(now())

  @@index([userId, createdAt(sort: Desc)])
  @@index([type, createdAt(sort: Desc)])
  @@index([severity, createdAt(sort: Desc)])
  @@index([action, createdAt(sort: Desc)])
  @@map("activity_logs")
}
```

---

## 3. Índices y Estrategia de Consultas

### 3.1 Índices Compuestos Clave

| Tabla             | Índice                              | Tipo      | Propósito                        |
| ----------------- | ----------------------------------- | --------- | -------------------------------- |
| `users`           | `[email]`                           | B-tree    | Login por email (único)          |
| `users`           | `[role]`                            | B-tree    | Filtrado por rol                 |
| `users`           | `[isActive, createdAt DESC]`        | Compuesto | Listado de usuarios activos      |
| `payments`        | `[userId, createdAt DESC]`          | Compuesto | Historial de pagos por usuario   |
| `payments`        | `[status, createdAt DESC]`          | Compuesto | Pagos pendientes/filtrados       |
| `payments`        | `[idempotencyKey]`                  | Único     | Búsqueda por clave de idempotencia|
| `notifications`   | `[userId, createdAt DESC]`          | Compuesto | Notificaciones por usuario       |
| `notifications`   | `[status, createdAt DESC]`          | Compuesto | Notificaciones pendientes        |
| `activity_logs`   | `[userId, createdAt DESC]`          | Compuesto | Actividad reciente por usuario   |
| `activity_logs`   | `[type, createdAt DESC]`            | Compuesto | Filtrado por tipo de evento      |
| `analytics_events`| `[type, timestamp DESC]`            | Compuesto | Métricas por tipo de evento      |
| `analytics_events`| `[service, timestamp DESC]`         | Compuesto | Métricas por servicio            |
| `social_accounts` | `[provider, providerAccountId]`     | Único     | Buscar cuenta social por provider|
| `invoices`        | `[number]`                          | Único     | Búsqueda por número de factura   |

### 3.2 Estrategia de Indexación

1. **Índices de búsqueda exacta**: Todos los campos `@unique` generan
   índices B-tree automáticos para consultas `findUnique`.
2. **Índices compuestos**: Priorizan el campo más selectivo primero.
   Ej: `[userId, createdAt DESC]` — filtra por userId y ordena por fecha.
3. **Índices de ordenamiento**: `createdAt DESC` cubre consultas
   de timeline y listados recientes.
4. **Índices de filtrado**: `status`, `type`, `service` para consultas
   de agregación y reportes.

---

## 4. Estrategia de Migraciones

### 4.1 Flujo de Migraciones

```
+------------------------------------------------------------------+
|                    FLUJO DE MIGRACIONES                           |
|                                                                   |
|  1. Modificar schema.prisma                                       |
|     └─ prisma schema -- Añadir/quitar modelos y campos           |
|                                                                   |
|  2. Generar migración                                             |
|     └─ npx prisma migrate dev --name add_product_table            |
|                                                                   |
|  3. Revisar SQL generado                                          |
|     └─ prisma/migrations/<timestamp>_add_product_table/           |
|        └─ migration.sql                                           |
|                                                                   |
|  4. Aplicar en desarrollo                                         |
|     └─ npx prisma migrate dev                                    |
|                                                                   |
|  5. Commit de archivos de migración                              |
|     └─ schema.prisma + migration.sql al repositorio              |
|                                                                   |
|  6. Aplicar en producción                                         |
|     └─ npx prisma migrate deploy                                 |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.2 Comandos de Migración

```bash
# Desarrollo: crear y aplicar migración
npx prisma migrate dev --name descriptive_name

# Desarrollo: resetear base de datos
npx prisma migrate reset

# Producción: aplicar migraciones pendientes
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Generar Prisma Client después de cambios
npx prisma generate
```

### 4.3 Buenas Prácticas

- **Nombres descriptivos**: `add_product_category_field`
- **Migraciones atómicas**: Una migración = un cambio lógico
- **Nunca editar migraciones aplicadas**: Crear nueva migración
- **Revisar SQL generado**: Verificar que coincide con lo esperado
- **Hacer backup antes de migrar en producción**

---

## 5. Optimización de Consultas

### 5.1 Patrones de Consulta Recomendados

**Evitar N+1 con `include`:**

```typescript
// ❌ MAL: N+1 query
const payments = await prisma.payment.findMany();
for (const payment of payments) {
  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
}

// ✅ BIEN: Usar include
const payments = await prisma.payment.findMany({
  include: { user: true },
});
```

**Seleccionar solo campos necesarios:**

```typescript
// ✅ BIEN: Solo campos necesarios
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true, role: true },
});
```

**Paginación eficiente:**

```typescript
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

const total = await prisma.user.count();
```

### 5.2 Uso de Transacciones

```typescript
// Transacción interactiva (recomendada para lógica compleja)
await prisma.$transaction(async (tx) => {
  const payment = await tx.payment.create({
    data: { userId, amount, method, provider },
  });

  await tx.paymentLedger.create({
    data: {
      paymentId: payment.id,
      entryType: 'DEBIT',
      amount,
      balance: amount,
      description: 'Payment processed',
    },
  });

  return payment;
});
```

### 5.3 Búsqueda Full-Text

```typescript
// Búsqueda con pg_trgm (requiere extensión)
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
  },
  take: 20,
});
```

### 5.4 Batch Processing

```typescript
// Actualización masiva
await prisma.notification.updateMany({
  where: { userId, status: 'PENDING' },
  data: { status: 'SENT', sentAt: new Date() },
});
```

---

## 6. Estrategia de Caché con Redis

### 6.1 Patrones de Caché

```
+------------------------------------------------------------------+
|                    ESTRATEGIA DE CACHÉ                            |
|                                                                   |
|  Cache-Aside (lectura):                                           |
|    1. Buscar en Redis                                             |
|    2. Si existe → devolver                                        |
|    3. Si no existe → consultar DB → guardar en Redis → devolver  |
|                                                                   |
|  Write-Through (escritura):                                       |
|    1. Escribir en DB                                              |
|    2. Invalidar/actualizar caché                                  |
|    3. Devolver resultado                                          |
|                                                                   |
|  TTL por tipo de dato:                                            |
|    - Perfiles de usuario: 120s                                    |
|    - Listas de usuarios: 60s                                      |
|    - Productos: 300s                                              |
|    - Sesiones: 24h                                                |
|    - Rate limiting: 60s                                           |
|                                                                   |
+------------------------------------------------------------------+
```

### 6.2 Implementación de Cache Service

```typescript
@Injectable()
export class CacheService {
  private readonly DEFAULT_TTL = 60;

  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, opts?: { ttl?: number }): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', opts?.ttl ?? this.DEFAULT_TTL);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 7. Mantenimiento y Operaciones

### 7.1 Tareas de Mantenimiento

| Tarea                    | Frecuencia    | Comando                                |
| ------------------------ | ------------- | -------------------------------------- |
| **VACUUM**               | Semanal       | `VACUUM ANALYZE;`                      |
| **Reindex**              | Mensual       | `REINDEX DATABASE <name>;`             |
| **Estadísticas**         | Automático    | `ANALYZE;` (autovacuum lo maneja)      |
| **Backup**               | Diario        | `pg_dump -Fc > backup.dump`            |
| **Monitoreo de consultas**| Continuo     | `pg_stat_statements`                   |
| **Limpieza de datos**    | Diario        | Job BullMQ de limpieza                 |

### 7.2 Script de Backups

```bash
#!/bin/bash
# backup.sh — Backup diario de PostgreSQL
BACKUP_DIR=/var/backups/postgres
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME=backend_template

pg_dump -Fc -h localhost -U postgres \
  --exclude-table-data=activity_logs \
  --exclude-table-data=analytics_events \
  $DB_NAME > $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump

# Comprimir
gzip $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump

# Limpiar backups > 30 días
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete
```

---

## 8. Resolución de Problemas

### 8.1 Consultas Lentas

```sql
-- Identificar consultas lentas (pg_stat_statements)
SELECT
  query,
  mean_exec_time,
  calls,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 8.2 Conexiones Activas

```sql
-- Ver conexiones activas
SELECT
  pid,
  state,
  usename,
  application_name,
  query_start,
  query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start DESC;
```

### 8.3 Diagnóstico de Lock Contention

```sql
-- Identificar locks en espera
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.query AS blocked_query,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.query AS blocking_query
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
JOIN pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## 9. Políticas de Retención de Datos

| Tabla               | Retención   | Estrategia de limpieza               |
| ------------------- | ----------- | ------------------------------------ |
| `activity_logs`     | 90 días     | Job diario BullMQ: eliminar >90d     |
| `analytics_events`  | 180 días    | Job semanal: agregar y eliminar      |
| `audit_logs`        | 1 año       | Archivado anual a S3 (MinIO)         |
| `error_logs`        | 30 días     | Job diario: eliminar >30d            |
| `refresh_tokens`    | 30 días     | Job diario: revocar expirados        |
| `notifications`     | 90 días     | Job semanal: eliminar leídas >90d    |
| `temporary_sessions`| 24 horas    | TTL automático en Redis              |
| `rate_limits`       | 1 minuto    | TTL automático en Redis              |
