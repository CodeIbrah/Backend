# LICENCIAS DE TERCEROS — Backend Template

> **Proyecto:** Backend Template  
> **Versión:** 1.0.0  
> **Licencia del Proyecto:** Apache 2.0  
> **Última actualización:** Junio 2026

---

Este documento lista todas las dependencias directas e indirectas utilizadas por el proyecto **Backend Template**, organizadas por categoría, junto con sus respectivas licencias de software. Se incluyen tanto dependencias de producción como de desarrollo.

El proyecto utiliza un monorepo gestionado con **Turborepo** y **NPM Workspaces**, que contiene los siguientes paquetes:

- `main/` — Aplicación monolítica NestJS
- `microservices/*/` — Siete microservicios independientes
- `packages/*/` — Ocho paquetes compartidos

A continuación se detallan las licencias de las dependencias agrupadas por categoría funcional.

---

## 1. Frameworks y Core

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `@nestjs/common` | ^10.3.0 | MIT | Decoradores, guards, interceptors, pipes de NestJS |
| `@nestjs/core` | ^10.3.0 | MIT | Núcleo del framework NestJS |
| `@nestjs/platform-express` | ^10.3.0 | MIT | Adaptador Express para NestJS |
| `@nestjs/config` | ^3.2.0 | MIT | Módulo de configuración de NestJS |
| `@nestjs/jwt` | ^10.2.0 | MIT | Módulo JWT para NestJS |
| `@nestjs/passport` | ^10.0.3 | MIT | Módulo Passport para NestJS |
| `@nestjs/swagger` | ^7.3.0 | MIT | Documentación OpenAPI/Swagger |
| `@nestjs/terminus` | ^10.2.0 | MIT | Health checks de NestJS |
| `@nestjs/throttler` | ^5.1.0 | MIT | Rate limiting para NestJS |
| `@nestjs/platform-socket.io` | ^11.1.23 | MIT | WebSockets con Socket.IO |
| `@nestjs/websockets` | ^11.1.23 | MIT | Módulo de WebSockets |
| `express` | ^4.18.2 | MIT | Framework web minimalista para Node.js |
| `express-rate-limit` | ^7.1.5 | MIT | Middleware de rate limiting |
| `reflect-metadata` | ^0.2.2 | Apache-2.0 | Polyfill para decorators ES7 |
| `rxjs` | ^7.8.1 | Apache-2.0 | Programación reactiva para JavaScript |
| `socket.io` | ^4.8.3 | MIT | Comunicación bidireccional en tiempo real |

### Licencias — Frameworks Core

#### MIT License (MIT)

Utilizada por: NestJS, Express, Socket.IO, Passport, entre otros.

Permisos: Uso comercial, modificación, distribución, uso privado. Limitaciones: Responsabilidad limitada, sin garantía. Condiciones: Inclusión del aviso de copyright y licencia.

#### Apache License 2.0 (Apache-2.0)

Utilizada por: reflect-metadata, rxjs.

Permisos: Uso comercial, modificación, distribución, patentes, uso privado. Limitaciones: Responsabilidad limitada, sin garantía. Condiciones: Inclusión del aviso de copyright, documentación de cambios.

---

## 2. Base de Datos y ORM

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `@prisma/client` | ^5.14.0 | Apache-2.0 | Cliente generado por Prisma ORM |
| `prisma` | ^5.14.0 | Apache-2.0 | CLI de Prisma ORM (dev) |
| `pg` | ^8.21.0 | MIT | Cliente PostgreSQL nativo |
| `ioredis` | ^5.4.0 | MIT | Cliente Redis avanzado para Node.js |

### Licencias — Base de Datos

#### Apache License 2.0 (Apache-2.0)

**Prisma ORM** — Copyright 2023 Prisma Data, Inc.

Prisma es un ORM de código abierto que revoluciona el acceso a bases de datos. Incluye generación de cliente tipado, migraciones, y un estudio visual. El proyecto usa tanto el cliente (`@prisma/client`) como la CLI (`prisma`) bajo Apache 2.0.

#### MIT License (MIT)

**ioredis** — Copyright 2023 Zihua Li and contributors.

**pg** — Copyright 2018 Brian M. Carlson and contributors.

---

