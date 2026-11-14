# Implementation Plan: Migración de la API principal a Go

**Branch**: `001-main-go-migration` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-main-go-migration/spec.md`

## Summary

Reescribe el servicio `main` (NestJS, 5.071 LOC, 33 dependencias) como un único proceso
Go que separe la lógica de negocio del framework. El objetivo primario no es la portabilidad
sino **cumplir el presupuesto de recursos**: el proceso API debe quedar por debajo de 150 MB
en reposo y el stack de desarrollo completo por debajo del 40% de la RAM del equipo objetivo
(SC-002, SC-001).

El enfoque es de reescritura, no de traducción línea a línea. El sistema legacy arrastra
deuda que no tiene sentido migrar: cuatro microservicios sin ningún llamador, un Dockerfile
que nunca compiló, y requisitos (pagos, gRPC) que carecen de consumidor. Se conservan solo
los módulos con comportamiento verificable —autenticación, usuarios, auditoría, bitácora de
actividad y cifrado— y el tiempo real se rediseña sobre un canal nuevo.

Decisión de arquitectura dominante: **la lógica de negocio no depende de HTTP ni de la base
de datos**. Los casos de uso son funciones puras de dominio; los handlers HTTP y las
consultas generadas son adaptadores intercambiables. Esto es lo que permite que `sqlc` y el
router se puedan cambiar sin tocar el dominio, y es lo que hace los tests e2e rápidos.

## Technical Context

**Language/Version**: Go 1.27.1 (verificado instalado: `go version go1.27.1 windows/amd64`)

**Primary Dependencies**:

| Dependencia                             | Versión | Papel                                        |
| --------------------------------------- | ------- | -------------------------------------------- |
| `chi`                                   | v5      | Router HTTP sobre `net/http` de la stdlib    |
| `golang-jwt/jwt/v5`                     | v5      | Emisión y verificación de tokens             |
| `golang.org/x/crypto`                   | latest  | bcrypt, HKDF para rotación de claves         |
| `google/uuid`                           | v1      | Identificadores colisión-imposibles          |
| `sqlc`                                  | v1.x    | Generación de acceso a datos tipado          |
| `jackc/pgx`                             | v5      | Driver PostgreSQL + pool                     |
| `rs/zerolog`                            | v1      | Logging JSON estructurado                    |
| `prometheus/client_golang`              | v1      | Métricas                                     |
| `go.opentelemetry.io/otel` + `otelhttp` | v1      | Trazas, sobre todo salientes                 |
| `nhooyr.io/websocket` o stdlib          | —       | Canal en tiempo real (ver research.md)       |
| `golang.org/x/oauth2`                   | latest  | Authorization Code flow de los 6 proveedores |
| `github.com/testcontainers/postgresql`  | v4      | **Solo en tests**, no en producción          |

**Storage**: PostgreSQL 16. Sin SQLite (prohibido por constitution). Redis únicamente como
caché derivada, con `maxmemory-policy noeviction` obligatorio.

**Testing**: `go test` nativo. Tests e2e contra un Postgres real lanzado por testcontainers.
Sin ginkgo/gomega: la stdlib cubre lo necesario y cada dependencia es memoria.

**Target Platform**: Linux (producción, imagen de contenedor) + Windows/macOS/Linux en
desarrollo. El hardware objetivo es un i3-1005G1 de 2 núcleos con 8 GB de RAM.

**Project Type**: web-service, un solo proceso API.

**Performance Goals**:

- p95 < 200 ms en la ruta de mayor tráfico (SC-006), medido con la carga de referencia
  definida abajo.
- < 150 MB RSS en reposo (SC-002).
- Arranque en < 3 s sin estado previo.

**Constraints**: presupuesto de 2 GB para el stack local completo; sin Docker en el entorno
de desarrollo (no está instalado y la constitution exige que el entorno local no imponga
contenedores); cero secretos en el repositorio; 70% de cobertura mínima en paquetes
modificados.

**Scale/Scope**: ~5 historias de usuario, 37+3 requisitos funcionales, 10 criterios de éxito.
Volumen esperado bajo (equipo de 1 persona, un producto sin usuarios reales todavía), pero
el diseño debe tolerar 10x sin cambio estructural.

### Carga de trabajo de referencia (SC-006)

Definida aquí porque el spec la difirió explícitamente a la fase de plan. Sin ella SC-006 no
es verificable.

| Parámetro             | Valor                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| Perfil                | Mixto: 80% lecturas de perfil y recurso, 15% escrituras, 5% autenticación |
| Usuarios concurrentes | 20                                                                        |
| Duración              | 15 minutos sostenidos                                                     |
| Rutas ejercitadas     | Las de lectura intensively, `GET /users/me` como ruta de mayor tráfico    |
| Herramienta           | `k6` o `hey` sobre la imagen de producción, no sobre `go run`             |
| Entorno               | La del hardware objetivo, sin otros procesos pesados                      |
| Métrica               | Latencia de respuesta del servidor, p95                                   |

Criterio de aceptación: p95 ≤ 200 ms en el 95% de las muestras. La verificación de firma de
Apple queda **excluida de esta medición** por ser una operación de terceros cuyo latencia no
controlamos; se mide aparte y se reporta, pero no condiciona SC-006.

## Constitution Check

**Gate: PASS.** Detalle por principio:

| Principio                        | Estado | Cómo se cumple                                                                                                                                                                                              |
| -------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Resource Budget               | PASS   | Los presupuestos son números verificables (SC-001, SC-002). Un solo proceso. La carga de referencia hace medible SC-006.                                                                                    |
| II. One Process Before Many      | PASS   | **1 proceso API + Postgres + Redis.** Sin fronteras nuevas. Los 4 microservicios se retiran: el número de contenedores baja de 3 a 2.                                                                       |
| III. Persistence Is Not Optional | PASS   | Postgres es la única fuente de verdad; cero `Map` en código nuevo; UUID v4 para identificadores (cumple "collision-resistant", a diferencia del concatenado legacy); migraciones versionadas y reversibles. |
| IV. Test-First                   | PASS   | TDD obligatorio, test e2e por endpoint, `go test ./...` es gate de commit, 70% de cobertura mínima.                                                                                                         |
| V. Observability Built In        | PASS   | zerolog JSON + correlation ID; métricas Prometheus por ruta; trazas OTel en llamadas salientes; health check que reporta estado real de Postgres y Redis.                                                   |

**Technology Constraints**: Go ✓ · PostgreSQL 16 ✓ · query layer tipado con `sqlc` ✓ ·
JWT con librería mantenida ✓ · bcrypt ✓ · Redis con `noeviction` ✓ · Prometheus/OTel ✓ ·
imagen multi-etapa que se verifica en CI ✓ · sin dependencias deprecadas ✓.

**Security Requirements**: secretos por variable de entorno ✓ · auth en toda ruta no pública
✓ · validación en el borde (chi middleware) ✓ · cabeceras de seguridad y límite de tamaño
de petición por defecto ✓ · verificación de firma en callbacks de terceros (FR-008a) ✓ ·
el PAT de GitHub expuesto se trata como comprometido (ver Security Notes).

**Puertas de calidad**: `go build ./...` ✓ · `go test ./...` ✓ · `go vet ./...` ✓ · imagen
construye en CI ✓ · escaneo de secretos ✓ · sin fronteras nuevas ✓.

**Complexity Tracking**: vacío. No hay violaciones que justificar.

## Project Structure

### Documentation (esta funcionalidad)

```text
specs/001-main-go-migration/
├── spec.md              # Especificación (completa)
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas de Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── openapi.yaml     # Contrato HTTP completo
│   └── realtime.md      # Canal en tiempo real
├── checklists/
│   └── requirements.md  # 16/16
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (raíz del repositorio)

