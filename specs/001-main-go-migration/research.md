# Research: Migración de la API principal a Go

**Feature**: 001-main-go-migration | **Date**: 2026-10-10 | **Plan**: [plan.md](./plan.md)

Este documento resuelve los NEEDS CLARIFICATION del Technical Context. Cada decisión
registra qué se eligió, por qué, y qué alternativas se descartaron —incluyendo el motivo
del descarte, no solo su nombre.

---

## Decisión 1: Capa de acceso a datos — `sqlc` sobre `ent`

**Decision**: `sqlc` con archivos `.sql` como fuente de verdad, generatesGo tipado.

**Rationale**:

- La constitution lo permite explícitamente ("`sqlc` or `ent`"), pero añade una condición que
  decide: _"No runtime ORM abstraction and no string-concatenated SQL"_. `sqlc` no tiene
  runtime de ORM — es generación de código. Cumple literalmente.
- Las consultas se escriben como SQL. Eso hace la revisión de código verifiable: se lee
  el SQL exacto que se ejecutará, sin capas que lo traduzcan. En una migración donde el
  riesgo es reescribir 5.071 líneas, la auditabilidad importa más que la comodidad.
- El legacy usa Prisma, que es precisamente un runtime ORM. Mudarse a `ent` cambiaría una
  abstracción por otra del mismo tipo; `sqlc` rompe con el patrón en lugar de trasladarlo.

**Alternatives consideradas**:

- **`ent`**: ORM generado desde un schema, al estilo Prisma. Descartado porque introduce un
  runtime de ORM, que la constitution prohíbe. Su ventaja —abstracción del schema— es
  exactamente lo que este proyecto quiere eliminar.
- **SQL puro con `database/sql`**: cumple la constitution, pero sin tipos. Cada fila es
  `map[string]interface{}`. Descartado: el tipado es la razón principal para no escribir SQL
  a mano.
- **Bun**: ORM ligero y rápido. Descartado: es un ORM en runtime, misma categoría que
  Prisma.
- **gorm**: ORM basado en reflection en runtime. Descartado por la misma razón, y peor: el tipado es aún
  menor.

**Consecuencia asumida**: hay que escribir el SQL a mano para cada consulta. Es trabajo de
frontend, no riesgo técnico. Se acepta.

---

## Decisión 2: Router HTTP — `chi` sobre `net/http` estándar

**Decision**: `chi` v5.

**Rationale**:

- `chi` es un router sobre `net/http`, no un framework. No impone un ciclo de vida de
  aplicación, no requiere contenedor de inyección de dependencias, no usa reflection.
- Es lo más cercano posible a la stdlib. La constitution dice "standard library logging";
  el mismo criterio aplica al router: lo que la stdlib hace bien, no lo reimplementamos.
- Soporta middleware por ruta, que es exactamente lo que necesitan la propagación del
  correlation ID, la autenticación y las métricas por ruta (Principio V).
- ~1 dependencia, cero dependencias transitivas.

**Alternatives consideradas**:

- **`gin`**: el más popular. Descartado: sus handlers dependen de un `gin.Context` propio,
  lo que arrastra la lógica de negocio hacia el framework. Rompe la separación
  domain/transport del plan.
- **`echo`**: middleware excelente, pero también atado a su `Context`.
- **`gorilla/mux`**: simple, pero el mantenimiento ha sido irregular frente a `chi`.
- **Sin router, solo `net/http`**: `ServeMux` de Go 1.22+ ya tiene soporte de métodos y
  patrones. Considerado seriamente. Descartado por una razón concreta: el soporte de
  grupos de middleware jerárquicos (`r.Group(...)`) es Manual y verboso, y el proyecto
  necesita auth+metricas+correlation en subárboles de rutas. `chi` da eso en una línea.

---

## Decisión 3: Canal de tiempo real — WebSocket con `gorilla/websocket`

**Decision**: `github.com/gorilla/websocket`.