## 3. Autenticación y Seguridad

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `passport` | ^0.7.0 | MIT | Middleware de autenticación |
| `passport-jwt` | ^4.0.1 | MIT | Estrategia JWT para Passport |
| `passport-local` | ^1.0.0 | MIT | Estrategia local (username/password) |
| `jsonwebtoken` | ^9.0.3 | MIT | Implementación de JWT |
| `bcrypt` | ^5.1.1 | MIT | Hash y comparación de contraseñas |
| `helmet` | ^7.1.0 | MIT | Seguridad HTTP (cabeceras) |
| `cors` | ^2.8.5 | MIT | Middleware CORS |
| `csurf` | ^1.11.0 | MIT | Protección CSRF |
| `compression` | ^1.8.1 | MIT | Compresión HTTP |
| `morgan` | ^1.10.0 | MIT | Logger de peticiones HTTP |

### Licencias — Autenticación y Seguridad

Todas las dependencias de seguridad utilizan la licencia **MIT**, que permite uso comercial, modificación y distribución sin restricciones significativas.

---

## 4. Logging y Observabilidad

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `winston` | ^3.13.0 | MIT | Logger multipropósito para Node.js |
| `winston-daily-rotate-file` | ^5.0.0 | MIT | Rotación diaria de archivos de log |
| `nest-winston` | ^1.9.4 | MIT | Módulo Winston para NestJS |
| `@opentelemetry/api` | ^1.9.0 | Apache-2.0 | API de OpenTelemetry |
| `@opentelemetry/sdk-node` | ^0.57.0 | Apache-2.0 | SDK Node.js para OpenTelemetry |
| `@opentelemetry/sdk-trace-node` | ^1.30.0 | Apache-2.0 | Trazabilidad con OpenTelemetry |
| `@opentelemetry/exporter-trace-otlp-http` | ^0.57.0 | Apache-2.0 | Exportador OTLP via HTTP |
| `@opentelemetry/exporter-prometheus` | ^0.57.0 | Apache-2.0 | Exportador de métricas Prometheus |
| `@opentelemetry/instrumentation-http` | ^0.57.0 | Apache-2.0 | Instrumentación HTTP |
| `@opentelemetry/instrumentation-express` | ^0.47.0 | Apache-2.0 | Instrumentación Express |
| `@opentelemetry/resources` | ^1.30.0 | Apache-2.0 | Recursos de OpenTelemetry |
| `@opentelemetry/semantic-conventions` | ^1.28.0 | Apache-2.0 | Convenciones semánticas |
| `prom-client` | ^15.1.0 | Apache-2.0 | Cliente de métricas Prometheus |

### Licencias — Observabilidad

#### Apache License 2.0 (Apache-2.0)

**OpenTelemetry** es un conjunto de herramientas, APIs y SDKs estandarizados para instrumentar, generar, recolectar y exportar datos de telemetría (métricas, logs y trazas) para analizar el rendimiento y comportamiento del software.

La instrumentación incluye:
- `@opentelemetry/instrumentation-http` — Captura automática de span para peticiones HTTP.
- `@opentelemetry/instrumentation-express` — Captura de spans para rutas Express.
- `@opentelemetry/exporter-trace-otlp-http` — Exportación de trazas al formato OTLP.
- `@opentelemetry/exporter-prometheus` — Exportación de métricas a Prometheus.

#### MIT License (MIT)

**Winston** es un logger universal diseñado para ser simple y versátil, con soporte para múltiples transportes (consola, archivo, HTTP, etc.). `nest-winston` proporciona integración nativa con NestJS.

---

## 5. Validación y Esquemas

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `class-validator` | ^0.14.1 | MIT | Validación declarativa basada en decoradores |
| `class-transformer` | ^0.5.1 | MIT | Transformación de objetos (serialización) |
| `joi` | ^18.2.1 | BSD-3-Clause | Validación de esquemas de objetos |
| `zod` | ^3.23.0 / ^4.4.3 | MIT | Validación de esquemas con inferencia TypeScript |

### Licencias — Validación

#### MIT License (MIT)

- `class-validator` — Basado en decoradores, permite validar objetos usando anotaciones.
- `class-transformer` — Transforma objetos planos en instancias de clases.
- `zod` — Validación con inferencia de tipos TypeScript de primera clase.

#### BSD 3-Clause License (BSD-3-Clause)

**joi** — Copyright 2023, hapi.js. Permisos: Uso comercial, modificación, distribución. Condiciones: Inclusión del aviso de copyright y disclaimer.

