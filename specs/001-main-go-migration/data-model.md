# Data Model: Migración de la API principal a Go

**Feature**: 001-main-go-migration | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

Modelado relacional en PostgreSQL 16. Derivado de las Key Entities del spec y de los
requisitos FR-001 a FR-037. Las entidades del legacy que no tienen consumidor (AnalyticsEvent,
Incident, ErrorLog) **no se replican**: pertenecen al sistema de diagnóstico retirado.

---

## Convenciones

- **Identificadores**: `uuid` con `DEFAULT gen_random_uuid()` (nativo en PG 13+). Cumple la
  constitution: colisión-imposible y generado por la base de datos.
- **Timestamps**: `timestamptz`, siempre. El legacy usaba `DateTime` de Prisma sin zona,
  lo que hace ambigua cualquier comparación de tiempo entre servicios.
- **Nombres**: `snake_case` en SQL; se mapea a PascalCase en Go por sqlc.
- **Borrado**: `ON DELETE CASCADE` en las tablas dependientes de `users`. Esto es correcto
  porque la cuenta es la raíz del agregado; las tablas de auditoría **no** cuelgan de
  `users` por cascade (ver más abajo).

---

## Entidades

### `users`

Raíz del agregado de identidad.

| Columna             | Tipo                     | Notas                                                      |
| ------------------- | ------------------------ | ---------------------------------------------------------- |
| `id`                | `uuid` PK                | `gen_random_uuid()`                                        |
| `email`             | `citext` UNIQUE NOT NULL | `citext` evita el bug clásico de unicidad case-insensitive |
| `password_hash`     | `text`                   | bcrypt. NULL cuando el usuario solo usa proveedor externo  |
| `email_verified_at` | `timestamptz`            | NULL = no verificado                                       |
| `role`              | `user_role` enum         | `USER`, `ADMIN`. Default `USER`                            |
| `is_active`         | `boolean`                | Default `true`. Desactivación, no borrado                  |
| `created_at`        | `timestamptz`            | `now()`                                                    |
| `updated_at`        | `timestamptz`            | Mantenido por trigger, no por la aplicación                |

**Validaciones**: `email` con formato válido (FR-010). `role` solo `USER` o `ADMIN`.

**Índices**: `UNIQUE(email)` ya indexa. Índice parcial adicional sobre `email` donde
`is_active = false` no se necesita; el índice único basta.

**Nota FR-007**: el mensaje de error por correo no registrado vs contraseña incorrecta debe
ser idéntico. Eso es lógica de dominio, no de esquema — se implementa en
`domain/auth.go`, no aquí.

---

### `identities`

Identidades OAuth vinculadas (FR-008, FR-008a, FR-008b).

| Columna             | Tipo                                      | Notas                                                                         |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `id`                | `uuid` PK                                 |                                                                               |
| `user_id`           | `uuid` FK → `users(id)` ON DELETE CASCADE |                                                                               |
| `provider`          | `text` NOT NULL                           | Discriminante: `google`, `github`, `microsoft`, `apple`, `facebook`, `gitlab` |
| `provider_user_id`  | `text` NOT NULL                           | ID del usuario **dentro** del proveedor                                       |
| `email_at_provider` | `text`                                    | Para detectar cambios de correo en el proveedor                               |
| `email_verified`    | `boolean`                                 | Evidencia de que el proveedor verificó el correo                              |
| `created_at`        | `timestamptz`                             |                                                                               |

**Constraint**: `UNIQUE(provider, provider_user_id)`. Un usuario puede tener varias
identidades; la combinación proveedor+id es única (spec, Key Entities).

**Índice**: adicional sobre `user_id` para la consulta "mis identidades".

**FR-008b en el esquema**: los seis proveedores se registran en `oauth_providers` (tabla de
configuración), de modo que la ausencia de un proveedor sea detectable explícitamente y no
pase inadvertida como exigía la clarificación.

---

### `oauth_providers`

Configuración de los seis proveedores. Tabla de datos, no de configuración de despliegue:
permite reportar qué proveedores están activos sin leer variables de entorno.

| Columna        | Tipo          | Notas                          |
| -------------- | ------------- | ------------------------------ |
| `provider`     | `text` PK     |                                |
| `display_name` | `text`        | Para mostrar en la UI de login |
| `enabled`      | `boolean`     | Default `true`                 |
| `created_at`   | `timestamptz` |                                |

Datos iniciales por migración. La fila debe existir aunque el proveedor esté deshabilitado:
esa es la diferencia entre "deshabilitado" y "no implementado", y es lo que hace que el
requisito sea comprobable.

---

### `sessions`

Tokens de acceso (FR-002, FR-005). El token **no** se almacena en claro.

