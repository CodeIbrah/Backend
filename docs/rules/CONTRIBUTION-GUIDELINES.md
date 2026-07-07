# Guía de Contribución — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Repositorio:** `github.com/your-org/backend-template`

---

## Índice

1. [Bienvenida](#1-bienvenida)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Configuración Inicial](#3-configuración-inicial)
4. [Flujo de Trabajo](#4-flujo-de-trabajo)
5. [Nomenclatura de Ramas](#5-nomenclatura-de-ramas)
6. [Conventional Commits](#6-conventional-commits)
7. [Proceso de Pull Request](#7-proceso-de-pull-request)
8. [Code Review](#8-code-review)
9. [Reporte de Issues](#9-reporte-de-issues)
10. [Comunicación](#10-comunicación)

---

## 1. Bienvenida

¡Gracias por tu interés en contribuir al Backend Template! Este proyecto es la base para todos los servicios backend de la organización, y cada contribución ayuda a mantener un estándar de calidad, seguridad y rendimiento.

Este documento describe el proceso para contribuir de manera efectiva y consistente.

### 1.1 Valores del proyecto

| Valor | Descripción |
|-------|-------------|
| **Calidad** | Código limpio, tipado, probado y documentado |
| **Seguridad** | Seguridad por defecto en cada capa |
| **Rendimiento** | Eficiencia desde el diseño |
| **Observabilidad** | Todo debe ser medible y trazable |
| **Consistencia** | Un solo estilo, un solo estándar |

---

## 2. Prerrequisitos

### 2.1 Software requerido

| Herramienta | Versión mínima | Propósito |
|-------------|---------------|-----------|
| Node.js | 20.x LTS | Runtime |
| npm / pnpm | 9+ / 8+ | Gestor de paquetes |
| Docker | 24+ | Contenedores locales |
| Docker Compose | 2.20+ | Orquestación local |
| PostgreSQL | 15+ | Base de datos |
| Redis | 7+ | Cache y colas |

### 2.2 Conocimientos recomendados

- TypeScript avanzado (strict mode, tipos genéricos)
- NestJS (módulos, DI, guards, interceptors)
- Prisma ORM (migrations, queries, relaciones)
- BullMQ (colas, workers, eventos)
- OpenTelemetry y Prometheus
- Jest (pruebas unitarias, de integración y E2E)

---

## 3. Configuración Inicial

### 3.1 Fork y clone

```bash
# Hacer fork del repositorio en GitHub
# Luego clonar el fork localmente
git clone https://github.com/tu-usuario/backend-template.git
cd backend-template

# Agregar el repositorio upstream
git remote add upstream https://github.com/organizacion/backend-template.git

# Verificar remotos
git remote -v
# origin    https://github.com/tu-usuario/backend-template.git (fetch)
# origin    https://github.com/tu-usuario/backend-template.git (push)
# upstream  https://github.com/organizacion/backend-template.git (fetch)
# upstream  https://github.com/organizacion/backend-template.git (push)
```

### 3.2 Instalación de dependencias

```bash
# Instalar dependencias del proyecto
npm install

# Copiar y configurar variables de entorno
cp .env.example .env

# Iniciar infraestructura local
docker compose up -d postgres redis

# Ejecutar migraciones de Prisma
npx prisma migrate dev

# Verificar que todo funciona
npm run test
npm run dev
```

### 3.3 Mantenerse actualizado

```bash
# Antes de empezar a trabajar, siempre sincronizar con upstream
git checkout main
git pull upstream main
git push origin main
```

---

## 4. Flujo de Trabajo

### 4.1 Diagrama del flujo

```
1️⃣  Crear rama desde main actualizado
        │
        ▼
2️⃣  Desarrollar con commits convencionales
        │
        ▼
3️⃣  Ejecutar pruebas localmente
        │
        ▼
4️⃣  Hacer push y crear Pull Request
        │
        ▼
5️⃣  Pasar CI/CD (lint, test, build)
        │
        ▼
6️⃣  Code Review (mínimo 1 aprobación)
        │
        ▼
7️⃣  Squash & merge a main
        │
        ▼
8️⃣  Eliminar rama
```

### 4.2 Pasos detallados

```bash
# 1. Asegurarse de tener main actualizado
git checkout main
git pull upstream main

# 2. Crear rama de feature/fix
git checkout -b feature/TICKET-123-add-user-avatar

# 3. Desarrollar y hacer commits
git add src/modules/users/
git commit -m "feat(api): add user avatar upload endpoint

- Add S3 upload integration for avatars
- Add image validation (size, format)
- Add user avatar URL to profile response

Closes TICKET-123"

# 4. Mantener la rama sincronizada con main
git pull --rebase upstream main

# 5. Ejecutar pruebas
npm run lint && npm run test && npm run build

# 6. Hacer push y crear PR
git push origin feature/TICKET-123-add-user-avatar
# Luego crear PR en GitHub apuntando a main
```

---

## 5. Nomenclatura de Ramas

### 5.1 Formato

```
<tipo>/<ticket-opcional>-<descripcion-corta>
```

### 5.2 Tipos de rama

| Tipo | Propósito | Ejemplo |
|------|-----------|---------|
| `feature/` | Nueva funcionalidad | `feature/TICKET-123-add-user-avatar` |
| `fix/` | Corrección de bug | `fix/TICKET-456-fix-login-timeout` |
| `hotfix/` | Corrección urgente en producción | `hotfix/critical-security-patch` |
| `chore/` | Tareas de mantenimiento | `chore/update-dependencies` |
| `docs/` | Documentación | `docs/add-api-usage-examples` |
| `refactor/` | Refactorización | `refactor/TICKET-789-extract-auth-service` |
| `test/` | Agregar o corregir pruebas | `test/add-user-service-coverage` |
| `perf/` | Mejora de rendimiento | `perf/optimize-user-query` |

### 5.3 Reglas

- Los nombres de rama deben ser cortos pero descriptivos
- Usar guiones (`-`) para separar palabras
- Si existe un ticket, incluirlo después del tipo
- No incluir caracteres especiales ni mayúsculas
- Máximo 50 caracteres para el nombre

```bash
# ✅ Correcto
feature/TICKET-123-add-user-avatar
fix/login-error-handling
chore/update-nestjs-to-v11
docs/update-readme-setup

# ❌ Incorrecto
feature-MiRamaConMayusculas
fix/critical_bug_found_2024
mi-rama-personal-sin-tipo
```

---

## 6. Conventional Commits

### 6.1 Formato del commit

```
<tipo>(<scope opcional>): <descripción breve>

[Cuerpo opcional: explicación detallada]

[Pie opcional: referencias a issues, breaking changes]
```

### 6.2 Tipos permitidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `chore` | Mantenimiento, dependencias, config |
| `docs` | Documentación |
| `refactor` | Refactorización sin cambios funcionales |
| `test` | Agregar o modificar pruebas |
| `style` | Cambios de formato (espacios, comillas) |
| `perf` | Mejora de rendimiento |
| `ci` | Cambios en CI/CD |
| `build` | Cambios en sistema de build |
| `revert` | Revertir un commit anterior |

### 6.3 Scopes del proyecto

| Scope | Ámbito |
|-------|--------|
| `api` | Endpoints REST/GraphQL |
| `core` | Núcleo del framework, bootstrap |
| `auth` | Autenticación y autorización |
| `db` | Prisma, migraciones, seeds |
| `queue` | BullMQ, workers, jobs |
| `cache` | Redis, estrategias de caché |
| `observability` | Logging, tracing, métricas |
| `infra` | Docker, CI/CD, deploy |
| `deps` | Actualización de dependencias |

### 6.4 Ejemplos

```bash
# ✅ Correcto
feat(api): add user avatar upload endpoint
fix(auth): handle token refresh race condition
chore(deps): upgrade prisma to v6.0.0
docs(api): add comprehensive JSDoc to user controller
refactor(core): extract pagination logic to shared util
test(api): add integration tests for user creation
perf(db): optimize user list query with composite index
ci: add security audit step to pipeline

# ❌ Incorrecto
fix bug
agregue cambios
wip
cambios varios
pronto arreglo esto
```

### 6.5 Breaking changes

```bash
feat(api)!: change user ID type from number to UUID

BREAKING CHANGE: The user ID field has been changed from auto-increment
integer to UUID. All existing endpoints that accept numeric IDs will
need to be updated.

Migration guide:
- Update all API calls to use UUID format
- Run migration script: npm run migrate:uuid
```

---

## 7. Proceso de Pull Request

### 7.1 Antes de crear un PR

- [ ] La rama está sincronizada con `main` (`git pull --rebase upstream main`)
- [ ] Todos los tests pasan (`npm run test`)
- [ ] El linter no reporta errores (`npm run lint`)
- [ ] El build es exitoso (`npm run build`)
- [ ] No hay conflictos con `main`
- [ ] Se agregaron pruebas para el nuevo código
- [ ] La documentación relevante está actualizada
- [ ] Se verificó manualmente el funcionamiento

### 7.2 Template de PR

```markdown
## Descripción

[Descripción clara de los cambios]

## Tipo de cambio

- [ ] Nueva funcionalidad (feat)
- [ ] Corrección de bug (fix)
- [ ] Refactorización (refactor)
- [ ] Documentación (docs)
- [ ] Pruebas (test)
- [ ] Mantenimiento (chore)

## Ticket relacionado

Closes #[número]

## Cómo probar

1. `docker compose up -d`
2. `npm run dev`
3. `curl -X POST http://localhost:3000/api/users/...`

## Checklist del autor

- [ ] Código sigue los estándares del proyecto
- [ ] Se agregaron pruebas unitarias
- [ ] Se agregaron pruebas de integración
- [ ] Las pruebas existentes siguen pasando
- [ ] La documentación está actualizada
- [ ] No hay secretos ni credenciales en el código
- [ ] Se verificaron casos borde

## Capturas de pantalla (si aplica)

[Opcional]

## Notas adicionales

[Cualquier contexto adicional relevante]
```

### 7.3 CI/CD Gates

Cada PR debe pasar los siguientes checks:

1. **Lint** — ESLint no debe reportar errores
2. **Type Check** — `tsc --noEmit` sin errores
3. **Unit Tests** — Todas las pruebas unitarias pasan
4. **Integration Tests** — Pruebas de integración pasan
5. **Build** — El build de producción es exitoso
6. **Coverage** — La cobertura no disminuye
7. **Security Audit** — `npm audit` sin vulnerabilidades críticas

---

## 8. Code Review

### 8.1 Proceso

1. **Asignar revisores** — Mínimo 1 revisor del equipo
2. **Esperar revisión** — Máximo 24h hábiles para responder
3. **Responder feedback** — Cada comentario debe tener respuesta
4. **Aprobar cambios** — El revisor aprueba cuando está conforme
5. **Merge** — Solo después de aprobación y checks verdes

### 8.2 Reglas

| Regla | Descripción |
|-------|-------------|
| **Mínimo 1 revisor** | Ningún PR debe mergearse sin aprobación |
| **PRs pequeños** | Máximo 300 líneas de cambio |
| **No self-merge** | Nunca merges tu propio PR |
| **Responder comentarios** | Todas las preguntas deben ser respondidas |
| **No commits directos a main** | Solo a través de PR |
| **Squash merge** | Todos los commits se squashean a 1 |

---

## 9. Reporte de Issues

### 9.1 Bug Report

```markdown
## Comportamiento esperado
[Descripción de lo que debería pasar]

## Comportamiento actual
[Descripción de lo que realmente pasa]

## Pasos para reproducir
1. Ir a '...'
2. Click en '...'
3. Scroll a '...'
4. Ver error

## Evidencia
[Logs, screenshots, stack traces]

## Entorno
- OS: [ej. Windows 11, macOS 14]
- Node: [ej. 20.11.0]
- Navegador: [ej. Chrome 125]
- Versión del proyecto: [ej. 1.2.3]
```

### 9.2 Feature Request

```markdown
## Problema a resolver
[Descripción clara del problema]

## Solución propuesta
[Descripción de la funcionalidad deseada]

## Alternativas consideradas
[Otras soluciones que se evaluaron]

## Contexto adicional
[Cualquier información relevante]
```

---

## 10. Comunicación

### 10.1 Canales

| Canal | Propósito |
|-------|-----------|
| GitHub Issues | Bugs, features, discusiones técnicas |
| Slack `#backend` | Preguntas rápidas, coordinación |
| Weekly sync | Demo de cambios importantes |
| Pull Requests | Code review y discusión de implementación |

### 10.2 Pautas

- Ser respetuoso y constructivo
- Explicar el "por qué" detrás de las decisiones técnicas
- Pedir ayuda cuando sea necesario
- Celebrar los aprendizajes del equipo