---

## 6. Procesamiento de Pagos

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `stripe` | ^22.1.1 | MIT | SDK oficial de Stripe para Node.js |
| `pdfkit` | ^0.15.0 | MIT | Generación de documentos PDF |

### Licencias — Pagos

#### MIT License (MIT)

**Stripe SDK** — Copyright 2023 Stripe, Inc. Cliente oficial para la API de Stripe, que permite procesar pagos, gestionar suscripciones y manejar webhooks.

**PDFKit** — Copyright 2023 Devon Govett. Biblioteca para generación de PDFs del lado del servidor.

---

## 7. Colas y Procesamiento Asíncrono

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `bullmq` | ^5.7.0 | MIT | Sistema de colas basado en Redis |

### Licencias — Colas

#### MIT License (MIT)

**BullMQ** — Copyright 2023 Taskforce.sh Inc. Sistema de colas de mensajes premium construido sobre Redis. Gestiona jobs, workers, colas, y eventos con soporte para prioridades, repeticiones y scheduling avanzado.

---

## 8. Inteligencia Artificial

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `openai` | ^4.0.0 | Apache-2.0 | SDK oficial de OpenAI (GPT-4, GPT-4o) |
| `@anthropic-ai/sdk` | ^0.18.0 | MIT | SDK oficial de Anthropic (Claude 3.5) |

### Licencias — IA

**openai** — Apache License 2.0. Copyright 2023 OpenAI, Inc. SDK oficial para interactuar con los modelos GPT de OpenAI.

**@anthropic-ai/sdk** — MIT License. Copyright 2023 Anthropic, Inc. SDK oficial para interactuar con los modelos Claude de Anthropic.

---

## 9. Comunicación y Mensajería

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `twilio` | ^5.5.1 | MIT | SDK de Twilio para SMS y comunicaciones |
| `uuid` | ^9.0.0 | MIT | Generación de UUIDs |

---

## 10. Herramientas de Desarrollo

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `typescript` | ^5.4.5 | Apache-2.0 | Compilador TypeScript |
| `eslint` | ^8.57.0 | MIT | Linter de JavaScript/TypeScript |
| `@typescript-eslint/eslint-plugin` | ^7.0.0 | MIT | Plugin ESLint para TypeScript |
| `@typescript-eslint/parser` | ^7.0.0 | BSD-2-Clause | Parser ESLint para TypeScript |
| `prettier` | ^3.2.5 | MIT | Formateador de código |
| `eslint-config-prettier` | ^9.1.0 | MIT | Configuración ESLint + Prettier |
| `husky` | ^9.0.11 | MIT | Gestión de hooks de Git |
| `lint-staged` | ^15.2.2 | MIT | Ejecución de linters en staged files |
| `@commitlint/cli` | ^19.3.0 | MIT | Validación de mensajes de commit |
| `@commitlint/config-conventional` | ^19.2.2 | MIT | Configuración conventional commits |
| `concurrently` | ^8.2.2 | MIT | Ejecución concurrente de comandos |

### Licencias — Dev Tools

#### Apache License 2.0 (Apache-2.0)

**TypeScript** — Copyright 2023 Microsoft Corporation. Superconjunto de JavaScript que añade tipado estático opcional.

#### BSD 2-Clause License (BSD-2-Clause)

**@typescript-eslint/parser** — Copyright 2023 TypeScript ESLint contributors.

#### MIT License (MIT)

El resto de herramientas de desarrollo utilizan licencia MIT.

---

## 11. Testing

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `jest` | ^29.7.0 | MIT | Framework de testing |
| `ts-jest` | ^29.1.2 | MIT | Transformador TypeScript para Jest |
| `supertest` | ^7.0.0 | MIT | Testing de APIs HTTP |
| `ts-node` | ^10.9.2 | MIT | Ejecución de TypeScript en Node.js |
| `ts-node-dev` | ^2.0.0 | MIT | Recarga en caliente para TypeScript |
| `ts-loader` | ^9.5.1 | MIT | Loader TypeScript para Webpack |
| `nodemon` | ^3.0.3 | MIT | Recarga automática en desarrollo |
| `@nestjs/testing` | ^10.3.0 | MIT | Utilidades de testing para NestJS |
| `@nestjs/cli` | ^10.3.0 | MIT | CLI de NestJS |
| `@nestjs/schematics` | ^10.1.0 | MIT | Schematics de NestJS |