| Columna      | Tipo                                      | Notas                             |
| ------------ | ----------------------------------------- | --------------------------------- |
| `id`         | `uuid` PK                                 |                                   |
| `user_id`    | `uuid` FK → `users(id)` ON DELETE CASCADE |                                   |
| `token_hash` | `bytea` UNIQUE NOT NULL                   | SHA-256 del token. NUNCA el token |
| `expires_at` | `timestamptz` NOT NULL                    |                                   |
| `revoked_at` | `timestamptz`                             | NULL = activa                     |
| `created_at` | `timestamptz`                             |                                   |

**Índice**: `(user_id)` para listar sesiones activas; `(expires_at)` para limpieza periódica.

**Por qué hash y no el token**: si la tabla se filtra, los tokens siguen siendo seguros.
Es el mismo argumento que el de las contraseñas, y es lo que hace justifiable guardarlos.

---

### `password_reset_tokens`

Recuperación de acceso (FR-004).

| Columna      | Tipo                                      | Notas               |
| ------------ | ----------------------------------------- | ------------------- |
| `id`         | `uuid` PK                                 |                     |
| `user_id`    | `uuid` FK → `users(id)` ON DELETE CASCADE |                     |
| `token_hash` | `bytea` UNIQUE NOT NULL                   | Un solo uso         |
| `expires_at` | `timestamptz` NOT NULL                    | Caducidad explícita |
| `used_at`    | `timestamptz`                             | NULL = no usado     |
| `created_at` | `timestamptz`                             |                     |

**Constraint de un solo uso**: la consulta de redemption MUST incluir `used_at IS NULL` y
`expires_at > now()` en el propio `UPDATE`, no en el `SELECT`. Esto evita la condición de
carrera entre dos peticiones concurrentes con el mismo token. Es un requisito de
correctness, no una optimización.

---

### `user_preferences`

| Columna      | Tipo                                         | Notas                                                |
| ------------ | -------------------------------------------- | ---------------------------------------------------- |
| `user_id`    | `uuid` PK/FK → `users(id)` ON DELETE CASCADE |                                                      |
| `key`        | `text` PK                                    | PK compuesta                                         |
| `value`      | `jsonb` NOT NULL                             | `jsonb` para no añadir columnas por cada preferencia |
| `updated_at` | `timestamptz`                                |                                                      |

---

### `security_events`

Eventos de seguridad (FR-006). **No** cuelga de `users` por cascade: un evento de
autenticación fallida puede no tener usuario asociado (correo inexistente), y el registro
debe sobrevivir al borrado de la cuenta para conservar la trazabilidad.

| Columna          | Tipo                                       | Notas                                                                                                                                                                            |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `uuid` PK                                  |                                                                                                                                                                                  |
| `user_id`        | `uuid` FK → `users(id)` ON DELETE SET NULL | NULL cuando no hay usuario                                                                                                                                                       |
| `event_type`     | `security_event_type` enum                 | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `TOKEN_REFRESHED`, `OAUTH_LINKED`, `ACCOUNT_DEACTIVATED` |
| `origin`         | `text`                                     | IP + user agent. `inet` sería más correcto; `text` por simplicidad del parseo inicial                                                                                            |
| `correlation_id` | `uuid` NOT NULL                            | Propagado (Principio V)                                                                                                                                                          |
| `outcome`        | `text` NOT NULL                            | `success` / `failure` / `denied`                                                                                                                                                 |
| `created_at`     | `timestamptz` NOT NULL                     |                                                                                                                                                                                  |

**Índices**: `(user_id, created_at DESC)` para consulta por usuario; `(created_at DESC)` para
la ventana de retención.

**Distinción crítica (spec)**: esta tabla registra **intentos de autenticación**. La
bitácora de actividad (`activity_log`) registra **acciones de negocio**. Son cosas distintas
y el spec las separa explícitamente (FR-033).

---

### `activity_log`

Bitácora de actividad (FR-033, FR-034, FR-035, FR-035b).

| Columna          | Tipo                                       | Notas                                                      |
| ---------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `id`             | `uuid` PK                                  |                                                            |
| `user_id`        | `uuid` FK → `users(id)` ON DELETE SET NULL | Mismo criterio: la trazabilidad sobrevive al borrado       |
| `action`         | `text` NOT NULL                            | `profile.updated`, `preference.changed`, `identity.linked` |
| `resource_type`  | `text`                                     | `user`, `identity`, `preference`                           |
| `resource_id`    | `text`                                     |                                                            |
| `correlation_id` | `uuid` NOT NULL                            |                                                            |
| `severity`       | `activity_severity` enum                   | `INFO`, `NOTICE`, `WARNING`. Default `INFO`                |
| `metadata`       | `jsonb`                                    | Contexto adicional, no datos sensibles                     |
| `created_at`     | `timestamptz` NOT NULL                     |                                                            |

