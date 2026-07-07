# Guía de Despliegue — Backend Template

> Instrucciones para construir, configurar y desplegar la aplicación en producción.

---

## Índice

- [1. Docker Setup](#1-docker-setup)
- [2. Configuración de Entorno](#2-configuración-de-entorno)
- [3. Migraciones de Base de Datos](#3-migraciones-de-base-de-datos)
- [4. CI/CD Pipeline](#4-cicd-pipeline)
- [5. Monitoreo y Health Checks](#5-monitoreo-y-health-checks)
- [6. Estrategia de Despliegue](#6-estrategia-de-despliegue)
- [7. Rollback](#7-rollback)

---

## 1. Docker Setup

### 1.1 Dockerfile — Multi-Stage Build

```dockerfile
# ==============================================
# STAGE 1: Dependencies
# ==============================================
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

# Copiar solo los archivos de dependencias
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar dependencias de producción
RUN npm ci --omit=dev

# ==============================================
# STAGE 2: Build
# ==============================================
FROM node:20-alpine AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Instalar TODAS las dependencias y compilar
RUN npm ci && \
    npm run build && \
    npm prune --omit=dev

# ==============================================
# STAGE 3: Production — Imagen final
# ==============================================
FROM node:20-alpine AS production

# Seguridad: usuario no root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /usr/src/app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Copiar desde stages anteriores
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY package.json ./

# Puerto de la aplicación
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Ejecutar como usuario no root
USER appuser

# Comando de inicio
CMD ["node", "dist/main.js"]
```

### 1.2 Docker Compose — Entorno Completo

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://app:password@postgres:5432/backend
      - REDIS_URL=redis://:password@redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: "2G"
        reservations:
          cpus: "0.5"
          memory: "512M"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: backend
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d backend"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: "1G"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: "512M"

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.retention.time=30d"

  grafana:
    image: grafana/grafana:latest
    depends_on:
      - prometheus
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

### 1.3 .dockerignore

```dockerignore
node_modules
dist
.git
.gitignore
*.md
.env
.env.*
coverage
test
logs
npm-debug.log*
```

### 1.4 Comandos Docker Útiles

```bash
# Construir imagen
docker build -t backend-template:latest .

# Ejecutar contenedor
docker run -d \
  --name backend \
  -p 3000:3000 \
  --env-file .env.production \
  backend-template:latest

# Ejecutar migraciones
docker exec backend npx prisma migrate deploy

# Ver logs
docker logs -f backend

# Ejecutar en compose
docker compose up -d

# Reconstruir y reiniciar
docker compose up -d --build --force-recreate app

# Ver recursos
docker stats
```

---

## 2. Configuración de Entorno

### 2.1 Archivos .env

```env
# .env.production (NUNCA committear)
# App
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0
LOG_LEVEL=info

# Base de datos
DATABASE_URL=postgresql://app:password@postgres:5432/backend
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=redis://:password@redis:6379/0

# JWT
JWT_SECRET=tu-secreto-de-al-menos-32-caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# APIs externas
STRIPE_SECRET_KEY=sk_live_xxx
SENDGRID_API_KEY=SG.xxx

# Observabilidad
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
LOKI_URL=http://loki:3100
```

### 2.2 Validación en Startup

```typescript
// main.ts
import { validateEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  // Validar variables de entorno ANTES de iniciar
  const env = validateEnv();

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Configuración global
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Trust proxy (si está detrás de un LB)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  await app.listen(env.PORT);

  console.log(`
  🚀 Backend Template iniciado
  ─────────────────────────
  Puerto:      ${env.PORT}
  Entorno:     ${env.NODE_ENV}
  Versión:     ${process.env.APP_VERSION ?? 'unknown'}
  Base datos:  PostgreSQL
  Cache:       Redis
  `);
}

bootstrap();
```

---

## 3. Migraciones de Base de Datos

### 3.1 Comandos de Migración

```bash
# Desarrollo: crear migración
npx prisma migrate dev --name add_order_status_index

# Desarrollo: resetear DB (peligroso — borra datos)
npx prisma migrate reset

# Producción: aplicar migraciones
npx prisma migrate deploy

# Producción: verificar estado
npx prisma migrate status

# Generar cliente después de migrar
npx prisma generate
```

### 3.2 Script de Migración en CI/CD

```typescript
// scripts/migrate.ts
import { execSync } from 'child_process';

async function runMigrations(): Promise<void> {
  console.log('🔍 Verificando estado de migraciones...');

  try {
    const result = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });

    if (result.includes('Database schema is up to date')) {
      console.log('✅ Base de datos actualizada, no hay migraciones pendientes.');
      return;
    }
  } catch {
    // Si hay error, continuar con el deploy
  }

  console.log('📦 Aplicando migraciones pendientes...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });

  console.log('✅ Migraciones aplicadas correctamente.');
}

runMigrations().catch((err) => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
```

### 3.3 Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  console.log('🌱 Iniciando seed...');

  // Crear admin por defecto
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@backend.com' },
    update: {},
    create: {
      email: 'admin@backend.com',
      name: 'Admin',
      passwordHash: adminPassword,
      roles: ['ADMIN'],
      isActive: true,
    },
  });

  console.log(`✅ Usuario admin creado: ${admin.email}`);

  // Crear roles/configuraciones por defecto
  const configs = [
    { key: 'MAX_LOGIN_ATTEMPTS', value: '5' },
    { key: 'SESSION_TIMEOUT_MINUTES', value: '60' },
    { key: 'MAX_FILE_SIZE_MB', value: '10' },
  ];

  for (const config of configs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log('✅ Seed completado.');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('❌ Error en seed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

```bash
# Ejecutar seed
npx prisma db seed
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions — Pipeline Completo

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

  test:
    name: Tests
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          NODE_ENV: test

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    name: Build & Push Image
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-
            latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/backend
            docker compose pull app
            docker compose up -d --force-recreate app
            docker system prune -f

      - name: Health check
        run: |
          sleep 15
          curl -f http://${{ secrets.DEPLOY_HOST }}/health || exit 1
```

### 4.2 Script Local de CI

```bash
#!/bin/bash
# scripts/ci-check.sh
# Ejecutar localmente antes de pushear

set -e

echo "🔍 Ejecutando checks pre-push..."

echo "1/4 📦 Instalando dependencias..."
npm ci

echo "2/4 🔧 Generando Prisma client..."
npx prisma generate

echo "3/4 ✨ Lint y Type Check..."
npm run lint
npm run typecheck

echo "4/4 🧪 Tests..."
npm run test:ci

echo "✅ Todos los checks pasaron."
```

---

## 5. Monitoreo y Health Checks

### 5.1 Prometheus Config

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

rule_files:
  - "alerts/*.yml"

scrape_configs:
  - job_name: "backend-template"
    static_configs:
      - targets: ["app:3000"]
    metrics_path: "/metrics"
    scheme: http
    scrape_interval: 10s

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]
```

### 5.2 Health Check Endpoint

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(redisClient) private readonly redis: Redis,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);

    const allHealthy = checks.every((c) => c.status === 'healthy');
    const httpStatus = allHealthy ? 200 : 503;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      version: process.env.APP_VERSION ?? 'unknown',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  @Get('/ready')
  async readiness(): Promise<HealthResponse> {
    // Readiness: solo servicios esenciales
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const ready = checks.every((c) => c.status === 'healthy');

    return {
      status: ready ? 'ready' : 'not_ready',
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { name: 'database', status: 'healthy', latencyMs: Date.now() - start };
    } catch {
      return { name: 'database', status: 'unhealthy', error: 'Connection failed' };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return { name: 'redis', status: 'healthy', latencyMs: Date.now() - start };
    } catch {
      return { name: 'redis', status: 'unhealthy', error: 'Connection failed' };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    // Implementar con check-disk-space
    return { name: 'disk', status: 'healthy' };
  }

  private checkMemory(): HealthCheck {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapLimitMB = Math.round(usage.heapTotal / 1024 / 1024);

    return {
      name: 'memory',
      status: heapUsedMB < heapLimitMB * 0.9 ? 'healthy' : 'degraded',
      details: { heapUsedMB, heapLimitMB },
    };
  }
}
```

---

## 6. Estrategia de Despliegue

### 6.1 Zero-Downtime Deployment

```yaml
# docker-compose.prod.yml
version: "3.9"

services:
  app:
    image: ghcr.io/org/backend-template:latest
    deploy:
      replicas: 3                    # Múltiples réplicas
      update_config:
        parallelism: 1               # Actualizar de a 1
        delay: 10s                   # Esperar 10s entre cada una
        order: start-first           # Iniciar nueva antes de detener vieja
        failure_action: rollback     # Revertir si falla
      restart_policy:
        condition: any
        delay: 5s
        window: 120s
    healthcheck:
      test: ["CMD", "node", "scripts/healthcheck.js"]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 30s
```

### 6.2 Blue-Green Deployment

```yaml
# Estrategia de DNS routing
# Blue: versión actual
# Green: nueva versión

# Paso 1: Desplegar green
docker compose -f docker-compose.green.yml up -d

# Paso 2: Verificar health
curl -f http://green.internal/health

# Paso 3: Switchear tráfico (load balancer)
# Cambiar de blue a green

# Paso 4: Drenar y detener blue
docker compose -f docker-compose.blue.yml down
```

---

## 7. Rollback

### 7.1 Rollback de Migraciones

```bash
# Revertir la última migración
npx prisma migrate down 1

# Revertir a una migración específica
npx prisma migrate resolve --rolled-back "20260629000000_add_index"

# Luego desplegar la versión anterior de la app
docker compose up -d --force-recreate app
```

### 7.2 Rollback de Docker

```bash
# Rollback a versión anterior
docker compose down app
docker compose up -d app  # La imagen tag "latest" vuelve a la anterior

# O usar tags específicos
docker compose -f docker-compose.yml up -d app
```

### 7.3 Git Rollback

```bash
# Revertir a commit anterior
git revert HEAD --no-edit
git push origin main

# O resetear si es necesario (con cuidado)
git reset --hard HEAD~1
git push --force-with-lease origin main
```

---

## Checklist Pre-Despliegue

- [ ] Tests pasando (lint, unit, integration)
- [ ] Migraciones verificadas en staging
- [ ] Variables de entorno configuradas en producción
- [ ] Secrets rotados (si es el caso)
- [ ] Health check endpoint funcionando
- [ ] Logs fluyendo a Loki
- [ ] Métricas visibles en Grafana
- [ ] Alertas configuradas en AlertManager
- [ ] Backup de DB realizado
- [ ] Rollback plan documentado

---

> **Contacto**: Para incidentes de despliegue, contactar al equipo de plataforma en #ops-alerts (Slack).
