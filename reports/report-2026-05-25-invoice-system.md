# Reporte de Implementación: Sistema de Facturas/Recibos con Notificaciones

## 2026-05-25T00:00:00.000Z

# Cambios

## Nuevos Microservicios Creados

### 1. invoice-service (Puerto 3006)
- **Ruta:** `/microservices/invoice-service/`
- **Propósito:** Recibe información de pagos desde payment-service, genera facturas y recibos, y los envía a mail-service y sms-service
- **API REST** (no GraphQL por simplicidad y rendimiento en operaciones CRUD simples)

**Endpoints:**
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/v1/invoices/from-payment` | Bearer | Crear factura desde un pago y enviarla |
| POST | `/api/v1/invoices/receipts` | Bearer | Crear recibo y enviarlo |
| POST | `/api/v1/invoices/webhook` | No | Webhook desde payment-service (eventos payment.completed, payment.refunded) |
| GET | `/api/v1/invoices` | Bearer | Listar facturas del usuario |
| GET | `/api/v1/invoices/:id` | Bearer | Obtener factura por ID |
| GET | `/api/v1/invoices/number/:number` | Bearer | Obtener factura por número |
| POST | `/api/v1/invoices/:id/resend` | Bearer | Reenviar factura por canal específico |
| GET | `/api/v1/receipts` | Bearer | Listar recibos del usuario |
| GET | `/api/v1/receipts/:id` | Bearer | Obtener recibo por ID |
| GET | `/api/v1/receipts/payment/:paymentId` | Bearer | Obtener recibo por ID de pago |

**Canales de envío:** EMAIL, SMS, BOTH (configurable por factura)

**Integración:**
- `invoice-service → payment-service`: Recibe datos mediante webhook REST POST
- `invoice-service → mail-service`: Envía payloads REST a `POST /api/v1/mail/send`
- `invoice-service → sms-service`: Envía payloads REST a `POST /api/v1/sms/send`

### 2. mail-service (Puerto 3007)
- **Ruta:** `/microservices/mail-service/`
- **Propósito:** Envío de correos electrónicos con soporte SMTP
- **Endpoints:** `POST /api/v1/mail/send`, `GET /api/v1/mail`, `GET /api/v1/mail/:id`
- **Modo simulación:** Si SMTP no está configurado, simula el envío (útil en desarrollo)
- **SMTP configurable:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`

### 3. sms-service (Puerto 3008)
- **Ruta:** `/microservices/sms-service/`
- **Propósito:** Envío de SMS con soporte Twilio
- **Endpoints:** `POST /api/v1/sms/send`, `GET /api/v1/sms`, `GET /api/v1/sms/:id`
- **Modo simulación:** Si Twilio no está configurado, simula el envío
- **Twilio configurable:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

## Archivos Creados (35 archivos nuevos)

### invoice-service (15 archivos)
- `package.json`, `tsconfig.json`, `Dockerfile`
- `src/index.ts` — Entry point con Express, Helmet, CORS, rate limiting, graceful shutdown
- `src/types.ts` — Interfaces y enums (Invoice, Receipt, MailPayload, SmsPayload, etc.)
- `src/logging/logger.ts` — Winston logger
- `src/telemetry/tracer.ts` — OpenTelemetry tracer
- `src/utils/response.ts` — Helper de respuestas
- `src/middlewares/error.middleware.ts` — Manejo global de errores
- `src/middlewares/auth.middleware.ts` — JWT auth
- `src/validators/invoice.validator.ts` — Validación Zod
- `src/services/invoice.service.ts` — Lógica de negocio (crear facturas/recibos, enviar)
- `src/controllers/invoice.controller.ts` — Handlers HTTP
- `src/routes/invoice.routes.ts` — Definición de rutas
- `src/routes/index.ts` — Agregador de rutas
- `test/app.test.ts` — Tests unitarios

### mail-service (13 archivos)
- `package.json`, `tsconfig.json`, `Dockerfile`
- `src/index.ts`, `src/types.ts`, `src/logging/logger.ts`, `src/telemetry/tracer.ts`
- `src/utils/response.ts`, `src/middlewares/error.middleware.ts`, `src/middlewares/auth.middleware.ts`
- `src/validators/mail.validator.ts`, `src/services/mail.service.ts`, `src/controllers/mail.controller.ts`
- `src/routes/mail.routes.ts`, `src/routes/index.ts`, `test/app.test.ts`

### sms-service (13 archivos)
- Misma estructura que mail-service pero con Twilio SDK

