# EQUIPO Y GOVERNANZA — Backend Template

> **Proyecto:** Backend Template  
> **Versión:** 1.0.0  
> **Licencia:** Apache 2.0  
> **Última actualización:** Junio 2026

---

## Índice

- [Estructura del Equipo](#estructura-del-equipo)
- [Modelo de Gobernanza](#modelo-de-gobernanza)
- [Roles y Responsabilidades](#roles-y-responsabilidades)
- [Equipo Principal](#equipo-principal)
- [Mantenedores por Módulo](#mantenedores-por-módulo)
- [Áreas Funcionales](#áreas-funcionales)
- [Proceso de Toma de Decisiones](#proceso-de-toma-de-decisiones)
- [Proceso de Contribución](#proceso-de-contribución)
- [Escalación y Resolución de Conflictos](#escalación-y-resolución-de-conflictos)
- [Ciclo de Release](#ciclo-de-release)
- [Canales de Comunicación](#canales-de-comunicación)
- [Código de Conducta](#código-de-conducta)
- [Seguridad y Reporte de Vulnerabilidades](#seguridad-y-reporte-de-vulnerabilidades)
- [Guías para Nuevos Miembros](#guías-para-nuevos-miembros)
- [Métricas de Salud del Proyecto](#métricas-de-salud-del-proyecto)
- [Roadmap y Visión](#roadmap-y-visión)

---

## Estructura del Equipo

Backend Template opera bajo un modelo de gobernanza **benevolente de dictador** (BDFL — Benevolent Dictator for Life) para la fase inicial, con transición planificada hacia un modelo **meritocrático** a medida que el proyecto madure y crezca la comunidad de contribuyentes.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTRUCTURA DEL EQUIPO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    BENEVOLENT DICTATOR                    │   │
│  │                    CodeIbra (BDFL)                        │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 CORE TEAM (TBD)                           │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────┐  │   │
│  │  │ Monolith   │ │ Microsvcs  │ │ Data       │ │ DevOps│  │   │
│  │  │ Maintainer │ │ Maintainer │ │ Maintainer │ │Eng    │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └───────┘  │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               CONTRIBUTORS COMMUNITY                      │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────┐  │   │
│  │  │ Auth       │ │ Payments   │ │ AI         │ │ Docs  │  │   │
│  │  │ Module     │ │ Module     │ │ Agents     │ │       │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └───────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Organigrama Funcional

```
CodeIbra (BDFL)
│
├── Core Team (Fase 2)
│   ├── Maintainer de Monolito (NestJS)
│   ├── Maintainer de Microservicios (Express)
│   ├── Maintainer de Base de Datos (Prisma/PostgreSQL)
│   ├── Maintainer de Observabilidad (OpenTelemetry/Prometheus)
│   ├── Maintainer de AI/ML (Agentes de IA)
│   └── Maintainer de DevOps (Docker/CI/CD)
│
├── Áreas de Contribución
│   ├── Módulo de Autenticación
│   ├── Módulo de Usuarios
│   ├── Módulo de Pagos
│   ├── Módulo de Notificaciones
│   ├── Módulo de Facturación
│   ├── Módulo de Correo Electrónico
│   ├── Módulo de SMS
│   ├── Paquetes Compartidos
│   └── Documentación y Traducciones
│
└── Comunidad
    ├── Contribuidores Ocasionales
    ├── Reportadores de Bugs
    └── Usuarios
```

---

## Modelo de Gobernanza

### Fase 1: Fundación (Actual)

- **BDFL:** CodeIbra tiene la última palabra en todas las decisiones.
- **Toma de decisiones:** Unilateral pero informada por la comunidad.
- **Objetivo:** Establecer la base sólida del proyecto, definir la arquitectura, y crear los procesos de contribución.

### Fase 2: Crecimiento (Q3-Q4 2026)

- **Formación del Core Team:** Incorporación de 3 a 5 mantenedores principales.
- **Toma de decisiones:** Consenso dentro del Core Team, con veto del BDFL.
- **Objetivo:** Escalar el desarrollo, distribuir la carga de mantenimiento.

### Fase 3: Madurez (2027+)

- **Gobernanza meritocrática:** Los mantenedores son elegidos por su contribución.
- **Toma de decisiones:** Consenso del Core Team, con votación para decisiones mayores.
- **TSC (Technical Steering Committee):** Comité técnico de dirección electo.
- **Objetivo:** Sostenibilidad a largo plazo del proyecto.

---

## Roles y Responsabilidades

### Benevolent Dictator for Life (BDFL)

| Aspecto | Detalle |
|---|---|
| Titular | CodeIbra |
| Período | Indefinido (fase inicial) |
| Responsabilidades | Visión del proyecto, decisiones finales, arquitectura global |
| Veto | Sí, sobre cualquier decisión |
| Sucesión | Designación de sucesor al abandonar el rol |

**Responsabilidades del BDFL:**

1. Definir y comunicar la visión a largo plazo del proyecto.
2. Tomar decisiones finales cuando no se alcanza consenso.
3. Aprobar o rechazar propuestas arquitectónicas mayores.
4. Designar y remover mantenedores del Core Team.
5. Representar al proyecto ante la comunidad y entidades externas.
6. Gestionar la marca, releases oficiales y roadmap.
7. Velar por la calidad del código y la adherencia a los estándares.

### Core Team

| Aspecto | Detalle |
|---|---|
| Tamaño | 3 a 5 miembros (planificado) |
| Designación | Nombrados por el BDFL |
| Período | Revisión anual |
| Responsabilidades | Mantenimiento de módulos, revisión de PRs, guía técnica |

**Responsabilidades de los miembros del Core Team:**

1. Revisar Pull Requests de sus áreas de responsabilidad.
2. Mantener la calidad del código, las pruebas y la documentación.
3. Participar en las decisiones técnicas del proyecto.
4. Mentorizar a nuevos contribuyentes.
5. Responder issues y preguntas de la comunidad.
6. Participar en las reuniones periódicas del Core Team.
7. Reportar al BDFL sobre el estado de sus áreas.

### Committers

| Aspecto | Detalle |
|---|---|
| Designación | Propuestos por Core Team, aprobados por BDFL |
| Privilegios | Acceso de escritura al repositorio |
| Responsabilidades | Contribuciones regulares, revisión de PRs menores |

### Contributors

| Aspecto | Detalle |
|---|---|
| Designación | Cualquier persona con un PR fusionado |
| Privilegios | Acceso de lectura, etiqueta de Contributor |
| Responsabilidades | Contribuciones de código, documentación, reportes |

---

## Equipo Principal

### Fundador y BDFL

```
Nombre:           CodeIbra
Rol:              Creador y Benevolent Dictator
Áreas:            Arquitectura general, sistema multi-agente IA, monolith core
Desde:            Septiembre 2025 (inicio del proyecto)
Email:            —
GitHub:           —
```

### Core Team Actual

El proyecto está en **Fase 1 (Fundación)**. El Core Team está en proceso de formación y se anunciará oficialmente cuando esté conformado.

### Posiciones Abiertas

Buscamos mantenedores para las siguientes áreas:

| Área | Conocimientos Requeridos | Dedicación Esperada |
|---|---|---|
| Monolito NestJS | NestJS, TypeScript, Prisma | 5-10 h/semana |
| Microservicios | Express, TypeScript, RabbitMQ/BullMQ | 5-10 h/semana |
| Base de Datos | PostgreSQL, Prisma, SQL | 3-5 h/semana |
| Observabilidad | Prometheus, Grafana, OpenTelemetry, Loki | 3-5 h/semana |
| DevOps | Docker, GitHub Actions, CI/CD | 3-5 h/semana |
| AI/ML | OpenAI API, Claude API, embeddings | 3-5 h/semana |

---

## Mantenedores por Módulo

### Monolito Principal (`main/`)

| Módulo | Mantenedor(es) | Estado |
|---|---|---|
| Auth (autenticación) | CodeIbra | ✅ Mantenido |
| Users (usuarios) | CodeIbra | ✅ Mantenido |
| Audit (auditoría) | CodeIbra | ✅ Mantenido |
| Cache (caché) | CodeIbra | ✅ Mantenido |
| Cipher (cifrado) | CodeIbra | ✅ Mantenido |
| Config (configuración) | CodeIbra | ✅ Mantenido |
| Logging (logs) | CodeIbra | ✅ Mantenido |
| Prisma (base de datos) | CodeIbra | ✅ Mantenido |
| Reports (reportes) | CodeIbra | ✅ Mantenido |
| Social Auth (autenticación social) | CodeIbra | ✅ Mantenido |
| Telemetry (telemetría) | CodeIbra | ✅ Mantenido |
| WebSocket (tiempo real) | CodeIbra | ✅ Mantenido |

### Microservicios (`microservices/`)

| Servicio | Mantenedor(es) | Estado |
|---|---|---|
| Auth Service | CodeIbra | ✅ Mantenido |
| Users Service | CodeIbra | ✅ Mantenido |
| Payment Service | CodeIbra | ✅ Mantenido |
| Notifications Service | CodeIbra | ✅ Mantenido |
| Invoice Service | CodeIbra | ✅ Mantenido |
| Mail Service | CodeIbra | ✅ Mantenido |
| SMS Service | CodeIbra | ✅ Mantenido |

### Paquetes Compartidos (`packages/`)

| Paquete | Mantenedor(es) | Estado |
|---|---|---|
| shared-ai | CodeIbra | ✅ Mantenido |
| shared-analytics | CodeIbra | ✅ Mantenido |
| shared-logger | CodeIbra | ✅ Mantenido |
| shared-prisma | CodeIbra | ✅ Mantenido |
| shared-reports | CodeIbra | ✅ Mantenido |
| shared-telemetry | CodeIbra | ✅ Mantenido |
| shared-types | CodeIbra | ✅ Mantenido |
| shared-utils | CodeIbra | ✅ Mantenido |

---

## Áreas Funcionales

### Arquitectura y Diseño

| Área | Responsable(s) |
|---|---|
| Arquitectura híbrida (monolito + microservicios) | CodeIbra |
| Diseño de API RESTful | CodeIbra |
| Diseño de esquema de base de datos | CodeIbra |
| Sistema de colas BullMQ | CodeIbra |
| Integración de pagos (Stripe) | CodeIbra |
| Integración de comunicaciones (Twilio, Mail) | CodeIbra |

### Calidad y Testing

| Área | Responsable(s) |
|---|---|
| Pruebas unitarias | CodeIbra |
| Pruebas de integración | CodeIbra |
| Pruebas end-to-end | CodeIbra |
| Integración continua (CI) | CodeIbra |
| Análisis estático de código | CodeIbra |

### Seguridad

| Área | Responsable(s) |
|---|---|
| Autenticación JWT | CodeIbra |
| Autorización RBAC | CodeIbra |
| Protección CSRF | CodeIbra |
| Helmet y seguridad HTTP | CodeIbra |
| Cifrado AES-256-GCM | CodeIbra |
| Rate limiting | CodeIbra |

### Observabilidad

| Área | Responsable(s) |
|---|---|
| Logging (Winston + Loki) | CodeIbra |
| Métricas (Prometheus) | CodeIbra |
| Trazabilidad (OpenTelemetry + Jaeger) | CodeIbra |
| Dashboards (Grafana) | CodeIbra |
| Alertas | CodeIbra |

### AI y Automatización

| Área | Responsable(s) |
|---|---|
| AI Error Doctor | CodeIbra |
| Error Analysis Agent | CodeIbra |
| Fix Suggestion Agent | CodeIbra |
| Runtime Monitoring Agent | CodeIbra |
| Incident Response Agent | CodeIbra |
| Auto Recovery System | CodeIbra |
| Knowledge Base | CodeIbra |

---

## Proceso de Toma de Decisiones

### Escala de Decisiones

| Tipo | Descripción | Proceso |
|---|---|---|
| **Estratégica** | Roadmap, licencia, governance | BDFL decide, Core Team consultado |
| **Arquitectónica** | Nuevos módulos, cambios mayores | Propuesta formal → Discusión Core Team → BDFL aprueba |
| **Táctica** | APIs, dependencias, features | Issue/Discusión → Consenso → PR |
| **Operativa** | Bugs, refactors, optimizaciones | PR directo con revisión de 1 mantenedor |

### Proceso de Propuesta de Cambio Mayor

1. **Crear un RFC** (Request for Comments) en GitHub Discussions.
2. **Período de discusión:** 7 días mínimos para comentarios de la comunidad.
3. **Revisión del Core Team:** Evaluación técnica y de impacto.
4. **Decisión del BDFL:** Aprobación, rechazo o solicitud de modificaciones.
5. **Implementación:** PR de referencia vinculado al RFC.
6. **Documentación:** Actualización de documentos afectados.

### Votación

Cuando se requiera votación en el Core Team:

- **Quórum:** 60% de miembros del Core Team.
- **Mayoría:** 60% de votos a favor para aprobar.
- **Veto:** El BDFL puede vetar cualquier decisión.
- **Empate:** El BDFL tiene voto de calidad.

---

## Proceso de Contribución

### Flujo de Trabajo

1. **Fork** del repositorio.
2. **Branch** desde `main` con nombre descriptivo (`fix/`, `feat/`, `docs/`, `refactor/`).
3. **Commits** siguiendo Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
4. **Pull Request** a `main`.
5. **CI/CD:** Todos los checks deben pasar (lint, typecheck, test, build).
6. **Revisión:** Al menos un mantenedor revisa el PR.
7. **Merge:** Squash merge con mensaje convencional.

### Estándares de Código

| Estándar | Herramienta | Configuración |
|---|---|---|
| Formateo | Prettier | `.prettierrc` |
| Linting | ESLint | `.eslintrc.js` |
| Tipado | TypeScript strict | `tsconfig.base.json` |
| Testing | Jest | `jest.config.js` |
| Commits | Commitlint | `.commitlintrc` |
| Pre-commit | Husky + lint-staged | `.husky/` |

### Política de Ramas

- `main` — Rama principal, estable y desplegable.
- `develop` — Rama de integración (futuro).
- `feat/*` — Nuevas características.
- `fix/*` — Correcciones de bugs.
- `docs/*` — Cambios en documentación.
- `refactor/*` — Refactorización de código.
- `chore/*` — Tareas de mantenimiento.

---

## Escalación y Resolución de Conflictos

### Escalación de Issues Técnicos

```
Issue Técnico
│
├── 1. Discusión en el PR/Issue
│       │
│       ├── ¿Resuelto? → Avanzar
│       │
│       └── ¿No resuelto?
│               │
│               ▼
├── 2. Discusión en Core Team Meeting
│       │
│       ├── ¿Resuelto? → Avanzar
│       │
│       └── ¿No resuelto?
│               │
│               ▼
└── 3. Decisión del BDFL (final)
```

### Escalación de Conflictos Interpersonales

```
Conflicto
│
├── 1. Resolución directa entre las partes
│       │
│       ├── ¿Resuelto? → Avanzar
│       │
│       └── ¿No resuelto?
│               │
│               ▼
├── 2. Mediación de un miembro del Core Team
│       │
│       ├── ¿Resuelto? → Avanzar
│       │
│       └── ¿No resuelto?
│               │
│               ▼
├── 3. Mediación del BDFL
│       │
│       ├── ¿Resuelto? → Avanzar
│       │
│       └── ¿No resuelto?
│               │
│               ▼
└── 4. Decisión final del BDFL (puede incluir expulsión)
```

### Principios de Resolución

1. **Respeto mutuo:** Todas las discusiones deben mantener un tono profesional.
2. **Basarse en datos:** Las decisiones técnicas deben apoyarse en evidencia.
3. **Enfoque en el proyecto:** El bien del proyecto prevalece sobre preferencias personales.
4. **Transparencia:** Las decisiones mayores se comunican públicamente.
5. **Proceso documentado:** Todas las decisiones quedan registradas.

---

## Ciclo de Release

### Versionado Semántico

El proyecto sigue **Semantic Versioning 2.0.0**:

- **MAJOR (X.0.0):** Cambios incompatibles en APIs.
- **MINOR (0.X.0):** Nuevas funcionalidades compatibles hacia atrás.
- **PATCH (0.0.X):** Correcciones de bugs compatibles hacia atrás.

### Ciclo de Release

```
Semana 1-3: Desarrollo
    │
    ▼
Semana 4: Freeze de features
    │
    ▼
Semana 5: Testing y correcciones
    │
    ▼
Semana 6: Release candidate
    │
    ▼
Semana 7: Release final
```

### Proceso de Release

1. **Freeze:** No se aceptan nuevas features, solo correcciones.
2. **RC (Release Candidate):** Tag `vX.Y.Z-rc.N`.
3. **Testing:** Pruebas exhaustivas (unitarias, integración, e2e, manuales).
4. **Changelog:** Actualización de cambios.
5. **Tag:** `git tag vX.Y.Z`.
6. **Release:** Publicación en GitHub Releases.
7. **NPM:** Publicación de paquetes si aplica.
8. **Docker:** Publicación de imágenes en Docker Hub.
9. **Anuncio:** Comunicación en canales oficiales.

### Política de Backport

- Solo se backportan correcciones de seguridad críticas.
- Se mantienen las últimas 2 versiones menores.
- Backports se etiquetan con `backport/vX.Y`.

---

## Canales de Comunicación

### Canales Oficiales

| Canal | Propósito | Enlace |
|---|---|---|
| GitHub Issues | Bugs, features, tareas | GitHub |
| GitHub Discussions | RFCs, preguntas, debates | GitHub |
| Pull Requests | Revisiones de código | GitHub |
| GitHub Projects | Roadmap y sprints | GitHub |

### Canales Planeados (Fase 2)

| Canal | Propósito |
|---|---|
| Discord / Slack | Comunicación en tiempo real |
| Mailing List | Anuncios de releases |
| Blog Técnico | Artículos y tutoriales |
| YouTube | Demos y tutoriales en video |

### Reuniones

| Reunión | Frecuencia | Participantes |
|---|---|---|
| Core Team Sync | Quincenal | Core Team |
| Community Call | Mensual | Todos |
| Sprint Planning | Quincenal | Core Team |
| Retrospectiva | Mensual | Core Team |

---

## Código de Conducta

Backend Template sigue un **Código de Conducta** basado en el **Contributor Covenant** v2.0.

### Principios Fundamentales

1. **Inclusividad:** Todos son bienvenidos independientemente de su origen.
2. **Respeto:** Trata a los demás con dignidad y cortesía.
3. **Colaboración:** Trabajamos juntos hacia objetivos comunes.
4. **Transparencia:** Las decisiones y procesos son abiertos.
5. **Excelencia técnica:** Buscamos la mejor calidad posible.

### Proceso de Denuncia

1. Reportar comportamiento inapropiado al equipo mantenedor.
2. El equipo investiga de forma confidencial.
3. Se toman medidas correctivas según la gravedad.
4. Las decisiones son comunicadas a las partes involucradas.

Para más detalles, consulta el archivo [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md).

---

## Seguridad y Reporte de Vulnerabilidades

### Política de Seguridad

- **Reportes responsables:** Reporta vulnerabilidades de forma privada.
- **Tiempo de respuesta:** 48 horas para acuse de recibo.
- **Fix:** Se prioriza sobre cualquier otra tarea.
- **Divulgación:** Se realiza después de aplicar el fix.

### Cómo Reportar

Para reportar una vulnerabilidad de seguridad:

1. **No** abras un issue público.
2. Envía un correo electrónico al equipo mantenedor.
3. Incluye: descripción, pasos para reproducir, impacto potencial.
4. Recibirás acuse de recibo en 48 horas.

### Proceso de Respuesta a Incidentes

```
1. Reporte recibido
    │
    ▼
2. Triage (48h): Confirmar vulnerabilidad, evaluar severidad
    │
    ▼
3. Parche (depende de severidad):
       CRÍTICA: 24h
       ALTA: 72h
       MEDIA: 7 días
       BAJA: 30 días
    │
    ▼
4. Release de seguridad: vX.Y.Z+1
    │
    ▼
5. Divulgación pública: advisory en GitHub
```

---

## Guías para Nuevos Miembros

### Primeros Pasos

1. **Lee la documentación:** README.md, CONTRIBUTING.md, AGENTS.md.
2. **Configura el entorno:** Sigue la guía de Quick Start.
3. **Explora el código:** Familiarízate con la estructura del proyecto.
4. **Busca issues etiquetados** `good-first-issue` o `help-wanted`.
5. **Únete a las discusiones** en GitHub Discussions.
6. **Haz tu primera contribución:** Empieza con algo pequeño (docs, tests, bugs).

### Checklist para Nuevos Contribuidores

- [ ] Leer el README.md completo.
- [ ] Leer CONTRIBUTING.md y CODE_OF_CONDUCT.md.
- [ ] Configurar el entorno de desarrollo local.
- [ ] Ejecutar las pruebas para verificar la configuración.
- [ ] Introducirse en GitHub Discussions.
- [ ] Elegir un issue `good-first-issue`.
- [ ] Hacer fork y crear una rama.
- [ ] Implementar el cambio.
- [ ] Ejecutar lint, typecheck, tests.
- [ ] Crear un Pull Request.
- [ ] Responder a los comentarios de la revisión.

### Criterios para Convertirse en Committer

- 5+ PRs fusionados de calidad.
- Participación activa en code reviews.
- Conocimiento profundo de al menos un módulo.
- Comportamiento alineado con el código de conducta.

### Criterios para Convertirse en Miembro del Core Team

- 20+ PRs fusionados.
- Historial consistente de contribuciones (6+ meses).
- Liderazgo técnico demostrado en al menos un área.
- Mentoría activa de nuevos contribuyentes.
- Aprobación del BDFL y consenso del Core Team.

---

## Métricas de Salud del Proyecto

### Indicadores Clave

| Métrica | Objetivo | Frecuencia |
|---|---|---|
| Cobertura de tests | > 80% | Por release |
| Tiempo de respuesta a issues | < 48h | Semanal |
| Tiempo de merge de PRs | < 7 días | Semanal |
| Commits por semana | > 20 | Semanal |
| Contribuidores activos | > 5 | Mensual |
| Time to First Response (issues) | < 24h | Diario |
| CI pass rate | > 95% | Diario |
| Dependencias desactualizadas | < 5 | Mensual |

### Reportes de Salud

El proyecto genera reportes automáticos de salud usando:

- `ai-doctor-scan.js` — Escaneo automático de errores.
- `run-runtime-monitor.js` — Monitoreo de rendimiento.
- `run-diagnostics.js` — Diagnóstico del sistema.
- `reports/` — Reportes generados automáticamente.

---

## Roadmap y Visión

### Visión del Proyecto

> Convertir Backend Template en la plantilla de referencia para aplicaciones backend empresariales en Node.js, integrando de forma nativa observabilidad, inteligencia artificial, y automatización de operaciones.

### Roadmap 2026-2027

| Período | Hito | Estado |
|---|---|---|
| Q3 2025 | Inicio del proyecto | ✅ Completado |
| Q4 2025 | MVP del monolito NestJS | ✅ Completado |
| Q1 2026 | Sistema de autenticación completo | ✅ Completado |
| Q2 2026 | Microservicios y observabilidad | ✅ Completado |
| Q3 2026 | AI Error Doctor y multi-agente | 🚧 En progreso |
| Q4 2026 | Core Team formado | 📋 Planificado |
| Q1 2027 | Dashboard de administración | 📋 Planificado |
| Q2 2027 | Plugins y extensiones | 📋 Planificado |
| Q3 2027 | Versión 2.0 estable | 📋 Planificado |

### Objetivos Estratégicos

1. **Calidad:** Mantener cobertura de tests > 80%.
2. **Comunidad:** Alcanzar 50+ contribuidores en 2027.
3. **Adopción:** 1000+ estrellas en GitHub en 2027.
4. **Sostenibilidad:** Modelo de patrocinio que cubra costos de infraestructura.
5. **Innovación:** Integración continua de nuevas capacidades de IA.

---

*Este documento es un documento vivo y se actualiza periódicamente. Los cambios sustanciales en la gobernanza serán comunicados a la comunidad con antelación.*
