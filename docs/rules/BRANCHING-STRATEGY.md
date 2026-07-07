# Estrategia de Ramificación — Backend Template

> **Versión:** 1.0.0  
> **Última actualización:** 2026-06-29  
> **Basado en:** Git Flow adaptado para CI/CD moderno

---

## Índice

1. [Introducción](#1-introducción)
2. [Estructura de Ramas](#2-estructura-de-ramas)
3. [Rama Main](#3-rama-main)
4. [Ramas de Desarrollo](#4-ramas-de-desarrollo)
5. [Ramas de Feature](#5-ramas-de-feature)
6. [Ramas de Release](#6-ramas-de-release)
7. [Ramas de Hotfix](#7-ramas-de-hotfix)
8. [Workflow de Integración](#8-workflow-de-integración)
9. [Protección de Ramas](#9-protección-de-ramas)
10. [Nomenclatura](#10-nomenclatura)
11. [Squash Merge](#11-squash-merge)
12. [Política de Tags](#12-política-de-tags)

---

## 1. Introducción

Este documento define la estrategia de ramificación para el **Backend Template**. El objetivo es mantener un historial limpio, predecible y trazable que facilite la colaboración, el CI/CD y los despliegues.

### 1.1 Principios

| Principio | Descripción |
|-----------|-------------|
| **main siempre deployable** | `main` debe pasar todos los checks y estar lista para producción |
| **Ramas efímeras** | Las ramas de feature/fix viven solo el tiempo necesario |
| **Commits atómicos** | Cada commit es una unidad lógica completa |
| **Trazabilidad** | Cada cambio se relaciona con un issue o ticket |
| **Consistencia** | Todos seguimos la misma convención |

### 1.2 Diagrama general

```
main ─────●──────────────────●──────────────────●─────
           \                / \                /
feature/    ●──●──●        /   \              /
             \            /     \            /
release/      ●──────────●       \          /
                                   \        /
hotfix/                             ●──●───●
```

---

## 2. Estructura de Ramas

### 2.1 Tipos de rama

| Rama | Propósito | Base | Merge a | Lifetime |
|------|-----------|------|---------|----------|
| `main` | Producción | — | — | Permanente |
| `feature/*` | Nueva funcionalidad | `main` | `main` | Efímera |
| `fix/*` | Corrección de bug | `main` | `main` | Efímera |
| `release/*` | Preparación de release | `main` | `main` + `main` | Temporal |
| `hotfix/*` | Fix urgente de producción | `main` | `main` + `main` | Efímera |
| `chore/*` | Mantenimiento | `main` | `main` | Efímera |
| `docs/*` | Documentación | `main` | `main` | Efímera |
| `refactor/*` | Refactorización | `main` | `main` | Efímera |

---

## 3. Rama Main

### 3.1 Definición

`main` es la rama principal y **siempre debe reflejar el estado de producción**. Todo el código en `main` debe:

- Pasar todas las pruebas (unitarias, integración, E2E)
- Pasar el lint y type-check
- Estar libre de vulnerabilidades conocidas
- Estar documentado

### 3.2 Reglas de main

| Regla | Descripción |
|-------|-------------|
| **Sin commits directos** | Solo se hacen merges a través de PR |
| **Protegida** | Requiere aprobación + CI verde |
| **Siempre verde** | No se permite código rojo |
| **Tags semánticos** | Cada merge significativo lleva tag |

```
main ───●────●────●────●────●────●────●
        ↑    ↑    ↑    ↑    ↑    ↑    ↑
       PR   PR   PR   PR   PR   PR   PR
```

---

## 4. Ramas de Desarrollo

Este proyecto **no usa** una rama `develop` separada. El flujo es directo a `main` por las siguientes razones:

| Razón | Explicación |
|-------|-------------|
| **CI/CD moderno** | Despliegue continuo desde `main` |
| **PRs pequeños** | Cambios atómicos y frecuentes |
| **Feature flags** | Funcionalidades incompletas detrás de flags |
| **Menos merges** | Menos conflictos y complejidad |

Si una funcionalidad necesita múltiples PRs, se usa **feature flags** en lugar de ramas largas.

---

## 5. Ramas de Feature

### 5.1 Creación

```bash
# Desde main actualizado
git checkout main
git pull upstream main
git checkout -b feature/TICKET-123-add-user-avatar
```

### 5.2 Ciclo de vida

```
feature/TICKET-123-add-user-avatar
       │
       ├── commit: feat(api): add avatar upload endpoint
       ├── commit: test(api): add avatar upload tests
       ├── commit: docs(api): add avatar endpoint docs
       │
       └── → PR → code review → squash merge → main
```

### 5.3 Reglas

- ✅ Cada feature es una rama separada
- ✅ Commits atómicos con Conventional Commits
- ✅ Pruebas incluidas en la rama
- ✅ Mantener corta (máximo 3-5 días)
- ✅ Hacer rebase con `main` antes del PR
- ❌ No mezclar features en una sola rama

### 5.4 Sincronización con main

```bash
# Mientras desarrollas, mantener sincronizado
git checkout feature/TICKET-123
git pull --rebase upstream main
# Resolver conflictos si los hay
git push --force-with-lease origin feature/TICKET-123
```

---

## 6. Ramas de Release

### 6.1 Cuándo usarlas

Las ramas `release/` se usan para preparar una versión cuando:

- Se necesita un período de estabilización
- Hay múltiples features que salen juntas
- Se requiere QA externo antes de producción

### 6.2 Creación

```bash
# Desde main
git checkout main
git pull upstream main
git checkout -b release/v1.2.0
```

### 6.3 Actividades en release

En una rama de release **solo** se hacen:

- Correcciones de bugs encontrados en QA
- Actualización de versión en `package.json`
- Actualización de CHANGELOG
- Documentación faltante

```bash
release/v1.2.0
       │
       ├── chore: bump version to 1.2.0
       ├── fix: resolve pagination edge case
       ├── docs: update changelog
       │
       ├── → Merge a main
       └── → Tag v1.2.0
```

### 6.4 Finalización

```bash
# Merge a main
git checkout main
git merge --no-ff release/v1.2.0
git tag v1.2.0

# Eliminar rama
git branch -d release/v1.2.0
```

---

## 7. Ramas de Hotfix

### 7.1 Cuándo usarlas

Las ramas `hotfix/` son para **correcciones críticas de producción** que no pueden esperar al ciclo normal.

| Situación | Hotfix | Ejemplo |
|-----------|--------|---------|
| ✅ Vulnerabilidad crítica | Sí | Security patch |
| ✅ Bug bloqueante en prod | Sí | Login caído |
| ❌ Feature nueva | No | Usar feature branch |
| ❌ Bug menor | No | Esperar al siguiente release |

### 7.2 Proceso

```bash
# Desde main
git checkout main
git pull upstream main
git checkout -b hotfix/security-session-validation

# Hacer fix y commits
git add src/modules/auth/
git commit -m "fix(auth): validate session token signature"

# PR urgente con revisión acelerada
# Merge directo a main
git checkout main
git merge --no-ff hotfix/security-session-validation
git tag v1.2.1

# Eliminar rama
git branch -d hotfix/security-session-validation
```

### 7.3 Hotfix vs Release

```
         hotfix/ ──●──
                   /
main ─────●────●──●────●────●
          ↑    ↑    ↑    ↑   ↑
         PRs  PRs  PRs  PRs  PRs
```

---

## 8. Workflow de Integración

### 8.1 Flujo completo

```bash
# 1. Crear rama desde main
git checkout main
git pull upstream main
git checkout -b feature/TICKET-123-user-avatar

# 2. Desarrollo
git add .
git commit -m "feat(api): add user avatar upload"
git add .
git commit -m "test(api): add avatar upload unit tests"

# 3. Sincronizar con main (rebase, no merge)
git pull --rebase upstream main

# 4. Push y PR
git push origin feature/TICKET-123-user-avatar
# → Crear PR en GitHub → CI checks → Code Review

# 5. Merge (usando squash merge)
# → Automatizado por GitHub al aprobar

# 6. Limpiar
git branch -d feature/TICKET-123-user-avatar
```

### 8.2 Gates de CI antes del merge

```
PR creado
    │
    ▼
Lint ──→ ¿Pasa? ──NO──→ Corregir
    │
    ▼ (SÍ)
Type Check ──→ ¿Pasa? ──NO──→ Corregir
    │
    ▼ (SÍ)
Unit Tests ──→ ¿Pasan? ──NO──→ Corregir
    │
    ▼ (SÍ)
Integration Tests ──→ ¿Pasan? ──NO──→ Corregir
    │
    ▼ (SÍ)
Build ──→ ¿Éxito? ──NO──→ Corregir
    │
    ▼ (SÍ)
Coverage ──→ ¿>=80%? ──NO──→ Agregar tests
    │
    ▼ (SÍ)
Security Audit ──→ ¿OK? ──NO──→ Corregir
    │
    ▼ (SÍ)
✅ Listo para merge
```

### 8.3 Resolución de conflictos

```bash
# Si hay conflictos al mergear
git checkout feature/TICKET-123
git pull --rebase upstream main
# Resolver conflictos en archivos
git add .
git rebase --continue
git push --force-with-lease origin feature/TICKET-123
```

---

## 9. Protección de Ramas

### 9.1 Reglas de branch protection en GitHub

```yaml
# Configuración de branch protection para main
rules:
  - required_status_checks:
      - lint
      - type-check
      - test-unit
      - test-integration
      - build
      - coverage
      - security-audit
  - enforce_admins: true
  - required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
  - restrictions:
      users: []
      teams: ["backend-core"]
  - required_linear_history: true
  - required_signatures: true
  - allow_force_pushes: false
  - allow_deletions: false
  - lock_branch: false
```

### 9.2 Reglas de protección

| Regla | Aplica a | Excepción |
|-------|----------|-----------|
| Requerir PR | `main` | Hotfix crítico (con aprobación) |
| 1 approval | `main` | — |
| CI verde | `main` | — |
| Sin force push | `main` | — |
| Linear history | `main` | — |
| Code owners | `main` | — |

---

## 10. Nomenclatura

### 10.1 Formato general

```
<tipo>/<ticket-opcional>-<descripcion-corta>
```

### 10.2 Tabla completa

```
feature/TICKET-123-add-user-avatar
fix/TICKET-456-handle-null-email
hotfix/critical-security-patch
release/v1.2.0
chore/update-dependencies
docs/add-api-examples
refactor/extract-auth-service
test/add-user-controller-e2e
perf/optimize-user-list-query
ci/update-github-actions
```

### 10.3 Reglas de nomenclatura

| Regla | Ejemplo ✅ | Ejemplo ❌ |
|-------|-----------|-----------|
| kebab-case | `add-user-avatar` | `addUserAvatar` |
| Sin mayúsculas | `fix/login-error` | `fix/LoginError` |
| Corto y descriptivo | `handle-null-email` | `fix-for-the-bug-that-causes-null-email-problem` |
| Ticket opcional | `TICKET-123-setup` | `setup` (sin ticket cuando aplica) |
| Sin caracteres especiales | `add-user-avatar` | `add_user_avatar_!` |

---

## 11. Squash Merge

### 11.1 Política

Todos los PRs a `main` deben usar **squash merge**.

### 11.2 Por qué squash merge

| Razón | Explicación |
|-------|-------------|
| **Historial limpio** | `main` tiene un commit por feature/fix |
| **Fácil revert** | Revertir un solo commit = revertir toda la feature |
| **Trazabilidad** | El mensaje del squash incluye todos los detalles |
| **Atomicidad** | `main` siempre está en un estado consistente |

### 11.3 Formato del squash commit

```markdown
feat(api): add user avatar upload endpoint (#123)

- Add S3 bucket integration for avatar storage
- Add image validation (max 5MB, JPEG/PNG only)
- Add user avatar URL to profile response
- Add unit tests for avatar service
- Add integration tests for avatar endpoint

Closes TICKET-123
```

### 11.4 Cuándo NO hacer squash

- Ramas `release/` — Usar merge commit (preserva historia)
- Ramas `hotfix/` — Squash merge (un commit por fix)

---

## 12. Política de Tags

### 12.1 Versionado semántico

```
vMAJOR.MINOR.PATCH
```

| Componente | Cuándo incrementar |
|------------|-------------------|
| **MAJOR** | Breaking changes en API, BD o contratos |
| **MINOR** | Nuevas funcionalidades backward-compatible |
| **PATCH** | Bug fixes, parches de seguridad |

### 12.2 Creación de tags

```bash
# Release normal
git tag -a v1.2.0 -m "Release v1.2.0: Add user avatar feature"
git push upstream v1.2.0

# Hotfix
git tag -a v1.2.1 -m "Hotfix v1.2.1: Security patch for session validation"
git push upstream v1.2.1

# Release candidate
git tag -a v2.0.0-rc.1 -m "Release candidate v2.0.0-rc.1"
git push upstream v2.0.0-rc.1
```

### 12.3 Tags existentes

```
v1.0.0
v1.0.1
v1.1.0
v1.2.0
v2.0.0-rc.1  ← release candidate
```
