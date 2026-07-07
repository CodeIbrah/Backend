# ATRIBUCIONES — Backend Template

> **Proyecto:** Backend Template  
> **Versión:** 1.0.0  
> **Última actualización:** Junio 2026

---

## Índice

- [Introducción](#introducción)
- [Atribuciones de Código](#atribuciones-de-código)
- [Frameworks y Librerías](#frameworks-y-librerías)
- [Inspiración de Diseño Arquitectónico](#inspiración-de-diseño-arquitectónico)
- [Iconos e Imagotipos](#iconos-e-imagotipos)
- [Documentación Técnica](#documentación-técnica)
- [Plantillas y Boletines de Seguridad](#plantillas-y-boletines-de-seguridad)
- [Herramientas de Desarrollo](#herramientas-de-desarrollo)
- [Infraestructura y DevOps](#infraestructura-y-devops)
- [Bases de Datos y Almacenamiento](#bases-de-datos-y-almacenamiento)
- [Servicios Externos y APIs](#servicios-externos-y-apis)
- [Modelos de Lenguaje y AI](#modelos-de-lenguaje-y-ai)
- [Metodologías y Patrones de Diseño](#metodologías-y-patrones-de-diseño)
- [Libros y Publicaciones de Referencia](#libros-y-publicaciones-de-referencia)
- [Contribuciones de la Comunidad](#contribuciones-de-la-comunidad)
- [Agradecimientos Personales](#agradecimientos-personales)
- [Marcas Registradas](#marcas-registradas)
- [Licencias de Atribución](#licencias-de-atribución)

---

## Introducción

Backend Template utiliza y se inspira en numerosos proyectos de código abierto, frameworks, librerías, herramientas y obras intelectuales. Este documento reconoce y agradece el trabajo de todos los creadores y mantenedores cuyo esfuerzo ha contribuido directa o indirectamente a este proyecto.

Creemos firmemente en el poder del software libre y de código abierto, y nos comprometemos a dar el crédito adecuado a cada proyecto que hace posible Backend Template.

---

## Atribuciones de Código

### Fragmentos de Código Adaptados

Algunos fragmentos de código en Backend Template están basados o adaptados de los siguientes proyectos y recursos:

| Fragmento | Proyecto Original | Autor(es) | Licencia | Archivo(s) en Backend Template |
|---|---|---|---|---|
| Estrategia JWT Passport | NestJS Passport Auth | NestJS Core Team | MIT | `main/src/auth/strategies/jwt.strategy.ts` |
| Rate Limiter configuration | NestJS Throttler Module | NestJS Core Team | MIT | `main/src/config/throttler.config.ts` |
| Prisma singleton pattern | Prisma Docs Examples | Prisma Team | Apache-2.0 | `packages/shared-prisma/src/index.ts` |
| Winston logger setup | Winston + nest-winston | Winston Team | MIT | `packages/shared-logger/src/index.ts` |
| OpenTelemetry instrumentación | OpenTelemetry Docs | OpenTelemetry Authors | Apache-2.0 | `packages/shared-telemetry/src/index.ts` |
| BullMQ worker pattern | BullMQ Docs Examples | Taskforce.sh | MIT | `microservices/payment-service/src/workers/` |
| Health check endpoints | NestJS Terminus | NestJS Core Team | MIT | `main/src/modules/health/` |
| WebSocket gateway pattern | NestJS WebSockets | NestJS Core Team | MIT | `main/src/websocket/` |
| CSRF protection setup | csurf (Express) | Express Team | MIT | `main/src/common/middleware/` |
| Cipher AES-256-GCM | Node.js Crypto Docs | Node.js Foundation | MIT | `main/src/cipher/` |

### Patrones de Diseño Reutilizados

Los siguientes patrones de diseño fueron adoptados siguiendo las recomendaciones de sus creadores originales:

| Patrón | Fuente de Referencia | Autor(es) | Aplicación en el Proyecto |
|---|---|---|---|
| Repository Pattern | NestJS Docs / Martin Fowler | Martin Fowler, NestJS Team | `main/src/prisma/` |
| Dependency Injection | NestJS Core / Angular | Misko Hevery, NestJS Team | Toda la aplicación |
| Strategy Pattern (Auth) | NestJS Passport | NestJS Core Team | `main/src/auth/strategies/` |
| Interceptor Pattern | NestJS / AOP | NestJS Core Team | `main/src/logging/`, `main/src/telemetry/` |
| Observer Pattern | RxJS | Microsoft, RxJS Team | Eventos y streams en toda la app |
| Module Pattern | NestJS Modular Architecture | NestJS Core Team | Organización completa del código |
| Factory Pattern | TypeScript / NestJS | Varios | `main/src/modules/` factories |
| Singleton Pattern | GoF / Prisma Recommended | Gang of Four, Prisma Team | Conexiones a base de datos |
| Middleware Pattern | Express.js | Express Team, TJ Holowaychuk | Microservicios Express |
| Queue/Worker Pattern | BullMQ | Taskforce.sh | Procesamiento asíncrono |

---

## Frameworks y Librerías

### Frameworks Principales

| Proyecto | Creador(es) | Licencia | Rol en el Proyecto | URL |
|---|---|---|---|---|
| **NestJS** | Kamil Mysliwiec | MIT | Framework principal del monolito | https://nestjs.com |
| **Express.js** | TJ Holowaychuk, StrongLoop | MIT | Framework HTTP de microservicios | https://expressjs.com |
| **TypeScript** | Anders Hejlsberg, Microsoft | Apache-2.0 | Lenguaje de programación principal | https://typescriptlang.org |
| **Node.js** | Ryan Dahl, OpenJS Foundation | MIT | Runtime de JavaScript | https://nodejs.org |
| **Socket.IO** | Guillermo Rauch | MIT | Comunicación en tiempo real | https://socket.io |
| **RxJS** | Ben Lesh, Google | Apache-2.0 | Programación reactiva | https://rxjs.dev |

### ORM y Acceso a Datos

| Proyecto | Creador(es) | Licencia | Rol en el Proyecto |
|---|---|---|---|
| **Prisma** | Johannes Schickling, Prisma Data | Apache-2.0 | ORM principal y migraciones |
| **ioredis** | Zihua Li, contributors | MIT | Cliente Redis |
| **pg** | Brian M. Carlson, contributors | MIT | Driver PostgreSQL nativo |

### Autenticación y Seguridad

| Proyecto | Creador(es) | Licencia | Rol en el Proyecto |
|---|---|---|---|
| **Passport.js** | Jared Hanson | MIT | Middleware de autenticación |
| **Helmet** | Adam Baldwin, Evan Hahn | MIT | Seguridad HTTP |
| **bcrypt** | Niels Provos, David Mazieres | MIT | Hash de contraseñas |
| **jsonwebtoken** | Auth0, contributors | MIT | Tokens JWT |
| **csurf** | Express Team, Jonathan Ong | MIT | Protección CSRF |

### Logging y Telemetría

| Proyecto | Creador(es) | Licencia | Rol en el Proyecto |
|---|---|---|---|
| **Winston** | Charlie Robbins, contributors | MIT | Logger principal |
| **OpenTelemetry** | Google, Microsoft, lightstep | Apache-2.0 | Trazabilidad y métricas |
| **Prometheus** | SoundCloud, CNCF | Apache-2.0 | Sistema de métricas |
| **nest-winston** | gremo, contributors | MIT | Integración Winston + NestJS |

### Validación

| Proyecto | Creador(es) | Licencia | Rol en el Proyecto |
|---|---|---|---|
| **class-validator** | Typestack, contributors | MIT | Validación con decoradores |
| **class-transformer** | Typestack, contributors | MIT | Transformación de objetos |
| **joi** | hapi.js, contributors | BSD-3-Clause | Validación de esquemas |
| **Zod** | Colin McDonnell | MIT | Validación con inferencia de tipos |

---

## Inspiración de Diseño Arquitectónico

La arquitectura de Backend Template está inspirada en las siguientes obras y conceptos:

### Clean Architecture (Arquitectura Limpia)

**Robert C. Martin (Uncle Bob)** — La separación en capas (dominio, aplicación, infraestructura) y la regla de dependencia (las dependencias apuntan hacia adentro) son conceptos fundamentales tomados de *Clean Architecture: A Craftsman's Guide to Software Structure and Design*.

### Domain-Driven Design (DDD)

**Eric Evans** — El concepto de agregados, entidades, value objects y bounded contexts ha influido en la organización de los módulos de dominio en el monolito principal.

### Command Query Responsibility Segregation (CQRS)

**Greg Young** — La separación de operaciones de lectura y escritura inspiró la estructura de ciertos módulos que manejan alta concurrencia.

### Event Sourcing

**Martin Fowler, Greg Young** — El rastro de auditoría y el sistema de activity logs se basan en los principios de event sourcing.

### Twelve-Factor App

**Heroku, Adam Wiggins** — Las prácticas de configuración externa, backing services, procesos stateless y logging como flujo de eventos siguen la metodología twelve-factor.

### Microservices Patterns

**Chris Richardson** — Los patrones de API Gateway, service discovery, saga pattern y database per service han informado la arquitectura de microservicios.

### Enterprise Integration Patterns

**Gregor Hohpe, Bobby Woolf** — Los patrones de mensajería y encaminamiento han influido en el diseño del sistema de colas BullMQ.

---

## Iconos e Imagotipos

### Iconos de Tecnologías

Los iconos de las tecnologías mostradas en la documentación pertenecen a sus respectivos creadores:

| Icono | Propietario | Marca Registrada |
|---|---|---|
| Node.js | OpenJS Foundation | Sí |
| TypeScript | Microsoft Corporation | Sí |
| NestJS | Kamil Mysliwiec | Marca de palabra |
| Prisma | Prisma Data, Inc. | Sí |
| PostgreSQL | PostgreSQL Community | Sí |
| Redis | Redis Ltd. | Sí |
| Docker | Docker, Inc. | Sí |
| Prometheus | CNCF | Sí |
| Grafana | Grafana Labs | Sí |
| OpenTelemetry | CNCF | Sí |
| Stripe | Stripe, Inc. | Sí |
| Twilio | Twilio, Inc. | Sí |
| OpenAI | OpenAI, Inc. | Sí |
| Anthropic | Anthropic, Inc. | Sí |
| BullMQ | Taskforce.sh | No |
| Turborepo | Vercel, Inc. | Sí |

### Logos del Proyecto

El logo y la identidad visual de Backend Template son propiedad de CodeIbra. No se permite su uso sin autorización expresa.

---

## Documentación Técnica

### Inspiración para Documentación

| Proyecto | Elemento Adoptado |
|---|---|
| **NestJS Docs** | Estilo de documentación de módulos |
| **Stripe Docs** | Formato de ejemplos de API |
| **Prisma Docs** | Estructura de guías de base de datos |
| **PostgreSQL Manual** | Referencia de funciones SQL |
| **OpenTelemetry Docs** | Formato de especificación de observabilidad |

### Guías y Tutoriales

Parte del contenido de la documentación se basa en guías y tutoriales de:

- **NestJS Official Documentation** — Documentación del framework.
- **Prisma Official Documentation** — Guías de ORM y migraciones.
- **TypeScript Handbook** — Guía de tipos avanzados.
- **OpenTelemetry Documentation** — Guías de instrumentación.
- **BullMQ Documentation** — Guías de colas y workers.
- **Stripe API Reference** — Documentación de integración de pagos.
- **Node.js Best Practices** — Yoni Goldberg, contribuidores.

---

## Plantillas y Boletines de Seguridad

### CODE_OF_CONDUCT.md

Adaptado del **Contributor Covenant**, versión 2.0, creado por Coraline Ada Ehmke. Licencia: CC BY 4.0.

### CONTRIBUTING.md

Basado en las guías de contribución de **Facebook's Draft**, adaptadas para el flujo de trabajo GitHub Flow.

### GitHub Issue Templates

Inspiradas en las plantillas de **Angular** y **Microsoft TypeScript** repositorios.

---

## Herramientas de Desarrollo

### Editores y Entornos

| Herramienta | Creador(es) | Licencia |
|---|---|---|
| Visual Studio Code | Microsoft | MIT |
| Cursor | Cursor, Inc. | Propietaria |
| Windsurf | Codeium | Propietaria |
| Augment Code | Augment | Propietaria |

### Extensiones de VS Code Recomendadas

- ESLint — Microsoft
- Prettier — Prettier Team
- Prisma — Prisma Data
- NestJS Snippets — Varios
- Thunder Client — Ranga Vadhineni
- Docker — Microsoft
- GitLens — GitKraken
- Markdown All in One — Yu Zhang

### Asistentes de IA

| Herramienta | Creador(es) | Rol en el Desarrollo |
|---|---|---|
| OpenCode (Codex CLI) | OpenAI / LazyCodex | Asistente de desarrollo |
| GitHub Copilot | GitHub / OpenAI | Autocompletado de código |
| Cursor AI | Cursor, Inc. | Edición asistida por IA |
| Claude (Anthropic) | Anthropic, Inc. | Análisis y refactorización |

---

## Infraestructura y DevOps

### Plataformas y Servicios

| Servicio | Proveedor | Uso en el Proyecto |
|---|---|---|
| **GitHub** | Microsoft Corp. | Control de versiones, issues, CI/CD |
| **GitHub Actions** | Microsoft Corp. | Pipelines de integración continua |
| **Docker** | Docker, Inc. | Contenedorización |
| **Docker Hub** | Docker, Inc. | Registro de imágenes |
| **npm** | npm, Inc. / GitHub | Registro de paquetes |

---

## Bases de Datos y Almacenamiento

### Software de Base de Datos

| Producto | Creador(es) | Licencia |
|---|---|---|
| **PostgreSQL** | PostgreSQL Global Development Group | PostgreSQL License |
| **Redis** | Redis Ltd. | BSD-3-Clause |

### Clientes y Herramientas

| Herramienta | Creador(es) | Licencia |
|---|---|---|
| **pg (node-postgres)** | Brian M. Carlson | MIT |
| **ioredis** | Zihua Li | MIT |
| **Prisma Studio** | Prisma Data | Apache-2.0 |
| **pgAdmin** | pgAdmin Development Team | PostgreSQL License |

---

## Servicios Externos y APIs

| Servicio | Proveedor | Propósito | Documentación |
|---|---|---|---|
| **Stripe** | Stripe, Inc. | Procesamiento de pagos | https://stripe.com/docs |
| **Twilio** | Twilio, Inc. | Envío de SMS | https://twilio.com/docs |
| **OpenAI API** | OpenAI, Inc. | Análisis de errores con IA | https://platform.openai.com |
| **Anthropic API** | Anthropic, Inc. | Diagnóstico de causa raíz | https://docs.anthropic.com |
| **NPM Registry** | GitHub / npm | Distribución de paquetes | https://npmjs.com |
| **Docker Hub** | Docker, Inc. | Registro de imágenes Docker | https://hub.docker.com |

---

## Modelos de Lenguaje y AI

### Modelos Utilizados

| Modelo | Proveedor | Versión | Uso |
|---|---|---|---|
| **GPT-4o** | OpenAI | Última | Análisis de errores principal |
| **GPT-4 Turbo** | OpenAI | Última | Sugerencias de fix |
| **Claude 3.5 Sonnet** | Anthropic | Última | Diagnóstico de causa raíz |
| **Claude 3 Opus** | Anthropic | Última | Análisis de seguridad |

### Frameworks de AI

| Proyecto | Creador(es) | Licencia |
|---|---|---|
| **OpenAI Node SDK** | OpenAI | Apache-2.0 |
| **Anthropic Node SDK** | Anthropic | MIT |

### Modelos de Embeddings

| Modelo | Proveedor | Propósito |
|---|---|---|
| **text-embedding-3-small** | OpenAI | Búsqueda semántica en Knowledge Base |
| **text-embedding-3-large** | OpenAI | Análisis de patrones de error |

---

## Metodologías y Patrones de Diseño

### Metodologías de Desarrollo

| Metodología | Fuente |
|---|---|
| **GitHub Flow** | GitHub, Inc. |
| **Semantic Versioning (SemVer)** | Tom Preston-Werner |
| **Conventional Commits** | Angular Team, Convco |
| **Test-Driven Development (TDD)** | Kent Beck |
| **Behavior-Driven Development (BDD)** | Dan North |
| **Continuous Integration / Continuous Delivery** | Martin Fowler, Jez Humble |

### Patrones de Microservicios

| Patrón | Fuente | Referencia |
|---|---|---|
| API Gateway | Chris Richardson | microservices.io |
| Saga Pattern | Hector Garcia-Molina, Kenneth Salem | ACM |
| CQRS | Greg Young, Martin Fowler | martinfowler.com |
| Event-Driven Architecture | Varios | — |
| Strangler Fig Pattern | Martin Fowler | martinfowler.com |
| Bulkhead Pattern | Michael Nygard | *Release It!* |
| Circuit Breaker | Michael Nygard | *Release It!* |

---

## Libros y Publicaciones de Referencia

| Título | Autor(es) | Año | Concepto Aportado |
|---|---|---|---|
| *Clean Architecture* | Robert C. Martin | 2017 | Arquitectura en capas |
| *Domain-Driven Design* | Eric Evans | 2003 | Agregados, bounded contexts |
| *Implementing Domain-Driven Design* | Vaughn Vernon | 2013 | DDD práctico |
| *Patterns of Enterprise Application Architecture* | Martin Fowler | 2002 | Repository, Unit of Work |
| *Enterprise Integration Patterns* | Gregor Hohpe, Bobby Woolf | 2003 | Mensajería y rutas |
| *Release It!* | Michael Nygard | 2007 | Circuit Breaker, Bulkhead |
| *Building Microservices* | Sam Newman | 2015 | Diseño de microservicios |
| *Monolith to Microservices* | Sam Newman | 2019 | Estrategias de migración |
| *Designing Data-Intensive Applications* | Martin Kleppmann | 2017 | Almacenamiento y streaming |
| *The Twelve-Factor App* | Adam Wiggins | 2011 | Cloud-native best practices |
| *Node.js Design Patterns* | Mario Casciaro | 2020 | Patrones Node.js avanzados |
| *Programming TypeScript* | Boris Cherny | 2019 | Tipos avanzados TypeScript |
| *Clean Code* | Robert C. Martin | 2008 | Calidad de código |
| *Refactoring* | Martin Fowler | 2019 | Mejora de código existente |
| *Test-Driven Development* | Kent Beck | 2002 | Desarrollo guiado por pruebas |

---

## Contribuciones de la Comunidad

### Issues y Pull Requests

Agradecemos a todos los que han contribuido con issues, bug reports, feature requests y pull requests.

*(Lista de contribuyentes se mantendrá actualizada a medida que el proyecto reciba contribuciones)*

### Stack Overflow y Foros

Parte del conocimiento aplicado en este proyecto proviene de respuestas y discusiones en:

- **Stack Overflow** — stackoverflow.com
- **Reddit (r/node, r/typescript, r/NestJS)** — reddit.com
- **GitHub Discussions** — github.com
- **NestJS Discord** — discord.gg/nestjs
- **Prisma Slack** — prisma.io/slack

---

## Agradecimientos Personales

El equipo de Backend Template extiende un agradecimiento especial a:

- **Kamil Mysliwiec** — Por crear NestJS, el corazón de este proyecto.
- **Johannes Schickling** — Por Prisma, que hace que trabajar con bases de datos sea un placer.
- **TJ Holowaychuk** — Por Express.js y su legado en el ecosistema Node.js.
- **Anders Hejlsberg** — Por TypeScript, que ha transformado el desarrollo backend.
- **Charlie Robbins** — Por Winston, el logger que mantiene visibles nuestros sistemas.
- **Ryan Dahl** — Por Node.js, que inició esta revolución.
- **La comunidad open source global** — Por construir el ecosistema que hace proyectos como este posibles.

---

## Marcas Registradas

Todas las marcas registradas, nombres de productos, logos y marcas de servicio mencionados en este documento son propiedad de sus respectivos dueños.

| Marca | Propietario |
|---|---|
| NestJS | Kamil Mysliwiec |
| Node.js | OpenJS Foundation |
| TypeScript | Microsoft Corporation |
| Express | StrongLoop / IBM |
| Prisma | Prisma Data, Inc. |
| PostgreSQL | PostgreSQL Community |
| Redis | Redis Ltd. |
| Docker | Docker, Inc. |
| Stripe | Stripe, Inc. |
| Twilio | Twilio, Inc. |
| OpenAI | OpenAI, Inc. |
| Anthropic | Anthropic, Inc. |
| GitHub | Microsoft Corporation |
| Visual Studio Code | Microsoft Corporation |
| BullMQ | Taskforce.sh |
| Grafana | Grafana Labs |
| Prometheus | CNCF |

El uso de estas marcas es puramente referencial y no implica afiliación, respaldo o patrocinio por parte de sus propietarios.

---

## Licencias de Atribución

### Creative Commons Attribution 4.0 (CC BY 4.0)

El archivo `CODE_OF_CONDUCT.md` está adaptado del **Contributor Covenant** versión 2.0, licenciado bajo CC BY 4.0.

### MIT License

La mayoría de las adaptaciones de fragmentos de código de proyectos open source se realizan bajo los términos de la licencia MIT, que permite la reutilización con atribución.

### Apache License 2.0

Las adaptaciones de código de proyectos bajo Apache 2.0 (Prisma, OpenTelemetry, etc.) se realizan de acuerdo con los términos de dicha licencia.

---

*Este documento se actualiza periódicamente. Si consideras que tu trabajo no ha sido debidamente atribuido, por favor abre un issue en el repositorio del proyecto.*