**Append-only (FR-035)**: no existe `updated_at`. No hay sentencia `UPDATE` ni `DELETE` en
ninguna consulta sqlc contra esta tabla. La restricción se aplica en el código generado y
se verifica en test.

**Retención (FR-035b)**: los registros con `created_at` anterior a 12 meses se agregan por
`(action, date_trunc('day', created_at))` y el detalle individual se elimina. La agregación
**no** se implementa en Phase 1: es una tarea de mantenimiento programado, registrada en
tasks. La tabla se crea ya con los índices que necesitará.

**Índices**: `(user_id, created_at DESC)` para FR-034 (consulta por usuario e intervalo);
`(created_at DESC)` para la retención.

---

### `encrypted_material`

Material cifrado en reposo (FR-036, FR-037).

| Columna       | Tipo                                      | Notas                                                                 |
| ------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `id`          | `uuid` PK                                 |                                                                       |
| `user_id`     | `uuid` FK → `users(id)` ON DELETE CASCADE |                                                                       |
| `kind`        | `text` NOT NULL                           | `email`, `phone`, `secret`, `note`                                    |
| `ciphertext`  | `bytea` NOT NULL                          |                                                                       |
| `algorithm`   | `text` NOT NULL                           | Ej. `AES-256-GCM`                                                     |
| `key_version` | `integer` NOT NULL                        | Clave concreta usada. **Es lo que hace posible rotar sin reescribir** |
| `nonce`       | `bytea` NOT NULL                          |                                                                       |
| `created_at`  | `timestamptz` NOT NULL                    |                                                                       |
| `updated_at`  | `timestamptz`                             |                                                                       |

**FR-037 en el esquema**: `key_version` es la columna crítica. La rotación deriva una nueva
subclave vía HKDF y escribe la versión nueva; los registros antiguos siguen descifrables con
`key_version` antigua mientras la clave maestra de la que se derivó siga existiendo. Sin esta columna, la
rotación obligaría a reescribir todos los registros.

**Índice**: `(user_id, kind)`.

---

### `realtime_subscriptions`

Estado de los canales en tiempo real. **No** es cache de negocio: es estado de conexión
efímero.

| Columna        | Tipo                                         | Notas                                     |
| -------------- | -------------------------------------------- | ----------------------------------------- |
| `id`           | `uuid` PK                                    |                                           |
| `user_id`      | `uuid` FK → `users(id)` ON DELETE CASCADE    |                                           |
| `session_id`   | `uuid` FK → `sessions(id)` ON DELETE CASCADE |                                           |
| `connected_at` | `timestamptz`                                |                                           |
| `last_seen_at` | `timestamptz`                                | Para detectar conexiones muertas (FR-019) |

**Nota de diseño**: si esta tabla resulta ser reconstruible desde el estado en memoria del
proceso, **debe eliminarse**. Está aquí solo porque FR-020 necesita que el canal se autentique
con la sesión. Si la verificación puede hacerse contra la tabla `sessions` directamente, esta
tabla es redundante y se va. Registrado como pregunta abierta en tasks.

---

## Migración del legacy

De los 8 modelos Prisma del legacy:

| Modelo legacy    | Destino                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| `User`           | `users` (se reescribe: el legacy no separaba email verificado de forma útil) |
| `SocialAccount`  | `identities`                                                                 |
| `RefreshToken`   | `sessions`                                                                   |
| `AuditLog`       | Se fusiona en `security_events` + `activity_log` según el tipo               |
| `ActivityLog`    | `activity_log`                                                               |
| `AnalyticsEvent` | **No se replica** — pertenece al diagnóstico retirado                        |
| `Incident`       | **No se replica** — mismo motivo                                             |
| `ErrorLog`       | **No se replica** — mismo motivo                                             |

**Sin migración de datos.** El spec confirma entorno limpio (Q2 de clarify). Solo la
estructura.

---

## Invariantes que debe garantizar el modelo

1. Ningún dato de negocio en memoria (Principio III).
2. Todo `UPDATE` sobre `password_reset_tokens` que marque uso incluye `used_at IS NULL`.
3. `token_hash` nunca es el token en claro.
4. `security_events` y `activity_log` sobreviven al borrado del usuario (`SET NULL`).
5. `users`, `identities` y `sessions` sí se borran en cascada: son parte del agregado.
6. Ninguna sentencia `UPDATE` ni `DELETE` contra `activity_log`.
7. `key_version` presente en todo material cifrado.
