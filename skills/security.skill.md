# Nombre

Security Skill

# Objetivo

Implementar y gestionar la seguridad del sistema backend-template mediante sanitización de inputs, detección de secretos, análisis de anomalías de autenticación, detección de requests sospechosos y prevención de abuso para proteger los servicios y datos del sistema.

# Responsabilidades

- **Sanitización de Inputs**: Validar y sanitizar todos los inputs de usuario (request bodies, query params, headers, path params) para prevenir injection attacks (SQL injection, XSS, command injection).
- **Detección de Secretos**: Escanear código, logs, variables de entorno y configuraciones para detectar secretos expuestos (API keys, tokens, contraseñas, certificates).
- **Análisis de Anomalías de Autenticación**: Detectar patrones anómalos en autenticación (brute force, credential stuffing, token manipulation, session hijacking) en auth-service.
- **Detección de Requests Sospechosos**: Identificar requests con patrones sospechosos (rate abuse, path traversal, header manipulation, bot behavior) en nginx gateway y servicios.
- **Detección de Abuso**: Detectar patrones de abuso del sistema (API scraping, spam, resource exhaustion, account takeover attempts) y trigger acciones de mitigación.
- **Auditoría de Acceso**: Mantener logs de auditoría de accesos a datos sensibles, cambios de permisos y operaciones privilegiadas.
- **Vulnerability Scanning**: Escanear dependencias npm/pnpm para vulnerabilidades conocidas y recomendar actualizaciones.
- **Security Headers**: Verificar y mantener security headers HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) en nginx gateway.

# Inputs

- Requests HTTP entrantes (headers, body, query params, path params)
- Logs de autenticación desde auth-service (login attempts, token validation, session management)
- Logs de aplicación desde shared-logger
- Código fuente para escaneo de secretos
- Variables de entorno y archivos de configuración
- Métricas de rate limiting desde nginx
- Alertas de vulnerabilidades de dependencias (npm audit)
- Patrones de acceso a endpoints sensibles
- Datos de auditoría de accesos

# Outputs

- Reportes de sanitización de inputs con vulnerabilidades detectadas
- Alertas de secretos expuestos con ubicación y recomendaciones
- Reportes de anomalías de autenticación con patrones detectados
- Alertas de requests sospechosos con detalles y acciones de mitigación
- Reportes de detección de abuso con patrones y recomendaciones
- Logs de auditoría de accesos
- Reportes de vulnerabilidades de dependencias
- Recomendaciones de hardening de seguridad

# Herramientas usadas

- **class-validator** + **class-transformer**: Validación de inputs en NestJS DTOs
- **helmet**: Security headers para Express/NestJS
- **bcrypt**: Hashing de contraseñas
- **jsonwebtoken**: Validación y verificación de JWT tokens
- **rate-limiter-flexible**: Rate limiting en aplicación
- **Nginx**: Rate limiting, security headers, IP blocking en gateway
- **npm audit / pnpm audit**: Escaneo de vulnerabilidades de dependencias
- **shared-logger** (packages/shared-logger): Logging de seguridad y auditoría
- **Redis** (puerto 6379): Rate limiting counters, session storage, block lists
- **PostgreSQL** (puerto 5432): Audit logs, blocked IPs, security events
- **Prisma**: ORM para consultas de audit logs

# Workflows

## Workflow 1: Sanitización de Inputs

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Request    │───▶│  Validar    │───▶│  Sanitizar   │───▶│  Verificar   │───▶│  Procesar   │
│  Recibido   │    │  Schema     │    │  y Escapar   │    │  Seguridad   │    │  o Rechazar │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  Nginx recibe       class-validator      Escape HTML,          Verificar patrones   Si pasa todas las
  request, parse       valida contra        SQL injection,       de ataque, rate      validaciones,
  body/params        DTO schema             command injection    limit, IP block      procesar request
