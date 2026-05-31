# Plantilla de Backend

**Backend Empresarial con Arquitectura Híbrida Monolito + Microservicios**

Una plantilla de backend de producción construida con NestJS y Express, que combina un monolito con características avanzadas con microservicios independientes. Incluye observabilidad completa, diagnóstico de errores con IA, analítica, procesamiento basado en colas y respuesta automática a incidentes.

---

## Tabla de Contenidos

- [Visión General de la Arquitectura](#visión-general-de-la-arquitectura)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Inicio Rápido](#inicio-rápido)
- [Configuración de Desarrollo](#configuración-de-desarrollo)
- [Variables de Entorno](#variables-de-entorno)
- [Endpoints de API](#endpoints-de-api)
- [Observabilidad](#observabilidad)
- [Sistema AI Error Doctor](#sistema-ai-error-doctor)
- [Sistema de Analítica](#sistema-de-analítica)
- [Sistema de Colas](#sistema-de-colas)
- [Sistema de Alertas](#sistema-de-alertas)
- [Informes Automáticos](#informes-automáticos)
- [Seguridad](#seguridad)
- [Pruebas](#pruebas)
- [Configuración con Docker](#configuración-con-docker)
- [Solución de Problemas](#solución-de-problemas)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Visión General de la Arquitectura

El sistema sigue una arquitectura híbrida que combina un monolito con características avanzadas con microservicios independientes:

`+-----------------------------------------------------------------------------------------+
|                              ARQUITECTURA HÍBRIDA                                |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  +-----------------------------------------------------------------------------+       |
|  |                                MONOLITO PRINCIPAL                            |       |
|  |                                                                                     |       |
|  |  +-----------------------------------------------------------------+           |       |
|  |  |                        SERVICIOS DE DOMINIO PRINCIPALES                  |           |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |           |       |
|  |  |  |  Autenticación |  |  Usuarios    |  |  Productos   |  |  Órdenes     |  |           |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |           |       |
|  |  +-----------------------------------------------------------------+           |       |
|  |                                                                                     |       |
|  |  +-----------------------------------------------------------------+           |       |
|  |  |                        SERVICIOS DE SOPORTE                          |           |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |           |       |
|  |  |  |  Registro    |  |  Telemetría  |  |  Colas       |  |  Informes    |  |           |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |           |       |
|  |  +-----------------------------------------------------------------+           |       |
|  +-----------------------------------------------------------------------------+       |
|                                                                                         |
|  +-----------------------------------------------------------------------------+       |
|  |                                MICROSERVICIOS                             |       |
|  |                                                                                     |       |
|  |  +-----------------------------------------------------------------+           |       |
|  |  |                        SERVICIOS INDEPENDIENTES                      |           |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |           |       |
|  |  |  |  Autenticación |  |  Notificaciones |  |  Pagos       |  |  Inventario  |  |           |       |
|  |  |  +-------------+  +-------------+  +-------------+  +-------------+  |           |       |
|  |  +-----------------------------------------------------------------+           |       |
|  +-----------------------------------------------------------------------------+       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+`

## Tecnologías Utilizadas

- **Backend**: NestJS/Express (Node.js/TypeScript)
- **Base de Datos**: PostgreSQL + Prisma
- **Caché**: Redis
- **Sistema de Colas**: BullMQ
- **Registro**: Winston
- **Traza**: OpenTelemetry + Jaeger
- **Métricas**: Prometheus
- **Agregación de Registros**: Loki
- **Tablero**: Grafana
- **Sistema de IA**: Agentes de IA personalizados para diagnóstico de errores y respuesta a incidentes

## Estructura del Proyecto

`plantilla-backend/
+-- main/                  # Aplicación monolito principal
+-- microservices/         # Microservicios independientes
|   +-- auth-service/       # Servicio de autenticación
|   +-- notifications-service/ # Servicio de notificaciones
|   +-- payment-service/    # Servicio de procesamiento de pagos
|   +-- users-service/      # Servicio de gestión de usuarios
+-- gateway/               # API Gateway
+-- infrastructure/        # Configuración de infraestructura
+-- scripts/               # Scripts de utilidad
+-- reports/               # Informes automáticos
+-- skills/                # Habilidades de agentes de IA
+-- context/               # Información contextual
+-- docs/                  # Documentación
+-- .env.example           # Plantilla de variables de entorno
+-- package.json           # Dependencias del proyecto
+-- README.md              # Documentación del proyecto`

## Inicio Rápido

1. Clonar el repositorio
2. Instalar dependencias:

npm install 3. Configurar variables de entorno (copiar .env.example a .env) 4. Iniciar el servidor de desarrollo:
npm run dev

## Configuración de Desarrollo

1. Instalar Node.js (v20+)
2. Instalar PostgreSQL
3. Instalar Redis
4. Instalar Docker (para infraestructura)

## Variables de Entorno

Crear un archivo .env basado en .env.example y configurar:

`

# Base de Datos

DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombrebd

# Redis

REDIS_URL=redis://localhost:6379

# JWT

JWT_SECRET=tu_secreto_jwt

# Stripe

STRIPE_SECRET_KEY=tu_clave_secreta_stripe
STRIPE_WEBHOOK_SECRET=tu_secreto_webhook

# Observabilidad

PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000
LOKI_URL=http://localhost:3100
JAEGER_URL=http://localhost:16686

# Sistema de IA

AI_DOCTOR_API_KEY=tu_clave_api_ai_doctor
`

## Endpoints de API

El sistema expone los siguientes endpoints principales:

- **Servicio de Autenticación**: /api/auth
- **Servicio de Usuarios**: /api/users
- **Servicio de Pagos**: /api/payments
- **Servicio de Notificaciones**: /api/notifications
- **Servicio de Inventario**: /api/inventory

## Observabilidad

El sistema incluye características de observabilidad completas:

- **Métricas**: Prometheus para la recopilación de métricas
- **Registros**: Winston + Loki para la agregación de registros
- **Trazas**: OpenTelemetry + Jaeger para trazado distribuido
- **Tableros**: Grafana para visualización

## Sistema AI Error Doctor

El sistema AI Error Doctor proporciona diagnóstico y respuesta automática a errores e incidentes:

- **Análisis de Errores**: Análisis de errores con IA y identificación de causas raíz
- **Respuesta a Incidentes**: Respuesta automática y resolución de incidentes
- **Patrones de Errores**: Detección de patrones de errores recurrentes
- **Recomendaciones**: Recomendaciones accionables para la resolución de errores

## Sistema de Analítica

El sistema de analítica proporciona información completa sobre el rendimiento del sistema y el comportamiento del usuario:

- **Analítica de Usuarios**: Seguimiento de la actividad y comportamiento de los usuarios
- **Analítica de Rendimiento**: Monitoreo de métricas de rendimiento del sistema
- **Analítica de Errores**: Análisis de patrones y tendencias de errores
- **Analítica de Negocio**: Información sobre métricas y KPIs de negocio

## Sistema de Colas

El sistema de colas maneja el procesamiento asíncrono y los trabajos en segundo plano:

- **Procesamiento de Trabajos**: Procesamiento de trabajos en segundo plano
- **Programación de Trabajos**: Programación de trabajos recurrentes
- **Monitoreo de Trabajos**: Monitoreo del estado y progreso de los trabajos

## Sistema de Alertas

El sistema de alertas proporciona notificaciones y alertas en tiempo real:

- **Tipos de Alertas**: Varios tipos de alertas (error, advertencia, información)
- **Canales de Alerta**: Múltiples canales de alerta (email, Slack, PagerDuty)
- **Escalado de Alertas**: Políticas de escalado de alertas

## Informes Automáticos

El sistema genera informes automáticos para monitoreo y análisis:

- **Informes de Rendimiento**: Informes sobre el rendimiento del sistema
- **Informes de Errores**: Informes sobre patrones y tendencias de errores
- **Informes de Negocio**: Informes sobre métricas y KPIs de negocio

## Seguridad

El sistema incluye características de seguridad completas:

- **Autenticación**: Autenticación basada en JWT
- **Autorización**: Control de acceso basado en roles
- **Protección de Datos**: Cifrado de datos sensibles
- **Auditorías de Seguridad**: Auditorías de seguridad regulares y escaneo de vulnerabilidades

## Pruebas

El sistema incluye pruebas completas:

- **Pruebas Unitarias**: Pruebas unitarias para componentes individuales
- **Pruebas de Integración**: Pruebas de integración para interacciones de componentes
- **Pruebas End-to-End**: Pruebas end-to-end para flujos de usuario
- **Pruebas de Carga**: Pruebas de carga para evaluación de rendimiento

## Configuración con Docker

El sistema incluye configuración de Docker para fácil despliegue:

- **Docker Compose**: Configuración de múltiples contenedores con Docker
- **Imágenes de Docker**: Imágenes de Docker preconstruidas
- **Docker Hub**: Imágenes de Docker disponibles en Docker Hub

## Solución de Problemas

Problemas comunes y soluciones:

- **Problema**: Aplicación no se inicia
  **Solución**: Verificar registros y asegurarse de que todas las dependencias estén instaladas

- **Problema**: Errores de conexión a la base de datos
  **Solución**: Verificar credenciales de la base de datos y URL de conexión

- **Problema**: Endpoint de API no funciona
  **Solución**: Verificar configuración del API Gateway y estado del microservicio

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para pautas de contribución.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
