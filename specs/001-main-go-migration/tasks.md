---
description: 'Task list for 001-main-go-migration'
---

# Tasks: Migración de main a Go

**Input**: Design documents de `/specs/001-main-go-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml.md,
contracts/realtime.md, quickstart.md

**Tests**: Las tareas de test están INCLUIDAS. El principio IV de la constitution exige TDD y
SC-004 exige "100% de los flujos con test e2e". No es opcional en este proyecto.

**Organization**: Las tareas se agrupan por historia de usuario para permitir implementacion y
prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A que historia de usuario pertenece la tarea
- Rutas exactas incluidas en cada descripcion

## Path Conventions

Todas las rutas relativas al directorio `api/` (ver plan.md: `api/` en lugar de `main/` para
coexistir con el NestJS legacy durante la transicion).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializacion del proyecto Go y del andamiaje de construccion

- [ ] T001 Crear el arbol de directorios de `api/` segun plan.md: `api/cmd/server/`, `api/internal/config/`, `api/internal/domain/`, `api/internal/transport/http/middleware/`, `api/internal/transport/http/handlers/`, `api/internal/adapter/postgres/queries/`, `api/internal/adapter/postgres/migrations/`, `api/internal/adapter/redis/`, `api/internal/adapter/oauth/`, `api/internal/observability/`, `api/internal/testutil/`
- [ ] T002 Inicializar el modulo Go en `api/go.mod` con nombre `github.com/codeibrah/backend/api` y fijar `go 1.27.1`; anadir dependencias de research.md: `github.com/go-chi/chi/v5`, `github.com/golang-jwt/jwt/v5`, `golang.org/x/crypto`, `github.com/google/uuid`, `github.com/jackc/pgx/v5`, `github.com/prometheus/client_golang`, OTel (`go.opentelemetry.io/otel`, `otelhttp`), `github.com/gorilla/websocket`, `golang.org/x/oauth2`, `github.com/pressly/goose/v3`, y de test `github.com/stretchr/testify`, `github.com/testcontainers/postgresql`
- [ ] T003 [P] Escribir `api/sqlc.yaml` apuntando a `api/internal/adapter/postgres/queries/*.sql`, engine `postgresql`, con `sql_package: pgx/v5`
- [ ] T004 [P] Escribir `api/Makefile` con targets: `generate` (sqlc generate), `migrate-up`, `migrate-down`, `build`, `test`, `vet`, `bench`, `run`
- [ ] T005 [P] Escribir `api/.env.example` con todas las claves de quickstart.md; ningun valor por defecto silencioso
- [ ] T006 [P] Escribir `.gitignore` incluyendo `.env`, binarios de compilacion, `.sqlc/` generado y el `dev.db` legacy
- [ ] T007 [P] Escribir `api/Dockerfile` multi-etapa: etapa build con `golang:1.27`, etapa final minima; un unico binario estatico, sin Node en la imagen final
- [ ] T008 [P] Escribir `.github/workflows/ci.yml` que ejecute `go build ./...`, `go vet ./...`, `go test ./...` y la construccion de la imagen (SC-008: el build de imagen MUST ser verificado en CI)
- [ ] T009 Instalar `sqlc` v1.x y `goose` en la maquina de desarrollo; documentar el comando en `api/Makefile`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura que MUST completarse antes de CUALQUIER historia de usuario

**CRITICAL**: Ningun trabajo de historia de usuario puede empezar antes de completar esta fase

### Migraciones de base de datos (autoritativas y unicas)

- [ ] T010 Escribir `api/internal/adapter/postgres/migrations/00001_init.sql` creando la extension `citext` y el enum `user_role` con valores `user` y `admin`
- [ ] T011 [P] Escribir en `api/internal/adapter/postgres/migrations/00001_init.sql` la tabla `users` con `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `email citext NOT NULL UNIQUE`, `password_hash text NULL` (nullable: obligatorio para cuentas solo-OAuth), `role user_role NOT NULL DEFAULT 'user'`, `is_active boolean NOT NULL DEFAULT true`, `created_at`, `updated_at`
- [ ] T012 [P] Escribir en `.../00001_init.sql` la tabla `identities` con `provider text NOT NULL`, `provider_user_id text NOT NULL`, `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`, y la restriccion `UNIQUE (provider, provider_user_id)`
- [ ] T013 [P] Escribir en `.../00001_init.sql` la tabla `oauth_providers` (tabla de configuracion: su presencia hace verificable FR-008b) con `provider text PRIMARY KEY`, `client_id`, `client_secret_ciphertext`, `is_enabled boolean NOT NULL DEFAULT true`, `config jsonb`
- [ ] T014 [P] Escribir en `.../00001_init.sql` la tabla `sessions` con `token_hash bytea NOT NULL UNIQUE` que almacena SHA-256 del token y NUNCA el token en claro, `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `expires_at timestamptz NOT NULL`, `revoked_at timestamptz NULL`, `created_at`
- [ ] T015 [P] Escribir en `.../00001_init.sql` la tabla `password_reset_tokens` con `token_hash bytea NOT NULL UNIQUE`, `user_id` FK CASCADE, `expires_at timestamptz NOT NULL`, `used_at timestamptz NULL`
- [ ] T016 [P] Escribir en `.../00001_init.sql` la tabla `user_preferences` con PRIMARY KEY compuesta `(user_id, key)`, `user_id` FK CASCADE, `value jsonb NOT NULL`
- [ ] T017 [P] Escribir en `.../00001_init.sql` la tabla `security_events` con `user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL` (SET NULL: el evento sobrevive al borrado de la cuenta para trazabilidad) y enum `event_type` con 9 valores
- [ ] T018 [P] Escribir en `.../00001_init.sql` la tabla `activity_log` append-only con `user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL`, enum `severity`, `metadata jsonb`, y **sin columna `updated_at`**
- [ ] T019 [P] Escribir en `.../00001_init.sql` la tabla `encrypted_material` con `algorithm text NOT NULL`, **`key_version integer NOT NULL`** (columna que hace posible rotar sin reescribir datos), `ciphertext bytea NOT NULL`
- [ ] T020 [P] Crear el indice unico parcial que impide modificar o borrar `activity_log` (invariante de data-model.md), y el indice de consulta por `user_id` y rango temporal
- [ ] T021 Escribir `api/internal/adapter/postgres/migrations/00001_down.sql` con el `DROP` correspondiente en orden inverso, para que toda migracion sea reversible (principio III)
- [ ] T022 Ejecutar `sqlc generate` y verificar que se generan los tipos Go para las 9 tablas

### Configuracion y dominio

- [ ] T023 [P] Escribir `api/internal/config/config.go`: carga desde variables de entorno; **un valor invalido MUST abortar el arranque**, sin defaults silenciosos (segun quickstart.md)
- [ ] T024 [P] Escribir `api/internal/domain/ports.go` con las interfaces que define el dominio (UserRepository, SessionStore, TokenIssuer, EventRecorder, Cipher, RealtimePublisher). Logica pura, sin imports de HTTP ni SQL
- [ ] T025 [P] Escribir `api/internal/testutil/testutil.go` con helpers para lanzar la app en un test y conexion a Postgres de test isolated

### Observabilidad (principio V - bloqueante para las 5 historias)

- [ ] T026 [P] Escribir `api/internal/observability/logging.go` con `log/slog` de la stdlib en formato JSON (research.md decision 6: NO zerolog)
- [ ] T027 [P] Escribir `api/internal/observability/metrics.go` registrando el collector Prometheus y un histogram con latencia por ruta con buckets que cubran p95 = 200 ms (SC-006)
- [ ] T028 [P] Escribir `api/internal/observability/tracing.go` con el tracer de OTel y el wrapper `otelhttp` para instrumentar llamadas salientes
- [ ] T029 Escribir `api/internal/transport/http/middleware/correlation.go`: genera o propaga el correlation ID, lo adjunta al contexto y a cada linea de log. Base de SC-005
- [ ] T030 Escribir `api/internal/transport/http/middleware/metrics.go`: registra por ruta el codigo de estado y la duracion
- [ ] T031 Escribir `api/internal/transport/http/middleware/auth.go`: exige Bearer valido en toda ruta no publica. Una ruta sin este middleware MUST considerarse release blocker (seccion Security Requirements)

### Errores, router y salud

- [ ] T032 [P] Escribir `api/internal/domain/errors.go` con el catalogo de codigos de error estables del contrato `contracts/openapi.yaml.md`
- [ ] T033 Escribir `api/internal/transport/http/errors.go`: serializador de error unico con `code` estable y `message` para humanos
- [ ] T034 Escribir `api/internal/transport/http/router.go` con `chi` v5: grupos jerarquicos, cadena de middleware en el orden documentado, y TODAS las rutas de `contracts/openapi.yaml.md` declaradas aunque devuelvan 501
- [ ] T035 Escribir `api/internal/transport/http/middleware/security.go`: cabeceras de seguridad y limites de tamano de cuerpo por defecto
- [ ] T036 Escribir `api/internal/transport/http/handlers/health.go`: comprueba CADA dependencia (Postgres, Redis) y reporta `healthy` / `degraded` / `unhealthy` nombrando la dependencia concreta que falla. Un health check que siempre devuelve ok MUST considerarse fallo
- [ ] T037 Escribir `api/internal/transport/http/handlers/metrics.go`: expone `GET /api/v1/metrics`
- [ ] T038 Escribir `api/cmd/server/main.go`: conecta config, Postgres, Redis, observabilidad; signal handling para apagado ordenado
- [ ] T039 Escribir test de `api/internal/config/config.go` que verifique que una variable ausente o invalida aborta el arranque

---

## Phase 3: User Story 1 - Arranque del stack completo en el hardware objetivo (Priority: P1) - MVP

**Goal**: El servicio arranca en la maquina de desarrollo objetivo y cumple los presupuestos de
memoria de SC-001 y SC-002.

**Independent Test**: Arrancar el servicio, medir el consumo del binario en reposo y la suma del
stack (servicio + Postgres + Redis), y comprobar que estan por debajo de los umbrales.

### Tests for User Story 1

> **NOTA**: escribir estos tests PRIMERO y verificar que FALLAN antes de implementar

- [ ] T040 [P] [US1] Test de arranque en `api/cmd/server/main_test.go`: verifica que el proceso levanta sin variables invalidas
- [ ] T041 [P] [US1] Test del endpoint de salud en `api/internal/transport/http/handlers/health_test.go`: con Postgres detenido MUST reportar `unhealthy` nombrando Postgres
- [ ] T042 [P] [US1] Test del contrato de metricas en `api/internal/transport/http/handlers/metrics_test.go`: verifica que se expone el histogram de latencia por ruta

### Implementation for User Story 1

- [ ] T043 [US1] Escribir `api/internal/adapter/postgres/postgres.go`: pool de conexiones pgx con limites explicitos, health probe y cierre ordenado
- [ ] T044 [US1] Escribir `api/internal/adapter/redis/redis.go`: cliente con health probe y cierre ordenado
- [ ] T045 [US1] Ejecutar `make migrate-up` sobre una base limpia en `api/internal/adapter/postgres/migrations/00001_init.sql` y verificar que las 9 tablas se crean (SC-003)
- [ ] T046 [US1] Implementar el apagado ordenado en `api/cmd/server/main.go`: al recibir SIGTERM, dejar de aceptar peticiones, drenar conexiones y cerrar dependencias
- [ ] T047 [US1] Documentar en `api/README.md` como medir el consumo en reposo: RSS del proceso tras 5 minutos sin trafico
- [ ] T048 [US1] MEDIR y registrar los resultados de SC-001 (<40% de RAM sin swap) y SC-002 (<150 MB en reposo) en `specs/001-main-go-migration/benchmarks.md`. **Sin numeros medidos esta historia NO esta completa**

**Checkpoint**: User Story 1 completa y medible de forma independiente

---

## Phase 4: User Story 2 - Registro, login y recuperacion de contrasena (Priority: P2)

**Goal**: Un usuario puede registrarse, iniciar sesion, refrescar su sesion y recuperar su contrasena
con persistencia real.

**Independent Test**: Registrar un usuario, cerrar sesion, reiniciar el proceso, iniciar sesion de
nuevo con las mismas credenciales.

### Tests for User Story 2

- [ ] T049 [P] [US2] Test e2e de registro en `api/internal/transport/http/handlers/auth_register_test.go`
- [ ] T050 [P] [US2] Test e2e de login en `api/internal/transport/http/handlers/auth_login_test.go`
- [ ] T051 [P] [US2] Test de indistinguibilidad en `api/internal/transport/http/handlers/auth_login_test.go`: correo inexistente y contrasena incorrecta MUST devolver el MISMO codigo `invalid_credentials` Y una duracion equivalente (FR-007)
- [ ] T052 [P] [US2] Test e2e de recuperacion en `api/internal/transport/http/handlers/auth_password_test.go`: forgot y reset
- [ ] T053 [P] [US2] Test de concurrencia de `api/internal/adapter/postgres/queries/password_reset.sql`: el `UPDATE` de redencion MUST incluir `used_at IS NULL AND expires_at > now()`; un token expirado o ya usado MUST seguir devolviendo cero filas afectadas
- [ ] T054 [P] [US2] Test e2e de `GET /api/v1/users/me` en `api/internal/transport/http/handlers/users_me_test.go`
- [ ] T055 [P] [US2] Test de aislamiento entre usuarios en `api/internal/transport/http/handlers/users_me_test.go`: el usuario B MUST NOT poder leer datos del usuario A
- [ ] T056 [US2] Test de persistencia tras reinicio en `api/internal/adapter/postgres/persistence_test.go`: escribir, reiniciar el pool, leer. **Este es el test que el legacy no podia pasar**

### Implementation for User Story 2

- [ ] T057 [P] [US2] Escribir consultas en `api/internal/adapter/postgres/queries/users.sql`: crear usuario, buscar por correo, actualizar perfil
- [ ] T058 [P] [US2] Escribir consultas en `api/internal/adapter/postgres/queries/sessions.sql`: crear sesion con `token_hash`, revocar, listar activas, verificar token por hash
- [ ] T059 [P] [US2] Escribir consultas en `api/internal/adapter/postgres/queries/password_reset.sql`: crear token, redimir token, invalidar tokens previos
- [ ] T060 [US2] Escribir `api/internal/domain/password.go` con el hash bcrypt via `golang.org/x/crypto` y verificacion constante en el tiempo
- [ ] T061 [US2] Escribir `api/internal/domain/token.go`: generacion del token de sesion, SHA-256 para almacenarlo, emision y validacion de JWT con `golang-jwt/jwt/v5`
- [ ] T062 [US2] Escribir `api/internal/domain/authservice.go` con la logica de registro, login, logout, refresh, forgot y reset. Sin imports de HTTP ni SQL
- [ ] T063 [US2] Implementar `api/internal/transport/http/handlers/auth.go` con los 6 endpoints de auth del contrato
- [ ] T064 [US2] Implementar `api/internal/transport/http/handlers/users.go` con `GET /api/v1/users/me` y las preferencias
- [ ] T065 [US2] Registrar en la bitacora los eventos de seguridad de esta historia (login exitoso, login fallido, recuperacion solicitada, contrasena cambiada) via la tabla `security_events`

**Checkpoint**: User Stories 1 y 2 funcionando de forma independiente

---

## Phase 5: User Story 3 - Proveedores de autenticacion externos (Priority: P3)

**Goal**: Los seis proveedores OAuth del legacy funcionan en Go con verificacion criptografica
real de la firma del proveedor.

**Independent Test**: Para cada proveedor, un callback con firma valida crea o recupera la sesion;
un callback con firma invalida es rechazado.

### Tests for User Story 3

- [ ] T066 [P] [US3] Test de la tabla de proveedores en `api/internal/transport/http/handlers/oauth_providers_test.go`: `GET /api/v1/oauth/providers` MUST listar los seis proveedores configurados (FR-008b)
- [ ] T067 [P] [US3] Test de verificacion de firma generica en `api/internal/adapter/oauth/signature_test.go` con los pares clave publica / firma de cada proveedor
- [ ] T068 [US3] Test de Apple en `api/internal/adapter/oauth/apple_test.go`: **Apple MUST exigir verificacion JWT ES256 propia**; un id_token con firma manipulada MUST ser rechazado. Es la integracion de mayor riesgo
- [ ] T069 [P] [US3] Test de rechazo de state ausente o alterado en `api/internal/transport/http/handlers/oauth_callback_test.go`
- [ ] T070 [P] [US3] Test de creacion de cuenta solo-OAuth en `api/internal/transport/http/handlers/oauth_callback_test.go`: el usuario MUST quedar con `password_hash` NULL

### Implementation for User Story 3

- [ ] T071 [P] [US3] Escribir consultas en `api/internal/adapter/postgres/queries/identities.sql`: upsert por `(provider, provider_user_id)`, listar por usuario
- [ ] T072 [P] [US3] Escribir `api/internal/adapter/oauth/signature.go` con la verificacion de firma por proveedor segun la tabla de `contracts/openapi.yaml.md`
- [ ] T073 [P] [US3] Escribir `api/internal/adapter/oauth/apple.go` con la verificacion JWT ES256 de Apple (validar `iss`, `aud`, `exp`, y la firma de la cadena de confianza de Apple)
- [ ] T074 [US3] Escribir los seis proveedores en `api/internal/adapter/oauth/` siguiendo el mismo contrato: google, github, gitlab, microsoft, discord, apple
- [ ] T075 [US3] Escribir `api/internal/adapter/oauth/state.go`: emision y verificacion del `state` anti-CSRF, de un solo uso y con caducidad
- [ ] T076 [US3] Escribir `api/internal/domain/oauthservice.go`: flujo authorize, intercambio de codigo, resolucion del perfil y vinculacion de identidad
- [ ] T077 [US3] Implementar `api/internal/transport/http/handlers/oauth.go` con providers, authorize y callback
- [ ] T078 [US3] Poblar la tabla `oauth_providers` con una migracion de datos de configuracion, para que la ausencia de un proveedor sea detectable

**Checkpoint**: Las tres primeras historias funcionan de forma independiente

---

## Phase 6: User Story 4 - Notificaciones en tiempo real (Priority: P4)

**Goal**: El cliente recibe notificaciones por un canal nuevo con id estable, aviso de degradacion
y consulta de backlog sin ventana ciega.

**Independent Test**: Conectar el canal autenticado, recibir una notificacion, forzar una
degradacion y comprobar que llega el mensaje `degraded` con `fallbackAvailable: true`.

### Tests for User Story 4

- [ ] T079 [P] [US4] Test de rechazo sin credenciales en `api/internal/transport/http/handlers/realtime_test.go`: el MUST ser 401 **antes** de abrir la conexion
- [ ] T080 [P] [US4] Test de entrega sin consultar en `api/internal/transport/http/handlers/realtime_test.go`: el evento MUST llegar push, sin que el cliente pregunte
- [ ] T081 [US4] Test de reconexion sin ventana ciega en `api/internal/transport/http/handlers/realtime_test.go`: tras reconectar usando el **id estable**, el cliente MUST recibir lo ocurrido durante el corte sin perder ni duplicar
- [ ] T082 [P] [US4] Test de aviso de degradacion en `api/internal/transport/http/handlers/realtime_test.go`: al superar el limite MUST llegar `type: "degraded"` con `fallbackAvailable: true` y codigo de cierre explicito
- [ ] T083 [P] [US4] Test de limites en `api/internal/transport/http/handlers/realtime_test.go`: 5 conexiones por usuario y 500 totales; 64 KB por mensaje
- [ ] T084 [P] [US4] Test del endpoint de backlog en `api/internal/transport/http/handlers/realtime_backlog_test.go`

### Implementation for User Story 4

- [ ] T085 [P] [US4] Escribir `api/internal/transport/http/realtime.go`: hub de conexiones con registro, limites y cierre ordenado
- [ ] T086 [US4] Implementar la negociacion WebSocket con `gorilla/websocket` y el heartbeat cada 20 s, cerrando la conexion tras 2 heartbeats perdidos
- [ ] T087 [US4] Implementar el handler del stream en `api/internal/transport/http/handlers/realtime.go`: autenticacion previa, mensajes `notification` / `degraded` / `heartbeat` / `error`, con `id` uuid estable y `timestamp` RFC3339 del servidor
- [ ] T088 [US4] Implementar `GET /api/v1/realtime/health` y `GET /api/v1/realtime/backlog?since=` en el mismo handler
- [ ] T089 [US4] Conectar el hub en `api/internal/transport/http/realtime.go` con la escritura en las tablas de `api/internal/adapter/postgres/queries/`: un evento MUST llegar a la conexion viva Y quedar disponible en el backlog
- [ ] T090 [US4] Decidir y documentar en `api/README.md` si la tabla `realtime_subscriptions` del data-model es redundante; si el canal se valida contra `sessions` directamente, eliminarla del esquema

**Checkpoint**: Las cuatro historias funcionan de forma independiente

---

## Phase 7: User Story 5 - Diagnostico de fallos (Priority: P5)

**Goal**: Cualquier peticion fallida se localiza en menos de 2 minutos siguiendo su correlation ID.

**Independent Test**: Provocar un fallo, tomar el correlation ID de la respuesta y llegar al
registro correspondiente en menos de 2 minutos.

### Tests for User Story 5

- [ ] T091 [P] [US5] Test de propagacion del correlation ID en `api/internal/transport/http/middleware/correlation_test.go`: un ID entrante MUST aparecer en los logs y en la cabecera de respuesta
- [ ] T092 [P] [US5] Test de generacion cuando no hay ID entrante en `api/internal/transport/http/middleware/correlation_test.go`
- [ ] T093 [P] [US5] Test de metricas por ruta en `api/internal/transport/http/middleware/metrics_test.go`: tras N peticiones MUST existir una serie con el codigo de estado y la latencia observada
- [ ] T094 [P] [US5] Test de auditoria de acciones en `api/internal/transport/http/handlers/activity_log_test.go`: el 100% de las acciones sobre datos propios MUST quedar registradas (SC-010)
- [ ] T095 [P] [US5] Test de consulta de bitacora en `api/internal/transport/http/handlers/activity_log_test.go`: por usuario y rango temporal, con paginacion
- [ ] T096 [US5] Test de inmutabilidad en `api/internal/transport/http/handlers/activity_log_test.go`: **no MUST existir ninguna ruta ni metodo de modificacion o borrado de la bitacora**; la ausencia es lo que hace verificable FR-035
- [ ] T097 [P] [US5] Test de cifrado en reposo en `api/internal/transport/http/handlers/encrypted_material_test.go`: el valor almacenado MUST NOT ser el legible
- [ ] T098 [P] [US5] Test de rotacion de clave en `api/internal/transport/http/handlers/encrypted_material_test.go`: rotar la clave MUST NOT requerir reescribir los datos existentes
- [ ] T099 [P] [US5] Test de retencion en `api/internal/transport/http/handlers/activity_log_test.go`: la agregacion automatica a 12 meses MUST ocurrir; la **accion del operador** de borrar MUST seguir prohibida (FR-035b)

### Implementation for User Story 5

- [ ] T100 [P] [US5] Escribir consultas en `api/internal/adapter/postgres/queries/security_events.sql` y `.../activity_log.sql`: insertar y consultar por usuario e intervalo con paginacion
- [ ] T101 [P] [US5] Escribir consultas en `api/internal/adapter/postgres/queries/encrypted_material.sql`: insertar con `key_version`, leer, listar material de una clave
- [ ] T102 [US5] Escribir `api/internal/domain/cipher.go` con AES-256-GCM: cifrar, descifrar y rotar de clave usando la columna `key_version`
- [ ] T103 [US5] Escribir `api/internal/domain/audit.go` que registra la accion sobre datos del propio usuario en `activity_log`
- [ ] T104 [US5] Instrumentar el registro de auditoria en `api/internal/transport/http/handlers/users.go` y `.../auth.go` (SC-010: el 100% de las acciones auditadas)
- [ ] T105 [US5] Implementar `api/internal/transport/http/handlers/activity_log.go`: consulta por usuario e intervalo con paginacion. **Sin handler de escritura ni de borrado**
- [ ] T106 [US5] Implementar `api/internal/transport/http/handlers/security_events.go` para la consulta de eventos de seguridad
- [ ] T107 [US5] Implementar la tarea de agregacion de retencion de 12 meses en `api/internal/adapter/postgres/maintenance.go`; ejecutarla desde una invocacion separada, no desde el arranque
- [ ] T108 [US5] Conectar las trazas OTel de `api/internal/observability/tracing.go` a las peticiones salientes de proveedor externo de `api/internal/adapter/oauth/`

**Checkpoint**: Las cinco historias funcionan de forma independiente

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias

- [ ] T109 [P] Escribir `api/README.md`: arranque, migraciones, variables de entorno y el procedimiento de medicion de SC-001, SC-002 y SC-006. **Solo debe describir lo que existe y esta testeado** (principio IV)
- [ ] T110 [P] Escribir un `runbook` de operacion en `api/docs/runbook.md`: diagnostico por correlation ID, que es exactamente el flujo de SC-005
- [ ] T111 [P] Configurar la exportacion de metricas y trazas de `api/internal/observability/` para Prometheus, Loki y Jaeger segun la seccion Observability de la constitution
- [ ] T112 Ejecutar la medicion de SC-006 con la carga de trabajo de plan.md: perfil 80% lecturas / 15% escrituras / 5% auth, 20 usuarios concurrentes, 15 minutos, sobre la **imagen de produccion**. Registrar p50/p95/p99 en `specs/001-main-go-migration/benchmarks.md`
- [ ] T113 Verificar la cobertura de los paquetes bajo `api/internal/` con `make test`: los paquetes modificados MUST alcanzar al menos el 70%. Por debajo, el merge queda bloqueado (principio IV)
- [ ] T114 Ejecutar la validacion completa de `quickstart.md` de punta a punta en la maquina objetivo
- [ ] T115 [P] Ejecutar un escaneo de secretos sobre `.` (raiz del repositorio) y `api/` para confirmar SC-009
- [ ] T116 Corregir las afirmaciones falsas del README raiz del legacy: endpoints Products y Orders que no existen, el directorio `specs/` ausente, `npm run test:load` y `npm run queue:dashboard` inexistentes
- [ ] T117 Eliminar de `docs/` los documentos que describen una arquitectura que ya no se va a construir, o marcarlos como historicos; la constitution los declara no vinculantes hasta revalidarse
- [ ] T118 Revisar la configuracion de Redis: `--maxmemory-policy noeviction` es obligatorio. `allkeys-lru` fue exactamente el defecto del legacy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias - puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup - **BLOQUEA todas las historias**
- **User Stories (Phase 3-7)**: Todas dependen de Foundational
  - Una vez completada Foundational, las historias pueden empezar en paralelo
  - US1 es el camino critico porque su medicion de memoria condiciona el resto
- **Polish (Final Phase)**: Depende de las historias deseadas completas

### User Story Dependencies

- **User Story 1 (P1)**: Puede empezar tras Foundational. Sin dependencias de otras historias
- **User Story 2 (P2)**: Puede empezar tras Foundational. Usa `users` y `sessions` de Foundational, pero es testeable de forma independiente
- **User Story 3 (P3)**: Puede empezar tras Foundational. Usa `identities` de Foundational y la sesion de US2
- **User Story 4 (P4)**: Puede empezar tras Foundational. Depende de `sessions` para validar el canal
- **User Story 5 (P5)**: Puede empezar tras Foundational. Usa `activity_log` y `security_events` de Foundational

### Within Each User Story

- Los tests MUST escribirse y FALLAR antes de la implementacion (principio IV)
- Modelos antes que servicios
- Servicios antes que endpoints
- Implementacion del nucleo antes que integracion
- Historia completa antes de pasar a la siguiente prioridad

### Critical Path

```
T001 -> T002 -> T003 -> T010..T022 (migraciones) -> T023..T039 (foundational)
     -> US1 completo (incluye T048: MEDICION)
     -> US2 -> US3 -> US4 -> US5 -> Polish
```

La medicion T048 esta en el camino critico a proposito: si el consumo real supera el presupuesto,
eso invalida la premise de la migracion y hay que saberlo antes de construir las cuatro historias
restantes, no despues.

### Parallel Opportunities

- Todas las tareas de Setup marcadas [P] pueden ejecutarse en paralelo
- Todas las tareas de migracion T011..T020 pueden ejecutarse en paralelo (mismo archivo, un solo
  redshift; agrupar por dialecto) - **revisar este punto si las tareas se separan por archivo**
- Todas las tareas de Foundational marcadas [P] pueden ejecutarse en paralelo
- Una vez completada Foundational, las historias pueden trabajarse en paralelo por personas distintas
- Todos los tests de una historia marcados [P] pueden ejecutarse en paralelo

---

## Parallel Example: User Story 1

```bash
# Lanzar los tres tests de US1 juntos:
Task: "Test de arranque en api/cmd/server/main_test.go"
Task: "Test del endpoint de salud en api/internal/transport/http/handlers/health_test.go"
Task: "Test del contrato de metricas en api/internal/transport/http/handlers/metrics_test.go"

# Lanzar los adaptadores juntos (archivos distintos):
Task: "Escribir api/internal/adapter/postgres/postgres.go"
Task: "Escribir api/internal/adapter/redis/redis.go"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRITICO - bloquea todas las historias)
3. Completar Phase 3: User Story 1
4. **PARAR y VALIDAR**: medir SC-001 y SC-002 de forma independiente
5. Si los presupuestos se cumplen, seguir. Si no, parar aqui y reevaluar

### Incremental Delivery

1. Completar Setup + Foundational -> base lista
2. Anadir US1 -> medir -> es el MVP y **la validacion de la premise de la migracion**
3. Anadir US2 -> probar de forma independiente -> datos sobreviven a un reinicio
4. Anadir US3 -> probar de forma independiente
5. Anadir US4 -> probar de forma independiente
6. Anadir US5 -> probar de forma independiente
7. Cada historia aporta valor sin romper las anteriores

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational
2. Una vez completada Foundational:
   - Desarrollador A: User Story 1
   - Desarrollador B: User Story 2
   - Desarrollador C: User Story 3
3. Las historias se completan e integran de forma independiente

**Nota para un equipo de una sola persona**: ejecutar en orden de prioridad. Las historias son
independientes por diseno precisamente para permitir esto.

---

## Notes

- [P] = archivos distintos, sin dependencias
- [Story] etiqueta cada tarea con su historia para trazabilidad
- Cada historia de usuario debe poder completarse y probarse de forma independiente
- Verificar que los tests fallan antes de implementar
- Commit tras cada tarea o grupo logico
- Parar en cualquier checkpoint para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos de archivo, dependencias entre historias que rompan la independencia
- T048 y T112 exigen **numeros medidos**. Un presupuesto declarado sin medir es exactamente el
  patron de "afirmaciones sin respaldo" que el principio IV prohibe