**Rationale**:

- Verificado en el repositorio: **activo y mantenido**. El README declara explícitamente
  _"The package API is stable"_, la rama por defecto es `main` (no `master`), licencia
  BSD-2-Clause, y pasa la suite de tests Autobahn. Esto importa porque la constitution
  prohíbe dependencias con repositorio archivado o aviso de deprecación.
- Pasa el estándar Autobahn, que es la prueba objetiva de conformidad con RFC 6455. No es
  "funciona en mi caso".
- 24.9k estrellas, 3.6k forks: volumen de uso que reduce el riesgo de descubrir un problema
  en producción.

**Alternatives consideradas**:

- **`nhooyr.io/websocket`**: API más idiomática y soporte de `context.Context`. **Rechazada
  por una razón verificada**: el proyecto pasó a manos de Coder y se mudó a
  `github.com/coder/websocket` (nhooyr lo mantuvo de 2019 a 2024). Usar el import path
  antiguo significa depender de un repo que dejó de ser el canónico. Si se usa, sería
  `coder/websocket`.
- **`coder/websocket`**: técnicamente superior (zero dependencies, context nativo). No
  elegido por tener mucho menos historial de mantenimiento y menos ecosistema que gorilla. Reconsiderar
  si el throughput lo justifica.
- **Server-Sent Events**: más simple y suficiente para notificaciones unidireccionales.
  Descartado porque FR-019 exige reconexión automática con aviso, y SSE no tiene mecanismo de
  acknowledgment; SSE reconecta solo pero no permite al cliente informar su estado ni
  detectar degradación (FR-021) con la misma precisión.

**Nota de diseño**: el canal es **nuevo** (FR-022). No se implementa compatibilidad con el
protocolo socket.io anterior. El contrato queda en `contracts/realtime.md`.

---

## Decisión 4: Migración de Prisma → SQL

**Decision**: migraciones SQL versionadas en `adapter/postgres/migrations/`, aplicadas por
una herramienta y revertibles.

**Rationale**:

- La constitution exige: _"Every schema change MUST be a versioned migration"_ y
  _"Exactly one schema definition is authoritative per deployment target"_.
- El legacy tiene **tres schemas Prisma que no coinciden** (`main` con 8 modelos,
  `mail-service` con SQLite, `packages/shared-prisma` con 13). Un solo destino elimina esa
  ambigüedad.
- Migraciones reversibles: cada archivo tiene su `down`.

**Alternatives consideradas**:

- **Prisma migrate como herramienta temporal**: genera SQL desde el schema. Descartado: hay
  que rewriting en Prisma para después tirarlo, y deja una dependencia de Node en un
  proyecto Go.
- **Atlas/goose/tern**: funcional; la elección concreta se hace en tasks. La decisión aquí es
  que las migraciones son SQL escrito a mano, independientemente de la herramienta que las aplique.

---

## Decisión 5: Entorno de desarrollo sin Docker

**Decision**: PostgreSQL 16 y Redis nativos en Windows para desarrollo. Docker solo en CI.

**Rationale**:

- Verificado en la máquina: **`docker` no está instalado**, y el usuario reportó un BSOD al
  intentar levantar el stack de 14 contenedores.
- La constitution es explícita: el stack local MUST caber en 2 GB, y el spec establece que
  _"el entorno de desarrollo local no requiere contenedores y no debe imponerlos"_.
- Docker Desktop consume 2-3 GB por sí solo en Windows. Instalarlo para un stack de 2
  procesos es gastar el presupuesto completo en la herramienta.
- Postgres nativo en Windows ~500 MB frente a 3-4 GB del contenedor.

**Alternatives consideradas**:

- **Docker Desktop**: descartado por la restricción de memoria y por el historial de BSOD.
- **WSL2 + Postgres en Linux**: viable y más cercano a producción. Considerado como
  alternativa preferida si Postgres nativo en Windows da problemas. Más consumo de RAM.
