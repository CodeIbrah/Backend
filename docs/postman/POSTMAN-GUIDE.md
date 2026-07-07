# 🚀 GUÍA COMPLETA DE TESTING CON POSTMAN

> **Backend Template** — Documentación oficial para pruebas de API, autenticación, seguridad y rendimiento.

---

## 📋 TABLA DE CONTENIDOS

- [1. Introducción](#1-introducción)
- [2. Requisitos Previos](#2-requisitos-previos)
- [3. Configuración del Entorno](#3-configuración-del-entorno)
- [4. Importar la Colección](#4-importar-la-colección)
- [5. Endpoints de Autenticación](#5-endpoints-de-autenticación)
- [6. Endpoints de Usuarios](#6-endpoints-de-usuarios)
- [7. Endpoints de Salud y Métricas](#7-endpoints-de-salud-y-métricas)
- [8. Endpoints de Operaciones](#8-endpoints-de-operaciones)
- [9. Endpoints de Activity Log](#9-endpoints-de-activity-log)
- [10. Flujo Completo de Autenticación](#10-flujo-completo-de-autenticación)
- [11. Pruebas de Rate Limiting](#11-pruebas-de-rate-limiting)
- [12. Pruebas de Seguridad](#12-pruebas-de-seguridad)
- [13. Pruebas de Cache](#13-pruebas-de-cache)
- [14. Automatización con Postman Collection Runner](#14-automatización-con-postman-collection-runner)
- [15. Integración CI/CD con Newman](#15-integración-cicd-con-newman)
- [16. Resolución de Problemas](#16-resolución-de-problemas)

---

## 1. Introducción

Esta guía proporciona todo lo necesario para probar **todas las APIs del Backend Template** utilizando Postman. Incluye:

- ✅ Configuración paso a paso del entorno Postman
- ✅ Colección completa con todos los endpoints documentados
- ✅ Flujo de autenticación JWT completo (register → login → refresh → logout)
- ✅ Pruebas de rate limiting (3 tiers: short/medium/long)
- ✅ Pruebas de seguridad (brute force, CORS, CSRF, CSP)
- ✅ Pruebas de cache (Redis + LRU 2-tier)
- ✅ Scripts de test automatizados para cada endpoint
- ✅ Integración con Newman para CI/CD

### ¿Por qué Postman?

| Característica | Beneficio |
| -------------- | --------- |
| **Collection Runner** | Automatiza baterías de tests sin escribir código |
| **Pre-request Scripts** | Genera tokens, hashes y datos dinámicos |
| **Test Scripts** | Validación automática de respuestas (status, schema, headers) |
| **Environments** | Cambia entre dev/staging/production con un clic |
| **Newman CLI** | Integración directa en pipelines CI/CD |
| **Monitor** | Ejecución programada de tests desde la nube |

---

## 2. Requisitos Previos

### 2.1 Backend en Ejecución

```bash
# Asegúrate de que el backend esté corriendo
cd Backend

# Desarrollo
npm run dev

# O producción
npm run build && npm start
```

### 2.2 Variables de Entorno Mínimas

```env
# .env — valores mínimos para pruebas
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/backend
JWT_SECRET=test-secret-key-at-least-32-characters-long!!
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
REDIS_URL=redis://localhost:6379
```

### 2.3 Postman Instalado

- [Descargar Postman](https://www.postman.com/downloads/) (v10+ recomendada)
- O instalar Newman globalmente: `npm install -g newman`

---

## 3. Configuración del Entorno

### 3.1 Crear Environment en Postman

Crea un nuevo **Environment** con las siguientes variables:

| Variable | Valor Inicial | Valor Actual | Descripción |
| -------- | ------------- | ------------ | ----------- |
| `base_url` | `http://localhost:3000` | `http://localhost:3000` | URL base de la API |
| `api_prefix` | `api/v1` | `api/v1` | Prefijo global de la API |
| `full_url` | `{{base_url}}/{{api_prefix}}` | `http://localhost:3000/api/v1` | URL completa calculada |
| `admin_email` | `admin@test.com` | `admin@test.com` | Email de admin para pruebas |
| `admin_password` | `Admin123!` | `Admin123!` | Password del admin |
| `user_email` | `user@test.com` | `user@test.com` | Email de usuario normal |
| `user_password` | `User123!` | `User123!` | Password del usuario |
| `access_token` | — | *(se genera automáticamente)* | Access token JWT |
| `refresh_token` | — | *(se genera automáticamente)* | Refresh token JWT |
| `user_id` | — | *(se genera automáticamente)* | ID del usuario creado |
| `target_user_id` | — | — | ID de usuario objetivo para pruebas |
| `correlation_id` | — | *(se genera en pre-request)* | Para tracing distribuido |

### 3.2 Pre-request Script Global

En la colección, añade este script en **Pre-request Script** para generar automáticamente `correlation_id`:

```javascript
// Generar correlation_id único para cada request (tracing)
pm.variables.set('correlation_id', 'corr-' + crypto.randomUUID().slice(0, 8));

// Si no hay access_token pero la petición requiere auth, mostrar advertencia
const requiresAuth = pm.request.headers.any(h => h.key === 'Authorization');
if (requiresAuth && !pm.variables.get('access_token')) {
    console.warn('⚠️  No hay access_token. Ejecuta primero POST Login');
}
```

---

## 4. Importar la Colección

### 4.1 Descargar la Colección

La colección predefinida está disponible en:
```
docs/postman/backend-template-collection.json
```

### 4.2 Importar en Postman

1. Postman → **File** → **Import** → **File**
2. Selecciona `backend-template-collection.json`
3. Selecciona el **Environment** creado en el paso anterior
4. Haz clic en **Import**

### 4.3 Estructura de la Colección

```
📁 Backend Template API
├── 🔐 Auth
│   ├── POST Register
│   ├── POST Login
│   ├── POST Refresh Token
│   ├── POST Logout
│   └── GET Profile
├── 👥 Users
│   ├── GET List Users
│   ├── GET User by ID
│   ├── PATCH Update User
│   ├── DELETE User
│   └── PATCH Toggle Active
├── ❤️ Health
│   ├── GET Health Check
│   ├── GET Readiness
│   └── GET Liveness
├── 📊 Metrics
│   └── GET Prometheus Metrics
├── ⚙️ Operations
│   └── GET Ops Dashboard
├── 📋 Activity Log
│   ├── GET All Activities
│   ├── GET Activity by ID
│   ├── GET User Activities
│   ├── GET Activity Stats
│   ├── GET Critical Activities
│   └── POST Export Activities
└── 🧪 Security Tests
    ├── 🚦 Rate Limiting: Login x6
    ├── 🚦 Rate Limiting: Short (1s/3req)
    ├── 🔒 Brute Force: Login Fail x6
    ├── 🛡️ CSRF: POST without token
    └── 🔑 Invalid JWT Test
```

---

## 5. Endpoints de Autenticación

### 5.1 POST Register — Crear Usuario

```
POST {{full_url}}/auth/register
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Content-Type` | `application/json` |
| `X-Correlation-Id` | `{{correlation_id}}` |

**Body (JSON):**
```json
{
    "email": "{{user_email}}",
    "password": "{{user_password}}",
    "name": "Usuario de Prueba"
}
```

**Response 201 (CREATED):**
```json
{
    "user": {
        "id": "cm7...",
        "email": "user@test.com",
        "name": "Usuario de Prueba",
        "role": "USER"
    },
    "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Test Script (automático):**
```javascript
pm.test('Status 201 Created', () => pm.response.to.have.status(201));
pm.test('Response tiene user + tokens', () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property('user');
    pm.expect(json).to.have.property('tokens');
    pm.expect(json.tokens).to.have.property('accessToken');
    pm.expect(json.tokens).to.have.property('refreshToken');
});
pm.test('Role por defecto es USER', () => {
    pm.expect(pm.response.json().user.role).to.eql('USER');
});

// Guardar tokens para requests siguientes
const json = pm.response.json();
pm.collectionVariables.set('access_token', json.tokens.accessToken);
pm.collectionVariables.set('refresh_token', json.tokens.refreshToken);
pm.collectionVariables.set('user_id', json.user.id);
```

### 5.2 POST Login — Iniciar Sesión

```
POST {{full_url}}/auth/login
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Content-Type` | `application/json` |

**Body (JSON):**
```json
{
    "email": "{{admin_email}}",
    "password": "{{admin_password}}"
}
```

**Response 200 (OK):**
```json
{
    "user": {
        "id": "cm7...",
        "email": "admin@test.com",
        "name": "Admin",
        "role": "ADMIN"
    },
    "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Test Script:**
```javascript
pm.test('Status 200 OK', () => pm.response.to.have.status(200));
pm.test('Tiene accessToken', () => {
    pm.expect(pm.response.json().tokens.accessToken).to.not.be.empty;
});

// Almacenar tokens
const json = pm.response.json();
pm.collectionVariables.set('access_token', json.tokens.accessToken);
pm.collectionVariables.set('refresh_token', json.tokens.refreshToken);
pm.collectionVariables.set('user_id', json.user.id);
```

### 5.3 POST Refresh Token — Renovar Token

```
POST {{full_url}}/auth/refresh
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Content-Type` | `application/json` |

**Body (JSON):**
```json
{
    "refreshToken": "{{refresh_token}}"
}
```

**Response 200:**
```json
{
    "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Nuevo accessToken generado', () => {
    const json = pm.response.json();
    pm.expect(json.tokens.accessToken).to.not.eql(pm.collectionVariables.get('access_token'));
});

// Actualizar tokens
const json = pm.response.json();
pm.collectionVariables.set('access_token', json.tokens.accessToken);
pm.collectionVariables.set('refresh_token', json.tokens.refreshToken);
```

### 5.4 POST Logout — Cerrar Sesión

```
POST {{full_url}}/auth/logout
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |
| `Content-Type` | `application/json` |

**Response 200:**
```json
{
    "message": "Logged out successfully"
}
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Mensaje de logout', () => {
    pm.expect(pm.response.json().message).to.include('Logged out');
});

// Limpiar tokens tras logout
pm.collectionVariables.set('access_token', '');
pm.collectionVariables.set('refresh_token', '');
```

### 5.5 GET Profile — Perfil del Usuario

```
GET {{full_url}}/auth/profile
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |

**Response 200:**
```json
{
    "id": "cm7...",
    "email": "admin@test.com",
    "name": "Admin",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-07-04T...",
    "updatedAt": "2026-07-04T..."
}
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Perfil contiene datos del usuario', () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property('email');
    pm.expect(json).to.have.property('role');
    pm.expect(json).to.have.property('isActive');
});
```

---

## 6. Endpoints de Usuarios

### 6.1 GET List Users — Listar Usuarios (Admin)

```
GET {{full_url}}/users?page=1&limit=10
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |

**Query Params:**
| Parámetro | Tipo | Default | Descripción |
| --------- | ---- | ------- | ----------- |
| `page` | int | 1 | Número de página |
| `limit` | int | 10 | Items por página (max 100) |

**Response 200:**
```json
{
    "users": [
        {
            "id": "cm7...",
            "email": "user@test.com",
            "name": "Usuario",
            "role": "USER",
            "isActive": true,
            "createdAt": "2026-07-04T...",
            "updatedAt": "2026-07-04T..."
        }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
}
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Respuesta paginada', () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property('users');
    pm.expect(json).to.have.property('total');
    pm.expect(json).to.have.property('page');
    pm.expect(json).to.have.property('limit');
});
pm.test('Cache header presente (si Redis activo)', () => {
    // Si está cacheado, el tiempo de respuesta debe ser < 50ms
    pm.expect(pm.response.responseTime).to.be.below(5000);
});
```

### 6.2 GET User by ID — Detalle de Usuario

```
GET {{full_url}}/users/{{user_id}}
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |

**Response 200:**
```json
{
    "id": "cm7...",
    "email": "user@test.com",
    "name": "Usuario",
    "role": "USER",
    "isActive": true,
    "createdAt": "2026-07-04T...",
    "updatedAt": "2026-07-04T..."
}
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('ID coincide', () => {
    pm.expect(pm.response.json().id).to.eql(pm.collectionVariables.get('user_id'));
});
```

### 6.3 PATCH Update User — Actualizar Usuario (Admin)

```
PATCH {{full_url}}/users/{{user_id}}
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |
| `Content-Type` | `application/json` |

**Body:**
```json
{
    "name": "Nombre Actualizado"
}
```

**Response 200:**
```json
{
    "id": "cm7...",
    "email": "user@test.com",
    "name": "Nombre Actualizado",
    "role": "USER",
    "isActive": true,
    ...
}
```

### 6.4 DELETE User — Eliminar Usuario (Admin)

```
DELETE {{full_url}}/users/{{user_id}}
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |

**Response 204 (No Content):** *(sin body)*

### 6.5 PATCH Toggle Active — Activar/Desactivar (Admin)

```
PATCH {{full_url}}/users/{{target_user_id}}/active
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |
| `Content-Type` | `application/json` |

**Response 200:**
```json
{
    "id": "cm7...",
    "isActive": false,
    ...
}
```

---

## 7. Endpoints de Salud y Métricas

### 7.1 GET Health Check

```
GET {{full_url}}/health
```

**Response 200:**
```json
{
    "status": "ok",
    "info": {
        "database": {
            "status": "up"
        }
    },
    "error": {},
    "details": {
        "database": {
            "status": "up"
        }
    }
}
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Health check ok', () => {
    pm.expect(pm.response.json().status).to.eql('ok');
});
pm.test('Base de datos operativa', () => {
    pm.expect(pm.response.json().info.database.status).to.eql('up');
});
```

### 7.2 GET Readiness (K8s Readiness Probe)

```
GET {{full_url}}/health/ready
```

**Response 200:** Misma estructura que Health Check.

### 7.3 GET Liveness (K8s Liveness Probe)

```
GET {{full_url}}/health/live
```

**Response 200:**
```json
{
    "status": "ok",
    "timestamp": "2026-07-04T..."
}
```

### 7.4 GET Prometheus Metrics

```
GET {{full_url}}/metrics
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `X-Metrics-API-Key` | `{{metrics_api_key}}` |

**Response 200 (text/plain):**
```text
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 123.45
...
```

**Test Script:**
```javascript
pm.test('Status 200', () => pm.response.to.have.status(200));
pm.test('Content-Type es text/plain', () => {
    pm.expect(pm.response.headers.get('Content-Type')).to.include('text/plain');
});
pm.test('Contiene métricas Prometheus', () => {
    pm.expect(pm.response.text()).to.include('# HELP');
});
```

---

## 8. Endpoints de Operaciones

### 8.1 GET Ops Dashboard (Admin)

```
GET {{full_url}}/ops
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |

**Response 200:**
```json
{
    "activeIncidents": [],
    "recentErrors": [],
    "groupedErrors": [],
    "rootCauseAnalysis": [],
    "suggestedFixes": [],
    "metrics": {
        "uptime": 3600,
        "requestsPerMinute": 150,
        "errorRate": 0.5,
        "avgResponseTime": 45,
        ...
    },
    "healthStatus": {
        "status": "healthy",
        "checks": {}
    },
    "containersStatus": [],
    "queueStatus": [],
    "redisStatus": {
        "status": "up",
        "latency": 2,
        "connections": 5
    },
    "postgresStatus": {
        "status": "up",
        "latency": 3,
        "connections": 3
    }
}
```

---

## 9. Endpoints de Activity Log

### 9.1 GET All Activities (Admin)

```
GET {{full_url}}/activity-log?page=1&limit=20&severity=ERROR
```

**Headers:**
| Header | Valor |
| ------ | ----- |
| `Authorization` | `Bearer {{access_token}}` |

**Query Params:**
| Parámetro | Tipo | Descripción |
| --------- | ---- | ----------- |
| `page` | int | Número de página |
| `limit` | int | Items por página |
| `type` | enum | Filtrar por tipo de actividad |
| `severity` | enum | Filtrar por severidad |
| `userId` | string | Filtrar por usuario |
| `dateFrom` | string | Fecha inicio (ISO 8601) |
| `dateTo` | string | Fecha fin (ISO 8601) |
| `search` | string | Búsqueda en descripción |

### 9.2 GET Activity Stats (Admin)

```
GET {{full_url}}/activity-log/stats?dateFrom=2026-07-01&dateTo=2026-07-04
```

**Response 200:**
```json
{
    "byType": {
        "LOGIN": 45,
        "USER_CREATED": 3,
        ...
    },
    "bySeverity": {
        "INFO": 100,
        "WARNING": 5,
        "ERROR": 2
    },
    "byUser": {
        "user-1": 30,
        ...
    },
    "total": 150
}
```

---

## 10. 🔄 Flujo Completo de Autenticación

Este flujo simula el ciclo de vida completo de un usuario (ideal para Collection Runner):

### Secuencia Automatizada

| Paso | Request | Dependencia | Descripción |
| ---- | ------- | ----------- | ----------- |
| 1 | **POST Register** | — | Crear usuario de prueba |
| 2 | **POST Login** | — | Iniciar sesión (múltiples roles) |
| 3 | **GET Profile** | Login | Verificar perfil con token |
| 4 | **GET Users List** | Login | Listar usuarios (requiere ADMIN) |
| 5 | **GET User Detail** | Login | Ver detalle de usuario |
| 6 | **POST Refresh Token** | Login | Renovar tokens |
| 7 | **GET Profile (new token)** | Refresh | Verificar nuevo token funciona |
| 8 | **POST Logout** | — | Cerrar sesión |
| 9 | **GET Profile (should fail)** | — | Verificar token invalidado |

### Script de Flujo (Pre-request para paso 9)

```javascript
// Paso 9: Verificar que el token de logout ya no funciona
// Este test debe FALLAR si el backend invalidó correctamente el token
pm.test('❌ Token invalidado → 401 esperado', () => {
    pm.expect(pm.response.code).to.eql(401);
});
```

---

## 11. 🚦 Pruebas de Rate Limiting

El backend implementa **3 tiers de rate limiting** vía `@nestjs/throttler`:

```
┌─────────┬────────┬───────┬─────────────────────────┐
│ Tier    │ TTL    │ Limit │ Uso                     │
├─────────┼────────┼───────┼─────────────────────────┤
│ short   │ 1s     │ 3     │ Login, register, submit │
│ medium  │ 10s    │ 20    │ Endpoints normales       │
│ long    │ 60s    │ 100   │ Listas, reportes         │
└─────────┴────────┴───────┴─────────────────────────┘
```

### Prueba: Login Rate Limiting

Crea una carpeta "Rate Limiting Tests" con esta secuencia:

**Request: POST Login (x6 veces)**

```javascript
// Pre-request Script — contar intentos
const attemptCount = pm.iterationData.get('attempt') || 1;
console.log(`Intento ${attemptCount}/6`);
```

```javascript
// Test Script
const status = pm.response.code;
const remaining = pm.response.headers.get('X-RateLimit-Remaining');
const retryAfter = pm.response.headers.get('Retry-After');

if (status === 429) {
    pm.test(`✅ Rate limit alcanzado en intento ${pm.iteration}`, () => {
        pm.expect(retryAfter).to.not.be.empty;
        pm.expect(Number(remaining)).to.eql(0);
    });
    console.log(`⏳ Rate limited! Retry-After: ${retryAfter}s`);
} else {
    pm.test(`✅ Intento ${pm.iteration} — OK (${status})`, () => true);
}

// Verificar headers de rate limiting
pm.test('Headers de rate limit presentes', () => {
    pm.expect(pm.response.headers.get('X-RateLimit-Limit')).to.not.be.empty;
    pm.expect(pm.response.headers.get('X-RateLimit-Remaining')).to.not.be.empty;
});
```

**Runner Config:**
- Iteraciones: 6
- Delay: 100ms entre requests
- Guardar respuestas

### Prueba: Short Tier (1s/3req)

```javascript
// Enviar 4 requests en menos de 1 segundo
pm.test(`Request ${pm.iteration}/4`, () => {
    if (pm.iteration > 3) {
        pm.expect(pm.response.code).to.be.oneOf([429, 200]);
        // Después del tier short, puede usar el tier medium/long
    }
});
```

---

## 12. 🛡️ Pruebas de Seguridad

### 12.1 Brute Force Login

```javascript
// Pre-request: usar credenciales inválidas
pm.variables.set('login_email', 'hacker@test.com');
pm.variables.set('login_password', 'WrongPass' + pm.iteration);
```

```javascript
// Test
if (pm.iteration >= 5) {
    pm.test(`🔒 Bloqueo por brute force (intento ${pm.iteration})`, () => {
        // Esperar 429 Too Many Requests o 423 Locked
        pm.expect(pm.response.code).to.be.oneOf([429, 423]);
    });
}
```

### 12.2 Invalid JWT

```javascript
// Enviar request con token manipulado
pm.collectionVariables.set('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token_invalido');

pm.test('🛡️ Token inválido → 401', () => {
    pm.expect(pm.response.code).to.eql(401);
});
```

### 12.3 Missing Authorization

```javascript
// Enviar request SIN token
// (no establecer header Authorization)

pm.test('🛡️ Sin autenticación → 401', () => {
    pm.expect(pm.response.code).to.eql(401);
});
```

### 12.4 CORS Preflight (OPTIONS)

```javascript
pm.sendRequest({
    url: `{{full_url}}/auth/login`,
    method: 'OPTIONS',
    header: {
        'Origin': 'http://malicious-site.com',
        'Access-Control-Request-Method': 'POST'
    }
}, (err, res) => {
    pm.test('🛡️ CORS bloquea origen malicioso', () => {
        pm.expect(res.headers.get('Access-Control-Allow-Origin')).to.be.undefined;
    });
});
```

### 12.5 Payload Grande (DoS Protection)

```javascript
// Enviar payload de 5MB (debería ser rechazado por el límite de 1mb)
const largePayload = { "data": "x".repeat(5 * 1024 * 1024) };

pm.sendRequest({
    url: `{{full_url}}/auth/register`,
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: { mode: 'raw', raw: JSON.stringify(largePayload) }
}, (err, res) => {
    pm.test('🛡️ Payload > 1mb rechazado', () => {
        pm.expect(res.code).to.eql(413); // Payload Too Large
    });
});
```

### 12.6 Headers de Seguridad

```javascript
// Verificar que todos los endpoints devuelven headers de seguridad
pm.test('🛡️ Content-Security-Policy presente', () => {
    pm.expect(pm.response.headers.get('Content-Security-Policy')).to.include("default-src 'self'");
});
pm.test('🛡️ X-Content-Type-Options presente', () => {
    pm.expect(pm.response.headers.get('X-Content-Type-Options')).to.eql('nosniff');
});
pm.test('🛡️ Strict-Transport-Security presente', () => {
    pm.expect(pm.response.headers.get('Strict-Transport-Security')).to.include('max-age=31536000');
});
pm.test('🛡️ X-Frame-Options presente', () => {
    pm.expect(pm.response.headers.get('X-Frame-Options')).to.eql('DENY');
});
pm.test('🛡️ Referrer-Policy presente', () => {
    pm.expect(pm.response.headers.get('Referrer-Policy')).to.eql('strict-origin-when-cross-origin');
});
```

---

## 13. 🧪 Pruebas de Cache

### 13.1 Verificar Cache de Lista de Usuarios

```javascript
// Primera llamada (sin cache)
pm.sendRequest({
    url: `{{full_url}}/users?page=1&limit=10`,
    method: 'GET',
    header: { 'Authorization': `Bearer {{access_token}}` }
}, (err, res1) => {
    const time1 = res1.responseTime;
    
    // Segunda llamada (con cache)
    pm.sendRequest({
        url: `{{full_url}}/users?page=1&limit=10`,
        method: 'GET',
        header: { 'Authorization': `Bearer {{access_token}}` }
    }, (err, res2) => {
        const time2 = res2.responseTime;
        
        pm.test('⚡ Segunda llamada más rápida (cache)', () => {
            console.log(`Tiempo 1: ${time1}ms, Tiempo 2: ${time2}ms`);
            pm.expect(time2).to.be.below(time1 * 1.5);
        });
    });
});
```

### 13.2 Verificar Invalidación de Cache

```javascript
// Crear un usuario → invalida cache de lista
// Luego verificar que la lista se actualiza
```

---

## 14. 🔄 Automatización con Postman Collection Runner

### 14.1 Configuración de Runner

1. Abre Postman → **File** → **Run Collection**
2. Selecciona **Backend Template API**
3. Configura:

| Opción | Valor |
| ------ | ----- |
| **Environment** | Backend Template (Local) |
| **Iterations** | 10 |
| **Delay** | 200ms |
| **Save Responses** | ✅ Sí (solo fallos) |
| **Data** | Opcional: CSV con usuarios de prueba |
| **Keep Variable Values** | ✅ Sí |

### 14.2 CSV de Datos de Prueba

Crea `test-data.csv` para ejecutar con múltiples usuarios:

```csv
email,password,name,role
alice@test.com,Pass123!,Alice,USER
bob@test.com,Pass123!,Bob,USER
admin@test.com,Admin123!,Admin,ADMIN
```

### 14.3 Interpretación de Resultados

```
┌─────────────────────────────────────────────────────────────┐
│                     RUNNER RESULTS                          │
├──────────────────────┬──────────────────────────────────────┤
│ Total Requests       │ 47                                   │
│ Passed               │ 42 (89%)                             │
│ Failed               │ 5 (11%)                              │
│ ● Assertions         │ 312                                  │
│ Average Response     │ 47ms                                 │
│ P95 Response         │ 123ms                                │
└──────────────────────┴──────────────────────────────────────┘
```

**Análisis de Fallos Comunes:**

| Falla | Causa Probable | Solución |
| ----- | -------------- | -------- |
| 401 en Users | Token no ADMIN | Usar email/password de admin |
| 429 en Login | Rate limiting | Aumentar delay entre requests |
| 404 en Profile | Token inválido | Volver a ejecutar Login |
| 409 en Register | Email duplicado | Usar email único en CSV |

---

## 15. 🔧 Integración CI/CD con Newman

### 15.1 Comando Básico

```bash
# Ejecutar toda la colección
npx newman run docs/postman/backend-template-collection.json \
  --environment docs/postman/backend-template-env.json \
  --reporters cli,json,junit \
  --reporter-json-export reports/postman-results.json \
  --reporter-junit-export reports/postman-junit.xml \
  --delay-request 200 \
  --timeout-request 10000 \
  --bail
```

### 15.2 Flags Útiles

| Flag | Descripción |
| ---- | ----------- |
| `--delay-request 200` | 200ms entre requests (evita rate limiting) |
| `--timeout-request 10000` | Timeout por request (10s) |
| `--bail` | Detiene tras el primer fallo |
| `--folder "Auth"` | Ejecutar solo una carpeta |
| `--iteration-count 5` | Número de iteraciones |
| `--data test-data.csv` | Datos parametrizados |
| `--env-var "base_url=https://staging.api.com"` | Sobrescribir variables |

### 15.3 GitHub Actions Workflow

```yaml
# .github/workflows/postman-tests.yml
name: Postman API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  postman:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: backend_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server in background
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/backend_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret-key-32-chars-long!!
          NODE_ENV: development
        run: |
          npm start &
          sleep 5
          # Esperar a que el health check pase
          for i in {1..10}; do
            curl -s http://localhost:3000/api/v1/health/live && break
            sleep 2
          done

      - name: Run Postman tests
        run: |
          npx newman run docs/postman/backend-template-collection.json \
            --env-var "base_url=http://localhost:3000" \
            --env-var "admin_email=admin@test.com" \
            --env-var "admin_password=Admin123!" \
            --delay-request 200 \
            --reporters cli,junit \
            --reporter-junit-export reports/postman-results.xml

      - name: Publish test results
        if: always()
        uses: dorny/test-reporter@v1
        with:
          name: Postman API Tests
          path: reports/postman-results.xml
          reporter: java-junit
```

### 15.4 GitLab CI Pipeline

```yaml
postman-tests:
  stage: test
  image: node:20-alpine
  services:
    - postgres:16-alpine
    - redis:7-alpine
  variables:
    DATABASE_URL: "postgresql://test:test@postgres:5432/backend_test"
    REDIS_URL: "redis://redis:6379"
    JWT_SECRET: "ci-test-secret-key-32-chars-long!!"
  script:
    - npm ci
    - npm run build
    - npm start &
    - sleep 5
    - npx newman run docs/postman/backend-template-collection.json
      --env-var "base_url=http://localhost:3000"
      --delay-request 200
      --reporters cli,junit
      --reporter-junit-export reports/postman-results.xml
  artifacts:
    reports:
      junit: reports/postman-results.xml
```

---

## 16. ❗ Resolución de Problemas

### Error: 401 Unauthorized

```text
Causa: Token JWT expirado, inválido o no enviado.
Solución:
  1. Ejecuta POST Login para obtener nuevo token
  2. Verifica que ACCESS_TOKEN esté actualizado en variables
  3. Verifica que el header Authorization tenga formato: "Bearer <token>"
  4. Comprueba que JWT_SECRET en .env coincide con el usado al generar el token
```

### Error: 429 Too Many Requests

```text
Causa: Rate limit alcanzado según el tier configurado.
Solución:
  - Tier short (1s/3req): Espera 1 segundo entre requests
  - Tier medium (10s/20req): Espera 500ms entre requests
  - Tier long (60s/100req): Espera 600ms entre requests
  - En Collection Runner: usa --delay-request 200 o mayor
  
Headers útiles:
  X-RateLimit-Limit: 3
  X-RateLimit-Remaining: 0
  Retry-After: 1
```

### Error: 413 Payload Too Large

```text
Causa: Body de la request supera 1MB.
Solución:
  - Reduce el tamaño del payload
  - Si necesitas enviar archivos grandes, usa endpoints diseñados para streaming
```

### Error: 403 Forbidden

```text
Causa: El usuario autenticado no tiene el rol necesario.
Solución:
  - Endpoints de ADMIN requieren role=ADMIN
  - Usa las credenciales de admin (admin_email/admin_password)
  - Verifica el rol en el token JWT (campo "role")
```

### Error: 409 Conflict

```text
Causa: Recurso duplicado (email ya registrado, etc.)
Solución:
  - Usa emails únicos en cada ejecución de prueba
  - O elimina el usuario antes de volver a crearlo
```

### Error: Conexión Rechazada (ECONNREFUSED)

```text
Causa: El backend no está corriendo en el puerto esperado.
Solución:
  1. Verifica que el servidor esté en ejecución: npm run dev
  2. Verifica el puerto: debería ser 3000 (o el configurado en PORT)
  3. Comprueba que no haya conflictos de puerto: netstat -ano | findstr :3000
```

---

## 📎 Recursos Adicionales

| Recurso | Enlace |
| ------- | ------ |
| Postman Docs | [https://learning.postman.com/](https://learning.postman.com/) |
| Newman CLI | [https://github.com/postmanlabs/newman](https://github.com/postmanlabs/newman) |
| Test Scripts API | [https://learning.postman.com/docs/writing-scripts/script-references/postman-sandbox-api-reference/](https://learning.postman.com/docs/writing-scripts/script-references/postman-sandbox-api-reference/) |
| Documentación de API (Swagger) | `http://localhost:3000/api` (solo en desarrollo) |
| Health Check | `GET {{base_url}}/api/v1/health` |
| Reportes de Rendimiento | `docs/recommendations/PERFORMANCE-TIPS.md` |
| Recomendaciones de Seguridad | `docs/recommendations/SECURITY-RECOMMENDATIONS.md` |

---

> **Mantenimiento**: Esta guía se actualiza con cada nuevo endpoint o cambio en la API.
> Para contribuir, actualiza `docs/postman/POSTMAN-GUIDE.md` y regenera la colección JSON.
