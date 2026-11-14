# Contrato HTTP: API principal

**Feature**: 001-main-go-migration | **Date**: 2026-10-10

OpenAPI 3.1. Base: `/api/v1`. Todos los cuerpos en JSON salvo cuando se indica otra cosa.

Este contrato sustituye al del legacy, que prometía endpoints Products y Orders que nunca
se implementaron (Principio IV: la documentación describe solo lo que existe).

---

## Convenciones

### Autenticación

`Authorization: Bearer <token>`. La misma credencial sirve para HTTP y para el canal de
tiempo real.

### Identidad de petición

Cabecera `X-Correlation-ID`:

- Si el cliente la envía, se usa y se propaga.
- Si falta, el servidor genera una.
- Se devuelve siempre en la respuesta.
- Se propaga a logs, `security_events` y `activity_log`.

### Errores

Formato único, todos los casos:

```json
{
  "error": {
    "code": "invalid_credentials",
    "message": "Credenciales incorrectas",
    "correlationId": "uuid",
    "details": {}
  }
}
```

`message` es para humanos y puede cambiar. `code` es estable y es lo que consumen los
clientes.

| HTTP | `code` representativo                                   |
| ---- | ------------------------------------------------------- |
| 400  | `validation_failed`, `invalid_request`                  |
| 401  | `invalid_credentials`, `token_expired`, `token_revoked` |
| 403  | `forbidden`                                             |
| 404  | `not_found`                                             |
| 409  | `conflict`, `email_already_registered`                  |
| 429  | `rate_limited`                                          |
| 500  | `internal_error`                                        |

**FR-007**: `invalid_credentials` se devuelve indistintamente para correo no registrado y
para contraseña incorrecta. El mensaje es el mismo, el código es el mismo, y el **tiempo de
respuesta también** — la enumeración por temporización es tan filtrante como el mensaje.

---

## Endpoints

### Salud y diagnóstico

| Método | Ruta       | Auth | Requisitos          |
| ------ | ---------- | ---- | ------------------- |
| GET    | `/health`  | No   | FR-025, Principio V |
| GET    | `/metrics` | No   | FR-024              |

`/health` reporta el estado **real** de cada dependencia, no un "ok" genérico:

```json
{
  "status": "degraded",
  "dependencies": {
    "postgres": { "status": "up", "latencyMs": 2 },
    "redis": { "status": "up", "latencyMs": 1 }
  },
  "version": "commit-sha",
  "uptimeSeconds": 3600
}
```

`status` es `healthy`, `degraded` o `unhealthy` según las dependencias. Un health check que
siempre devuelve 200 no cumple el requisito.

---

### Autenticación

| Método | Ruta                    | Auth | Requisitos             |
| ------ | ----------------------- | ---- | ---------------------- |
| POST   | `/auth/register`        | No   | FR-001, FR-007         |
| POST   | `/auth/login`           | No   | FR-002, FR-006, FR-007 |
| POST   | `/auth/logout`          | Sí   | FR-006                 |
| POST   | `/auth/refresh`         | No   | FR-005                 |
| POST   | `/auth/password/forgot` | No   | FR-004                 |
| POST   | `/auth/password/reset`  | No   | FR-004                 |

#### `POST /auth/register`

```json
// petición
{ "email": "user@example.com", "password": "..." }

// respuesta 201
{
  "user": { "id": "uuid", "email": "user@example.com", "role": "USER",
            "emailVerified": false, "createdAt": "RFC3339" },
  "accessToken": "...",
  "expiresAt": "RFC3339"
}
```

`409 email_already_registered` si el correo existe. Contraseña: mínimo 12 caracteres
(la longitud mínima de los años 2020s, no 8).

#### `POST /auth/login`

Respuesta idéntica a `register`. La diferencia observable entre usuario inexistente y
contraseña incorrecta debe ser **imperceptible**: mismo código, mismo mensaje, mismo tiempo.

#### `POST /auth/password/forgot`

```json
{ "email": "user@example.com" }
```

**Siempre responde 200**, exista o no el correo. Distinta de `login`: aquí el requisito es
no revelar la existencia de la cuenta, y por tanto no puede haber conflicto.

En un entorno sin usuarios reales ni correo configurado, el endpoint registra el evento y
responde 200 sin enviar nada. El enlace se entrega por el canal de desarrollo.

#### `POST /auth/password/reset`

```json
{ "token": "...", "newPassword": "..." }
```

`400 invalid_token` si el token caducó, ya se usó o no existe. El uso se marca con un
`UPDATE` condicional (ver data-model.md, sección `password_reset_tokens`).

---

### Proveedores externos (FR-008, FR-008a, FR-008b)