- **Podman**: más ligero. Descartado: menos probado en Windows.

---

## Decisión 6: Observabilidad — `log/slog` de la stdlib en lugar de zerolog

**Decision**: `log/slog` con handler JSON de la stdlib. `zerolog` queda como alternativa si
el volumen de logs lo justifica.

**Rationale**:

- **Cambio respecto al plan inicial.** El plan listaba `zerolog`; la investigación lo
  revisó a favor de la stdlib.
- La constitution dice _"the API is written in Go. Static binary, standard library logging"_.
  La lectura literal favorece `slog`. Go 1.21+ lo incluye en la stdlib, con `slog.Handler`
  JSON integrado.
- Una dependencia menos en una caja de 2 núcleos donde cada MB cuenta.
- `slog` acepta el correlation ID vía `context.Context` con `slog.With()`, que es
  exactamente el modelo que necesita el Principio V.

**Alternatives consideradas**:

- **`zerolog`**: más rápido y con API más pleasant. Se mantiene documentado como el camino si
  el benchmark de logs muestra que `slog` es un cuello de botella. No se optimiza antes de
  medir (Principio I).

---

## Decisión 7: Hashing de contraseñas — `bcrypt` vía `golang.org/x/crypto`

**Decision**: bcrypt con factor de coste calibrado por medición en el hardware objetivo.

**Rationale**:

- La constitution lo nombra explícitamente ("bcrypt or argon2 with a current cost factor").
- bcrypt es el más predecible entre-go; argon2id es superior en resistencia a hardware
  dedicado pero su coste de memoria hay que calibrarlo con cuidado en una máquina de 8 GB.
- `x/crypto` es un módulo oficial de la comunidad Go, parte del `golang.org`.

**Pendiente**: el factor de coste exacto se fija midiendo en el i3 objetivo, nocopiando un
valor por defecto. Registrado en tasks.

---

## Decisión 8: Generador de identificadores — UUID v4 de la base de datos

**Decision**: `gen_random_uuid()` de PostgreSQL 16 (vía `pgcrypto`, nativo desde PG 13) o
`uuid-ossp`. Preferido: `gen_random_uuid()`.

**Rationale**:

- La constitution exige "collision-resistant" y prohíbe explícitamente el concatenado
  timestamp+random del legacy.
- Generar en el motor significa que el ID existe desde la propia fila: no hay ventana en la
  que la aplicación y la base discrepen.
- UUID v4 de Postgres está disponible sin extensión adicional desde PostgreSQL 13.

**Alternatives consideradas**:

- **UUID v7** (ordenable por tiempo): mejor localidad de índice, pero PG 16 no lo genera de
  forma nativa. Considerado si el volumen lo justifica; no ahora.
- **`google/uuid` en la aplicación**: válido, pero abre la ventana de discrepancia. Solo se
  usa si algo requiere generar IDs fuera de una sentencia SQL (p. ej. eventos antes de
  insertar).

---

## Resumen de dependencias

| Dependencia            | Versión | Verificación                               |
| ---------------------- | ------- | ------------------------------------------ |
| Go                     | 1.27.1  | `go version` ejecutado en la máquina       |
| `sqlc`                 | v1.x    | A instalar; no está en la máquina          |
| `go` stdlib `log/slog` | 1.27.1  | Incluida                                   |
| `gorilla/websocket`    | v1.5.x  | Repositorio activo, BSD-2-Clause, Autobahn |
| Docker                 | —       | **No instalado**; solo CI                  |

## Needs Clarification resueltos

Todos los marcadores NEEDS CLARIFICATION del plan están resueltos. No queda ninguno abierto.

## Nuevos pendientes para tasks

- Factor de coste de bcrypt, por medición.
- Herramienta de migraciones (goose vs tern vs Atlas).
- Instalación de PostgreSQL 16 nativo en Windows.