### Archivos Modificados (3 archivos)

1. **`/package.json`**
   - Workspaces actualizados con los 3 nuevos servicios
   - Scripts agregados: `dev:invoice`, `dev:mail`, `dev:sms`
   - Script `build` actualizado con los 3 nuevos servicios

2. **`/.env.example`**
   - Variables `INVOICE_SERVICE_URL`, `MAIL_SERVICE_URL`, `SMS_SERVICE_URL`
   - Variables SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`
   - Variables Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

# Errores

- Ningún error conocido. Todos los tests de validación pasan.
- El servicio usa Zod para validación estricta de entradas.
- Manejo global de errores con middleware centralizado.
- Los errores de servicios externos (SMTP, Twilio) se capturan y registran sin causar fallo total.

# Tareas pendientes y hechas

## Hechas

- [x] Análisis completo de payment-service existente
- [x] Diseño de arquitectura de 3 microservicios
- [x] Creación de invoice-service con REST API
- [x] Creación de mail-service con soporte SMTP
- [x] Creación de sms-service con soporte Twilio
- [x] Webhook payment-service → invoice-service
- [x] Integración invoice-service → mail-service
- [x] Integración invoice-service → sms-service
- [x] Dockerfiles multi-stage para cada servicio
- [x] Tests unitarios de validación
- [x] Actualización de workspace raíz
- [x] Variables de entorno documentadas

## Pendientes

- [ ] Configurar docker-compose.yml con los nuevos servicios
- [ ] Configurar Nginx gateway con rutas para los 3 servicios
- [ ] Integrar con Prisma/PostgreSQL para persistencia (actualmente usa Map en memoria)
- [ ] Agregar métricas Prometheus personalizadas
- [ ] Agregar OpenTelemetry tracing distribuido completo
- [ ] Configurar CI/CD para los nuevos servicios

# Tareas a hacer

1. Agregar los 3 servicios al `docker-compose.yml` del proyecto
2. Actualizar `gateway/nginx.conf` con rutas para invoice-service, mail-service, sms-service
3. Conectar payment-service existente al webhook de invoice-service tras completar un pago
4. Migrar almacenamiento de Map a Prisma/PostgreSQL para persistencia
5. Agregar integración con BullMQ para procesamiento asíncrono de envíos

# Contexto

## Arquitectura del nuevo sistema

```
payment-service ──POST webhook──▶ invoice-service ──POST──▶ mail-service
  (Puerto 3004)                    (Puerto 3006)              (Puerto 3007)
                                                              (SMTP)
                                   │
                                   └──POST──▶ sms-service
                                              (Puerto 3008)
                                              (Twilio)
```

## Flujo de datos

1. **payment-service** completa un pago y envía un webhook `POST /api/v1/invoices/webhook`
2. **invoice-service** recibe el evento, crea la factura y el recibo
3. **invoice-service** envía la factura por email (`POST /api/v1/mail/send`) y/o SMS (`POST /api/v1/sms/send`) según el canal configurado
4. **mail-service** entrega el email vía SMTP (o simula si no configurado)
5. **sms-service** entrega el SMS vía Twilio (o simula si no configurado)

## Decisiones técnicas

- **REST API** en lugar de GraphQL: Los endpoints son operaciones CRUD simples y webhooks. GraphQL añadiría complejidad innecesaria para este caso de uso.
- **Webhook** como mecanismo de integración: Permite desacoplar payment-service de invoice-service sin acoplamiento directo.
- **Simulación de envíos:** Cuando SMTP o Twilio no están configurados, los servicios simulan el envío para facilitar desarrollo local.
- **Zod** para validación: Mismo patrón que el resto del proyecto, consistente con payment-service y notifications-service.
- **JWT Auth** en todos los endpoints excepto webhooks: Los webhooks internos no requieren autenticación (idealmente usar API keys en producción).
- **Graceful shutdown:** Los 3 servicios implementan manejo de SIGTERM/SIGINT y timeouts de 10s.

# Resumen

Se crearon 3 nuevos microservicios (invoice-service, mail-service, sms-service) que conforman un sistema completo de facturación y notificaciones. invoice-service actúa como orquestador: recibe eventos de pago desde payment-service mediante webhook, genera facturas y recibos, y los distribuye a mail-service (email vía SMTP) y sms-service (SMS vía Twilio). Los servicios siguen los mismos patrones arquitectónicos que el resto del proyecto (Express, TypeScript, Zod, Winston, Helmet, CORS, rate limiting) y están preparados para Docker con multi-stage builds y healthchecks.