| Método | Ruta                               | Auth | Requisitos      |
| ------ | ---------------------------------- | ---- | --------------- |
| GET    | `/auth/oauth/providers`            | No   | FR-008b         |
| GET    | `/auth/oauth/{provider}/authorize` | No   | FR-008          |
| GET    | `/auth/oauth/{provider}/callback`  | No   | FR-008, FR-008a |

#### `GET /auth/oauth/providers`

```json
{
  "providers": [
    { "provider": "google", "displayName": "Google", "enabled": true },
    { "provider": "apple", "displayName": "Apple", "enabled": true }
  ]
}
```

Devuelve **los seis**, incluidos los deshabilitados. Es lo que hace que "ninguno se omite de
forma silenciosa" sea comprobable por un cliente.

#### Callback y verificación de firma (FR-008a)

El callback **MUST** validar la firma antes de actuar:

| Proveedor | Verificación                                                                |
| --------- | --------------------------------------------------------------------------- |
| Google    | `id_token` firmado; verificar contra JWKS de Google, audience = client ID   |
| GitHub    | Exchange code → token; llamar `/user` a GitHub y usar la identidad devuelta |
| Microsoft | `id_token` firmado contra JWKS de Microsoft                                 |
| **Apple** | **`id_token` firmado ES256** contra JWKS de Apple + verificar nonce         |
| Facebook  | Graph API debug_token: la propia API valida el token                        |
| GitLab    | `id_token`/`access_token` contra la API de GitLab                           |

**Apple es la única que exige verificación criptográfica propia** (ES256, no solo HTTPS).

Códigos de error: `400 invalid_oauth_state` (CSRF), `400 invalid_signature`, `401
provider_error`, `502 provider_unavailable`.

---

### Usuarios (FR-009, FR-010, FR-011)

| Método | Ruta                          | Auth | Requisitos     |
| ------ | ----------------------------- | ---- | -------------- |
| GET    | `/users/me`                   | Sí   | FR-009         |
| PATCH  | `/users/me`                   | Sí   | FR-009, FR-010 |
| GET    | `/users/me/preferences`       | Sí   | FR-009         |
| PUT    | `/users/me/preferences/{key}` | Sí   | FR-009, FR-010 |

`PATCH /users/me` acepta un subconjunto de campos. Campo desconocido → `400
validation_failed`, no ignorado en silencio.

`GET /users/me` es la ruta de mayor tráfico del perfil de carga de SC-006.

---

### Auditoría y bitácora (FR-034)

| Método | Ruta                                    | Auth  | Requisitos     |
| ------ | --------------------------------------- | ----- | -------------- |
| GET    | `/activity`                             | Sí    | FR-034         |
| GET    | `/activity/{resourceType}/{resourceId}` | Sí    | FR-034         |
| GET    | `/audit/security-events`                | Admin | FR-006, FR-034 |

Ambas consultas de bitácora paginan con `limit` (máx. 200) y `cursor`. Sin endpoint de
modificación ni borrado: FR-035 es append-only y la ausencia de ruta lo hace verificable.

---

## Requisitos transversales

| Requisito | Dónde se cumple                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| FR-003    | Middleware de auth en todo grupo no público. Un handler sin middleware es bloqueador de release (Security Requirements) |
| FR-010    | Validación en el borde: tipo, formato, rango, longitud, antes del dominio                                               |
| FR-011    | Toda consulta incluye `WHERE user_id = ?`. Sin excepción                                                                |
| FR-012    | Postgres. Cero `Map`                                                                                                    |
| FR-014    | Transacción para operaciones multi-escritura                                                                            |
| FR-015    | `gen_random_uuid()`                                                                                                     |
| FR-023    | Logs JSON con correlation ID                                                                                            |
| FR-024    | Métricas por ruta en `/metrics`                                                                                         |
| FR-027    | Timeout configurable en toda llamada externa; excedencia = error explícito                                              |
| FR-030    | Configuración solo por variables de entorno                                                                             |
| FR-031    | Límites de memoria en Redis; `noeviction`                                                                               |
| FR-032    | Sin dependencia de plataforma ausente en el entorno objetivo                                                            |

---

## Límites y cabeceras de seguridad

Por defecto en toda respuesta:

- Límite de cuerpo de petición: 1 MB (o 10 MB en `POST /auth/oauth/{provider}/callback`).
- Cabeceras: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, `Strict-Transport-Security` en producción.
- CORS: lista explícita de orígenes permitidos. Nunca comodín con credenciales.
- Timeout por defecto de toda petición: 30 s.
- Graceful shutdown: 15 s para terminar peticiones en curso.
