# Quickstart: Migración de la API principal a Go

**Feature**: 001-main-go-migration | **Fecha**: 2026-10-10

Guía para levantar y validar la API reescrita de extremo a extremo. Es un **guía de
validación**, no un manual de implementación: el detalle del código pertenece a `tasks.md`.

---

## Prerrequisitos

| Herramienta           | Versión | Estado en esta máquina                      |
| --------------------- | ------- | ------------------------------------------- |
| Go                    | 1.27.1  | **Instalada** (`go version`)                |
| PostgreSQL            | 16      | **No instalada**                            |
| Redis                 | 7       | **No instalada**                            |
| `sqlc`                | v1.x    | **No instalado**                            |
| `goose` (migraciones) | v3      | **No instalado**                            |
| Docker                | —       | **No instalado**, y no se requiere en local |

Sobre Docker: no está instalado y no se necesita. El spec establece que _"el entorno de
desarrollo local no requiere contenedores y no debe imponerlos"_, y la constitution limita el
stack local a 2 GB. Ver research.md, Decisión 5.

---

## Puesta en marcha

### 1. Base de datos

```powershell
# Instalar PostgreSQL 16 (una vez)
winget install PostgreSQL.PostgreSQL.16

# Crear la base de datos de desarrollo
createdb -U postgres backend_dev
```

### 2. Redis

```powershell
winget install Redis.Redis
redis-server --maxmemory 512mb --maxmemory-policy noeviction
```

> **`noeviction` no es opcional.** Cualquier otra política expulsa claves silenciosamente.
> En el legacy, `allkeys-lru` con 256 MB destruía jobs de cola sin registrar error. Es el
> defecto exacto que la constitution prohíbe.

### 3. Configuración

Toda la configuración va por variables de entorno (FR-030). Ningún secreto en archivo.

```powershell
$env:PORT="8080"
$env:DATABASE_URL="postgres://postgres@localhost:5432/backend_dev?sslmode=disable"
$env:REDIS_URL="redis://localhost:6379/0"
$env:JWT_SECRET="<al menos 32 bytes aleatorios>"
$env:CORS_ORIGINS="http://localhost:3000"
$env:ENCRYPTION_KEY="<base64 de 32 bytes>"
$env:ENCRYPTION_KEY_VERSION="1"
$env:LOG_LEVEL="info"
```

Las claves OAuth de los seis proveedores:

```powershell
$env:GOOGLE_CLIENT_ID="..."     ; $env:GOOGLE_CLIENT_SECRET="..."
$env:GITHUB_CLIENT_ID="..."     ; $env:GITHUB_CLIENT_SECRET="..."
$env:MICROSOFT_CLIENT_ID="..."  ; $env:MICROSOFT_CLIENT_SECRET="..."
$env:APPLE_CLIENT_ID="..."      ; $env:APPLE_CLIENT_SECRET="..."
$env:FACEBOOK_CLIENT_ID="..."   ; $env:FACEBOOK_CLIENT_SECRET="..."
$env:GITLAB_CLIENT_ID="..."     ; $env:GITLAB_CLIENT_SECRET="..."
```

Un valor inválido **aborta el arranque**. No hay valores por defecto silenciosos: un
`JWT_SECRET` de 8 caracteres es un fallo de configuración, no un modo de operación.

### 4. Migraciones

```powershell
cd api
goose -dir adapter/postgres/migrations postgres "$env:DATABASE_URL" up
```

### 5. Generar el código de acceso a datos

```powershell
cd api
sqlc generate
```

### 6. Arrancar

```powershell
cd api
go run ./cmd/server
```

Salida esperada:

```json
{ "level": "info", "msg": "server listening", "port": 8080 }
```

---

## Validación

### El sistema funciona

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
```

`status` debe ser `healthy` y ambas dependencias `up`. Si Postgres no responde, debe ser
`degraded` **y nombrar PostgreSQL** — un health check que siempre dice "ok" incumple FR-025.

### El presupuesto de memoria se cumple (SC-002)

```powershell
$p = Get-Process server
[math]::Round($p.WorkingSet64 / 1MB, 1)   # debe ser < 150
```

Este es un criterio de aceptación, no una comprobación opcional. Si lo supera, la causa
tiene que estar identificada antes de seguir.

### El stack completo cabe (SC-001)

```powershell
# Suma de los tres procesos principales
Get-Process server, postgres, redis-server |
  Measure-Object -Property WorkingSet64 -Sum |
  ForEach-Object { [math]::Round($_.Sum / 1MB / 1024, 2) }   # debe ser < 2, en GB
```

### Registro y autenticación funcionan

```powershell
$body = @{ email = "test@example.com"; password = "correct-horse-battery" } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/auth/register `
     -Body $body -ContentType "application/json"

$headers = @{ Authorization = "Bearer $($r.accessToken)" }
Invoke-RestMethod -Uri http://localhost:8080/api/v1/users/me -Headers $headers
```

### Los datos sobreviven al reinicio (SC-003, Principio III)

```powershell
# Con el servidor PARADO
Stop-Process -Name server
go run ./cmd/server
# El login anterior debe seguir funcionando con el mismo token
```

Este es el test que el legacy no podía pasar: sus cinco almacenes en `Map` perdían todo.

### El aislamiento entre usuarios funciona (SC-007)

```powershell
# Registrar A y B, luego intentar que A lea un recurso de B
# debe ser 404/403, nunca datos de B
```

### Las consultas generate sqlc

```powershell
cd api
sqlc generate      # sin errores
go vet ./...       # sin hallazgos
go test ./...      # todo verde
```

### Los seis proveedores están declarados (FR-008b)

```powershell
(Invoke-RestMethod http://localhost:8080/api/v1/auth/oauth/providers).providers |
  Select-Object provider, enabled
```

Deben aparecer los seis, incluidos los deshabilitados. Si uno falta, el requisito está
incumplido por definición.

---

## La imagen de contenedor se construye

```powershell
cd api
docker build -t backend-api:test .
```

Es un gate de la constitution. Nota: Docker no está instalado en la máquina objetivo — este
paso se ejecuta **en CI**, no en local.

---

## Qué NO se valida aquí

| Tema                               | Dónde                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Carga y p95 (SC-006)               | Requiere el perfil de 20 usuarios concurrentes, definido en plan.md. Se mide en el hardware objetivo, no en local |
| Cobertura del 70%                  | `go test -cover ./...`                                                                                            |
| Aggregación de bitácora a 12 meses | Tarea programada; no está en v1                                                                                   |
| Los cuatro microservicios          | Fuera de alcance                                                                                                  |

---

## Problemas frecuentes

| Síntoma                                   | Causa probable                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| El arranque aborta sin mensaje claro      | Falta una variable de entorno obligatoria. El log indica cuál.                                           |
| `401` en todos los endpoints              | `JWT_SECRET` distinto entre arranques, o reloj desfasado                                                 |
| Los datos desaparecen al reiniciar        | Se está usando almacenamiento en memoria. Incumple el Principio III: es un defecto, no una configuración |
| `sqlc generate` falla                     | Las consultas `.sql` no compilan. Ejecutar `sqlc compile` para ver el error exacto                       |
| La conexión se cierra sola en tiempo real | El token caducó; se emite `session.revoked` y el cliente debe cerrar                                     |
