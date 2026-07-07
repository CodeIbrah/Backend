# Convenciones de Commits — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Basado en:** Conventional Commits 1.0.0  
> **Estándar:** [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/)

---

## Índice

1. [Introducción](#1-introducción)
2. [Estructura del Commit](#2-estructura-del-commit)
3. [Tipos de Commit](#3-tipos-de-commit)
4. [Scopes del Proyecto](#4-scopes-del-proyecto)
5. [Commits de Breaking Change](#5-commits-de-breaking-change)
6. [Ejemplos de Commits](#6-ejemplos-de-commits)
7. [Buenas y Malas Prácticas](#7-buenas-y-malas-prácticas)
8. [Integración con Herramientas](#8-integración-con-herramientas)
9. [Commits y Releases Automáticos](#9-commits-y-releases-automáticos)

---

## 1. Introducción

Este documento define la convención de commits para el proyecto **Backend Template**, basada en el estándar **Conventional Commits**. El objetivo es tener un historial de git legible, automatizable y trazable.

### 1.1 Beneficios

| Beneficio | Descripción |
|-----------|-------------|
| **CHANGELOG automático** | Generar changelogs desde los commits |
| **Versionado semántico** | Determinar automáticamente la versión siguiente |
| **Historial legible** | Entender qué cambió y por qué |
| **Búsqueda efectiva** | Encontrar cambios por tipo y scope |
| **CI/CD inteligente** | Disparar pipelines según el tipo de commit |

---

## 2. Estructura del Commit

### 2.1 Formato base

```
<tipo>(<scope opcional>): <descripción>

[Cuerpo opcional]

[Pie opcional]
```

### 2.2 Formato extendido

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### 2.3 Reglas

| Elemento | Requerido | Máx. caracteres | Reglas |
|----------|-----------|-----------------|--------|
| **tipo** | Sí | — | Minúsculas, uno de la lista definida |
| **scope** | No | — | Minúsculas, kebab-case |
| **descripción** | Sí | 72 | Imperativo, sin punto al final |
| **cuerpo** | No | 72 por línea | Explicar qué y por qué, no cómo |
| **footer** | No | 72 por línea | Referencias, breaking changes |

---

## 3. Tipos de Commit

### 3.1 Tipos permitidos

| Tipo | Propósito | Aparece en CHANGELOG | Semver |
|------|-----------|---------------------|--------|
| `feat` | Nueva funcionalidad | Sí | MINOR |
| `fix` | Corrección de bug | Sí | PATCH |
| `chore` | Mantenimiento, config, dependencias | No | — |
| `docs` | Documentación | Sí (si es relevante) | — |
| `refactor` | Refactorización sin cambio funcional | No | — |
| `test` | Agregar o corregir tests | No | — |
| `style` | Formato (espacios, comillas, prettier) | No | — |
| `perf` | Mejora de rendimiento | Sí | PATCH |
| `ci` | Cambios en CI/CD | No | — |
| `build` | Sistema de build o dependencias externas | No | — |
| `revert` | Revertir un commit anterior | Sí | — |

### 3.2 Cuándo usar cada tipo

```bash
# feat — Nueva funcionalidad para el usuario final
feat(api): add user avatar upload endpoint

# fix — Corrección de bug en producción
fix(auth): handle token refresh race condition

# chore — Tareas que no afectan al código de producción
chore(deps): upgrade eslint to v9

# docs — Cambios en documentación
docs(readme): add quickstart guide

# refactor — Cambio en código que no agrega funcionalidad ni corrige bugs
refactor(core): extract pagination logic to shared util

# test — Agregar o modificar tests
test(api): add integration tests for user creation

# style — Cambios de formato
style: apply prettier formatting to all files

# perf — Mejora de rendimiento
perf(db): optimize user list query with composite index

# ci — Cambios en pipelines
ci: add security audit step to github actions

# build — Cambios en sistema de build
build: migrate from webpack to tsup

# revert — Revertir un commit
revert: feat(api): add user avatar upload endpoint
```

---

## 4. Scopes del Proyecto

### 4.1 Scopes definidos

| Scope | Ámbito | Ejemplo de cambio |
|-------|--------|-------------------|
| `api` | Endpoints REST/GraphQL | Nuevo endpoint, cambio en ruta |
| `core` | Núcleo del framework | Bootstrap de la app, config global |
| `auth` | Autenticación y autorización | JWT, guards, roles, sesiones |
| `db` | Base de datos y Prisma | Migraciones, seeds, queries |
| `queue` | Colas y workers BullMQ | Jobs, workers, eventos |
| `cache` | Redis y estrategias de caché | TTL, invalidación, patrones |
| `observability` | Logging, tracing, métricas | Winston, OpenTelemetry, Prometheus |
| `infra` | Infraestructura y CI/CD | Docker, GitHub Actions, deploy |
| `deps` | Actualización de dependencias | Upgrades, migraciones |
| `security` | Parches de seguridad | Vulnerabilidades, hardening |
| `validation` | Validación y schemas | Zod schemas, pipes |
| `docs` | Documentación | README, JSDoc, guías |

### 4.2 Uso de scopes

```bash
# Sin scope (cambios globales)
chore: update npm scripts
style: apply prettier formatting

# Con scope (cambios específicos)
feat(api): add pagination to user list endpoint
fix(auth): validate refresh token signature
refactor(core): extract database module
perf(db): add composite index for user queries
test(api): add e2e tests for auth flow
docs(docs): add contribution guidelines
chore(deps): upgrade prisma to v6.0.0
ci(infra): add docker layer caching
build(core): migrate to esbuild
security(auth): rotate JWT signing keys
```

---

## 5. Commits de Breaking Change

### 5.1 Indicación

Los breaking changes se indican con un `!` después del tipo/scope o con `BREAKING CHANGE` en el footer.

### 5.2 Formato

```bash
# Opción 1: Con ! después del tipo
feat!: change user ID type from number to UUID

# Opción 2: Con ! después del scope
feat(api)!: change user ID type from number to UUID

# Opción 3: Con BREAKING CHANGE en el footer
feat(api): change user ID type from number to UUID

BREAKING CHANGE: The user ID field has been changed from auto-increment
integer to UUID. All existing endpoints that accept numeric IDs will
need to be updated.
```

### 5.3 Cuándo es breaking change

| Cambio | ¿Breaking? |
|--------|-----------|
| Eliminar un endpoint | Sí |
| Cambiar tipo de dato en respuesta | Sí |
| Renombrar campo en request/response | Sí |
| Cambiar estructura de BD | Sí |
| Eliminar variable de entorno | Sí |
| Agregar campo opcional a respuesta | No |
| Nuevo endpoint | No |
| Bug fix backward-compatible | No |

### 5.4 Migración en el commit

```bash
feat(api)!: migrate user IDs from integer to UUID

BREAKING CHANGE: User IDs changed from integer to UUID format.

Migration guide:
1. Run database migration: npm run migrate:uuid
2. Update API client to handle UUID format
3. Old integer IDs will be rejected after 30 days

Closes TICKET-789
```

---

## 6. Ejemplos de Commits

### 6.1 Commits correctos

```bash
# Simple
feat(api): add pagination to user list endpoint

# Con cuerpo explicativo
fix(auth): handle token refresh race condition

When multiple concurrent requests trigger a token refresh at the same
time, the system could create multiple refresh tokens. This fix adds
a distributed lock in Redis to ensure only one refresh occurs.

Closes TICKET-456

# Con referencias múltiples
feat(api): add user avatar upload with S3 integration

- Add S3 bucket integration for avatar storage
- Add image validation (max 5MB, JPEG/PNG only)
- Add avatar URL to user profile response
- Add unit and integration tests

Closes TICKET-123, TICKET-124

# Breaking change con migración
refactor(core)!: extract payment processing to standalone service

BREAKING CHANGE: Payment processing is now handled by the payment-service
microservice. The monolith no longer processes payments directly.

Migration:
1. Deploy payment-service before this change
2. Update PAYMENT_SERVICE_URL env variable
3. Payment webhooks URL has changed

Closes TICKET-789

# Chore con dependencias
chore(deps): upgrade nestjs from v10 to v11

- Updated @nestjs/core, @nestjs/common, @nestjs/testing
- Updated @nestjs/config, @nestjs/jwt, @nestjs/throttler
- Updated @nestjs/bullmq, @nestjs/schedule
- All breaking changes handled per migration guide

Closes TICKET-101
```

### 6.2 Commits incorrectos

```bash
# Mal: muy vago
fix: arregle bug

# Mal: mensaje muy largo en subject
fix: this is a really long commit message that should be in the body because it exceeds 72 characters

# Mal: mayúsculas incorrectas
Feat(API): Added new endpoint

# Mal: sin tipo
added new feature

# Mal: tipo inválido
misc: some random changes

# Mal: sin contexto
fixed it

# Mal: mezcla de cambios sin relación
feat: add user avatar and fix login bug
```

---

## 7. Buenas y Malas Prácticas

### 7.1 Buenas prácticas

```
✅ Usar imperativo en la descripción
  feat: add user avatar upload         ✓
  feat: added user avatar upload       ✗

✅ Descripción corta (máx 72 caracteres)
  feat: add user avatar upload         ✓ (28 chars)

✅ Explicar el "qué" y "por qué" en el cuerpo
  fix: handle null email on user update
  
  When a user updates their profile without providing an email,
  the system would crash with a null pointer exception.
  Added an early return when email is null.   ✓

✅ Referenciar issues/tickets
  Closes TICKET-123                        ✓

✅ Separar cambios no relacionados en distintos commits
  feat(api): add user avatar              ✓
  fix(auth): handle token refresh         ✓

✅ Agrupar cambios relacionados
  feat(api): add user avatar upload
  - Add S3 integration
  - Add validation
  - Add tests                             ✓
```

### 7.2 Malas prácticas

```
❌ Commits vagos
  fix: fixed stuff
  chore: changes
  update: updated some files

❌ Commits con "WIP"
  wip
  work in progress
  fixing later

❌ Commits que mezclan tipos
  feat: add avatar and fix login bug and update deps

❌ Descripciones que exceden 72 caracteres
  feat: this is a very long description that should be in the body
  of the commit because the subject line is too long

❌ Usar punto final en la descripción
  feat: add avatar upload.

❌ Usar tiempo pasado
  feat: added avatar upload
```

---

## 8. Integración con Herramientas

### 8.1 Husky + commitlint

```bash
# Instalación
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional

# Configuración de commitlint
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js

# Configuración de husky
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### 8.2 commitlint.config.js

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'style', 'perf', 'ci', 'build', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      ['api', 'core', 'auth', 'db', 'queue', 'cache', 'observability', 'infra', 'deps', 'security', 'validation', 'docs'],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72],
    'footer-max-line-length': [2, 'always', 72],
  },
};
```

### 8.3 Semantic release

```javascript
// release.config.js
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};
```

---

## 9. Commits y Releases Automáticos

### 9.1 Mapeo tipo → versión

| Tipo de commit | Cambio de versión |
|----------------|-------------------|
| `feat` + `!` o `BREAKING CHANGE` | MAJOR |
| `feat` | MINOR |
| `fix` | PATCH |
| `perf` | PATCH |
| Otros | Sin release |

### 9.2 Generación de CHANGELOG

```markdown
# Changelog

## [1.2.0] - 2026-06-29

### Features
- `feat(api)`: add user avatar upload endpoint (#123)
- `feat(api)`: add pagination to user list (#124)

### Bug Fixes
- `fix(auth)`: handle token refresh race condition (#125)
- `fix(db)`: fix missing index on email column (#126)

### Performance
- `perf(db)`: optimize user list query with composite index (#127)

### Documentation
- `docs(readme)`: add quickstart guide (#128)
```

### 9.3 Flujo de release automático

```
Commit convencional
        │
        ▼
CI detecta el tipo
        │
        ├── feat → MINOR
        ├── fix  → PATCH
        ├── !    → MAJOR
        └── otros → sin release
        │
        ▼
Semantic Release:
  1. Calcula nueva versión
  2. Actualiza package.json
  3. Genera CHANGELOG.md
  4. Crea tag y release en GitHub
  5. Publica a npm (si aplica)
```