El código nuevo vive en `api/` para no colisionar con el `main/` legacy, que se retira al
terminar la migración. Esto permite que ambos coexistan durante el desarrollo.

```text
api/
├── cmd/
│   └── server/
│       └── main.go              # Composición: config, deps, arranque
├── internal/
│   ├── config/                  # Config desde env, validación al arrancar
│   ├── domain/                  # LÓGICA PURA. Sin HTTP, sin SQL, sin imports de infra.
│   │   ├── user.go              #   Entidades y reglas de usuario
│   │   ├── auth.go              #   Reglas de autenticación y sesión
│   │   ├── audit.go             #   Eventos de seguridad
│   │   ├── activity.go          #   Bitácora de actividad
│   │   ├── crypto.go            #   Cifrado y rotación
│   │   └── ports.go             #   Interfaces que el dominio define (DIP)
│   ├── transport/
│   │   └── http/
│   │       ├── router.go
│   │       ├── middleware/      # correlation ID, auth, validación, métricas, errores
│   │       ├── handlers/        # auth, users, activity, audit
│   │       └── realtime.go      # Canal en tiempo real
│   ├── adapter/
│   │   ├── postgres/            # Implementaciones de ports.* sobre sqlc
│   │   │   ├── queries/         #   Archivos .sql fuente de sqlc
│   │   │   └── migrations/      #   SQL versionado, reversible
│   │   ├── redis/               # Caché derivada
│   │   └── oauth/               # Los 6 proveedores
│   ├── observability/           # Logger, métricas, trazas, health
│   └── testutil/                # Helpers compartidos de test
├── sqlc.yaml
├── Dockerfile
├── Makefile
└── go.mod
```