### Licencias — Testing

Todas las herramientas de testing utilizan licencia **MIT**, salvo que se indique lo contrario.

---

## 12. Tipos TypeScript (devDependencies)

| Dependencia | Versión | Licencia | Descripción |
|---|---|---|---|
| `@types/express` | ^4.17.21 | MIT | Tipos para Express |
| `@types/node` | ^20.12.0 | MIT | Tipos para Node.js |
| `@types/jest` | ^29.5.12 | MIT | Tipos para Jest |
| `@types/bcrypt` | ^5.0.2 | MIT | Tipos para bcrypt |
| `@types/compression` | ^1.8.1 | MIT | Tipos para compression |
| `@types/cors` | ^2.8.17 | MIT | Tipos para cors |
| `@types/csurf` | ^1.11.5 | MIT | Tipos para csurf |
| `@types/joi` | ^17.2.2 | MIT | Tipos para joi |
| `@types/jsonwebtoken` | ^9.0.10 | MIT | Tipos para jsonwebtoken |
| `@types/morgan` | ^1.9.10 | MIT | Tipos para morgan |
| `@types/passport-jwt` | ^4.0.1 | MIT | Tipos para passport-jwt |
| `@types/pdfkit` | ^0.13.4 | MIT | Tipos para pdfkit |
| `@types/twilio` | ^3.19.0 | MIT | Tipos para twilio |
| `@types/uuid` | ^9.0.8 | MIT | Tipos para uuid |

---

## 13. Paquetes Compartidos Internos

| Paquete | Versión | Licencia | Descripción |
|---|---|---|---|
| `@backend/shared-ai` | 1.0.0 | Apache-2.0 | SDK de IA compartido (OpenAI + Anthropic) |
| `@backend/shared-analytics` | 1.0.0 | Apache-2.0 | Sistema de analíticas compartido |
| `@backend/shared-logger` | 1.0.0 | Apache-2.0 | Logger Winston compartido |
| `@backend/shared-prisma` | 1.0.0 | Apache-2.0 | Cliente Prisma compartido |
| `@backend/shared-reports` | 1.0.0 | Apache-2.0 | Generador de reportes compartido |
| `@backend/shared-telemetry` | 1.0.0 | Apache-2.0 | Telemetría OpenTelemetry compartida |
| `@backend/shared-types` | 1.0.0 | Apache-2.0 | Tipos TypeScript compartidos |
| `@backend/shared-utils` | 1.0.0 | Apache-2.0 | Utilidades compartidas |

---

## 14. Imágenes Docker (Infraestructura)

| Imagen | Versión | Licencia | Descripción |
|---|---|---|---|
| `postgres` | 16-alpine | PostgreSQL License | Base de datos relacional |
| `redis` | 7-alpine | BSD-3-Clause | Almacén en memoria |

### Licencias Docker

**PostgreSQL** se distribuye bajo la **PostgreSQL License**, una licencia tipo MIT permisiva.

**Redis** se distribuye bajo la **BSD 3-Clause License**.

---

## 15. Resumen de Licencias

| Licencia | Cantidad de Dependencias |
|---|---|
| MIT | ~65 |
| Apache 2.0 | ~18 |
| BSD-3-Clause | 2 (joi, Redis) |
| BSD-2-Clause | 1 (@typescript-eslint/parser) |
| PostgreSQL License | 1 (PostgreSQL) |

---

## 16. Textos de Licencias

### MIT License

```
MIT License

Copyright (c) <año> <titulares>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache License 2.0

El texto completo de la licencia Apache 2.0 está disponible en el archivo [LICENSE](../../LICENSE) en la raíz del proyecto.

### BSD 3-Clause License

```
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.
```

---

## Notas Finales

- Este documento se genera a partir del análisis de los archivos `package.json` de todos los paquetes del monorepo.
- Las licencias indicadas corresponden a las versiones específicas utilizadas en el proyecto.
- Para obtener el texto completo de cada licencia, consulta el directorio `node_modules/<paquete>/LICENSE` o el repositorio oficial de cada dependencia.
- Si encuentras alguna omisión o error en este listado, por favor abre un issue en el repositorio del proyecto.

---

*Documento generado y mantenido por el equipo de Backend Template.*