```

### Pasos detallados:

1. **Validar Schema**: class-validator valida request body contra DTO con decorators (@IsString, @IsEmail, @MaxLength, etc.)
2. **Sanitizar**: class-transformer sanitiza inputs (strip HTML tags, escape special chars, normalize strings)
3. **Verificar Seguridad**: Verificar patrones de ataque (SQL injection patterns, XSS payloads, path traversal)
4. **Rate Limit**: Verificar rate limit para IP y endpoint
5. **Procesar o Rechazar**: Si todas las validaciones pasan, procesar; si no, rechazar con 400/403/429

## Workflow 2: Detección de Secretos

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Escanear   │───▶│  Identificar│───▶│  Verificar   │───▶│  Clasificar  │───▶│  Reportar y │
│  Código y   │    │  Patrones   │    │  si es       │    │  Severidad   │    │  Remediar   │
│  Config     │    │  de Secretos│    │  Verdadero   │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Patrones de Secretos:

| Tipo | Patrón | Ejemplo | Severidad |
|------|--------|---------|-----------|
| API Key | `AIza[0-9A-Za-z_-]{35}` | Google API Key | CRITICAL |
| AWS Key | `AKIA[0-9A-Z]{16}` | AWS Access Key | CRITICAL |
| Private Key | `-----BEGIN (RSA|EC|DSA) PRIVATE KEY-----` | PEM Private Key | CRITICAL |
| JWT Secret | `jwt.*secret|JWT_SECRET` | Environment variable | HIGH |
| Database URL | `postgresql://.*:.*@` | Connection string | HIGH |
| Generic Token | `[a-zA-Z0-9]{32,}` | Long alphanumeric | MEDIUM |

## Workflow 3: Detección de Anomalías de Autenticación

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Monitorear │───▶│  Analizar   │───▶│  Detectar    │───▶│  Evaluar     │───▶│  Accionar   │
│  Eventos    │    │  Patrones   │    │  Anomalías   │    │  Riesgo      │    │  si Necesario│
│  de Auth    │    │  de Acceso  │    │              │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Anomalías Detectables:

| Anomalía | Patrón | Umbral | Acción |
|----------|--------|--------|--------|
| Brute Force | Failed logins desde misma IP | >10 en 5 min | Block IP 30 min |
| Credential Stuffing | Failed logins para muchos usuarios | >50 users en 10 min | Block IP, alert |
| Token Manipulation | JWT con signature inválida | >5 en 1 min | Log, monitor |
| Session Hijacking | Same token, different IP | 1 occurrence | Invalidate session |
| Account Takeover | Password change + login from new location | 1 occurrence | Alert user, require 2FA |

# Casos de uso

## Caso 1: Detección de Brute Force

**Escenario**: 50 intentos de login fallidos desde misma IP en 5 minutos.

**Flujo**:
1. Auth-service registra failed login attempts con IP
2. Security detecta patrón: 50 failed logins desde 192.168.1.100 en 5 min
3. Verifica: todos para diferentes usernames (credential stuffing)
4. Acción: block IP en Redis block list, notificar en Slack
5. IP bloqueada por 30 minutos, todos los requests rechazados con 403

**Output**:
```json
{
  "securityEventId": "sec-20260521-001",
  "type": "CREDENTIAL_STUFFING",
  "severity": "HIGH",
  "timestamp": "2026-05-21T10:15:00.000Z",
  "source": {
    "ip": "192.168.1.100",
    "userAgent": "python-requests/2.28.0",
    "country": "Unknown"
  },
  "details": {
    "failedAttempts": 50,
    "uniqueUsernames": 47,
    "timeWindow": "5 minutes",
    "pattern": "Multiple failed logins for different usernames from same IP"
  },
  "actions": [
    { "type": "block_ip", "target": "192.168.1.100", "duration": "30 minutes" },
    { "type": "alert", "channel": "slack-security" },
    { "type": "log", "destination": "audit_logs" }
  ],
  "riskScore": 85
}
```

## Caso 2: Detección de Secreto Expuesto

**Escenario**: API key de Google expuesta en commit de código.