**Structure Decision**: Monorepo con `api/` como nuevo servicio. La separación
`domain` / `transport` / `adapter` es la que sostiene el principio II: permite testar el
dominio sin base de datos ni red, y mantiene el número de procesos en uno porque los tres
capas se compilan en el **mismo binario**. No es arquitectura modular aplicada por gusto:
es lo que hace que los tests e2e no necesiten levantar infraestructura para la lógica de
negocio.

`internal/` (no `pkg/`) porque nada fuera de `api/` debe importar estos paquetes: previene
que el código muerto del legacy reaparezca como dependencia.

## Cross-Cutting Concerns

| Concern                  | Ubicación                                                                | Nota                                                          |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Logging + correlation ID | `observability/`, inyectado en `transport/http/middleware`               | Un solo punto de creación del ID, propagado a todas las capas |
| Autenticación            | `transport/http/middleware` resuelve identidad → `domain/auth.go` valida | La lógica de sesión vive en el dominio, no en el middleware   |
| Migraciones              | `adapter/postgres/migrations/`                                           | SQL puro, versionado, cada una con su reverso                 |
| Config                   | `internal/config`                                                        | Se valida al arrancar; un valor inválido aborta el arranque   |
| Feature flags            | No en Phase 1                                                            | Se añaden si aparece la necesidad, no antes                   |

## Security Notes

- El PAT de GitHub `ghp_...` está en texto plano en `~/.config/opencode/service.json`.
  **No** está en este repositorio, pero está comprometido: la constitution exige tratarlo
  como tal y rotarlo. Pendiente de acción del usuario, fuera del alcance de esta
  implementación.
- La rotación de clave de cifrado (FR-037) se diseña con `HKDF`: la clave maestra produce
  subclaves por versión, de modo que rotar es derivar una nueva subclave y **no reescribir
  datos**. El campo `keyVersion` de `material cifrado` hace posible descifrar histórico.

## Risks

| Riesgo                                              | Impacto | Mitigación                                                                                                  |
| --------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| Verificación de firma de Apple (ES256)              | Alto    | Es la integración más compleja; aísla en su propia tarea con su test. Si falla, no bloquea historias 2 y 4. |
| SQLite → Postgres en desarrollo sin Docker          | Medio   | Postgres 16 nativo en Windows. Requiere instalación; se documenta en quickstart.                            |
| `sqlc` exige escribir SQL a mano para cada consulta | Medio   | Aceptado: es explícito y verificable, a diferencia del ORM. El coste es frontend, no riesgo.                |
| Migración de datos                                  | Nulo    | El spec confirma entorno limpio. No hay migración de datos.                                                 |

## Deferred Items

- **Perfil de carga**: definido arriba; requiere `k6`/`hey` instalado para medir.
- **Servidor gRPC**: sin consumidores. Fuera de alcance (spec, Deferred Items).
- **4 microservicios**: destino sin decidir; requieren especificación propia.
- **Rotación del PAT**: depende de acción del usuario.

---

**Complexity Tracking**: sin violaciones.