**Flujo**:
1. Security scan detecta patrón `AIza...` en archivo de código
2. Verifica: es una API key real de Google Maps
3. Clasifica: CRITICAL (puede generar costos no autorizados)
4. Acción: alertar equipo, rotar key, remover del código
5. Prevención: agregar regla de pre-commit hook para detectar secretos

## Caso 3: SQL Injection Attempt

**Escenario**: Request con payload de SQL injection en query param.

**Flujo**:
1. Request: GET /api/v1/users?search=' OR 1=1 --
2. class-validator rechaza: input no cumple con schema (debe ser string alfanumérico)
3. Security detecta patrón de SQL injection en input
4. Rechaza con 400 Bad Request, loggea intento
5. Si múltiples intentos desde misma IP, bloquea IP

# Alertas

- **CRITICAL**: Secreto expuesto en código o logs → Alerta inmediata, rotar secreto
- **CRITICAL**: SQL injection o command injection detectado → Alerta inmediata, bloquear IP
- **HIGH**: Brute force o credential stuffing detectado → Alerta, bloquear IP
- **HIGH**: Vulnerabilidad crítica en dependencia → Alerta, actualizar dependencia
- **MEDIUM**: Rate limit exceeded frecuentemente → Alerta, revisar reglas
- **MEDIUM**: Session hijacking detectado → Alerta, invalidar sesión
- **LOW**: Pattern de XSS detectado y bloqueado → Logging
- **INFO**: Security scan completado sin hallazgos → Logging

# Integraciones

- **auth-service**: Eventos de autenticación para análisis de anomalías
- **shared-logger**: Logging de seguridad y auditoría
- **shared-telemetry**: Métricas de seguridad
- **Incident Response Skill**: Incidentes de seguridad para gestión
- **Error Analysis Skill**: Errores de seguridad para análisis
- **Nginx Gateway**: Rate limiting, security headers, IP blocking
- **Redis**: Rate limiting counters, block lists, session storage
- **PostgreSQL/Prisma**: Audit logs, security events
- **npm/pnpm audit**: Vulnerabilidades de dependencias

# Ejemplos

## Ejemplo 1: Validación de Input con class-validator

```typescript
// main/src/users/dto/create-user.dto.ts
import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s-']+$/, {
    message: 'Name can only contain letters, spaces, hyphens and apostrophes',
  })
  name: string;
}
```

## Ejemplo 2: Rate Limiting con Redis

```typescript
// main/src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimiter: RateLimiterRedis;

  constructor() {
    const redisClient = new Redis(process.env.REDIS_URL);
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate-limit',
      points: 100, // 100 requests
      duration: 60, // per 60 seconds
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;

    try {
      await this.rateLimiter.consume(ip);
      return true;
    } catch (rejRes) {
      throw new HttpException('Too Many Requests', 429);
    }
  }
}
```

## Ejemplo 3: Security Headers en Nginx

```nginx
# gateway/nginx.conf
server {
    listen 80;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # Block common attack patterns
    location ~* (\.\.|/etc/|/proc/|/sys/) {
        return 403;
    }
}
```

## Ejemplo 4: Audit Logging

```typescript
// main/src/common/services/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(event: AuditEvent) {
    await this.prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        eventType: event.type,
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        details: event.details,
        severity: event.severity,
      },
    });
  }
}

// Usage:
await this.auditService.log({
  type: 'AUTH',
  userId: 'user-123',
  action: 'LOGIN_SUCCESS',
  resource: 'auth-service',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  details: { method: 'email' },
  severity: 'INFO',
});
```

## Ejemplo 5: npm Audit Automation

```bash
# Check for vulnerabilities
pnpm audit --audit-level=high

# Auto-fix vulnerabilities
pnpm audit fix

# Check in CI/CD
pnpm audit --audit-level=moderate --prod
if [ $? -ne 0 ]; then
  echo "Security vulnerabilities detected!"
  exit 1
fi
```
