# Nombre

Docker Operations Skill

# Objetivo

Monitorear, diagnosticar y gestionar operaciones de contenedores Docker en el sistema backend-template, incluyendo health checks, reinicios, diagnóstico de contenedores, agregación de logs y gestión del ciclo de vida de los servicios orquestados por docker-compose.

# Responsabilidades

- **Monitoreo de Contenedores**: Monitorear estado, recursos y salud de todos los contenedores (main, auth-service, users-service, notifications-service, postgres, redis, grafana, prometheus, loki, promtail, jaeger, nginx).
- **Health Checks**: Gestionar y monitorear health checks configurados en docker-compose.yml, detectar fallos y trigger acciones de recuperación.
- **Reinicio de Contenedores**: Ejecutar reinicios seguros de contenedores con estrategias de backoff, verificación de salud post-reinicio y rollback si es necesario.
- **Diagnóstico Docker**: Diagnosticar problemas de contenedores (OOM kills, restart loops, resource limits, network issues, volume mounts).
- **Agregación de Logs**: Agregar y correlacionar logs de todos los contenedores vía Promtail → Loki, con filtros por servicio, nivel y período.
- **Gestión de Recursos**: Monitorear y ajustar límites de recursos (CPU, memoria) por contenedor, detectar contenedores sin límites adecuados.
- **Gestión de Red**: Diagnosticar problemas de red entre contenedores (DNS, connectivity, ports, backend network).
- **Gestión de Volúmenes**: Monitorear uso de volúmenes Docker (postgres-data, redis-data, grafana-data, prometheus-data, loki-data), detectar llenado.

# Inputs

- Docker CLI commands (docker ps, docker stats, docker inspect, docker logs)
- Health check results de docker-compose.yml
- Métricas de contenedores desde Prometheus (cAdvisor)
- Logs de contenedores vía Promtail
- Estado de servicios desde docker-compose ps
- Eventos de Docker (start, stop, die, restart, health_status)
- Resource usage por contenedor (CPU, memory, network, disk)
- Network connectivity entre contenedores

# Outputs

- Estado de salud de todos los contenedores
- Diagnósticos de problemas de contenedores
- Logs agregados y filtrados por servicio
- Recomendaciones de reinicio o recuperación
- Alertas de contenedores unhealthy o en restart loop
- Reportes de uso de recursos por contenedor
- Acciones de recuperación ejecutadas (restart, scale, recreate)

# Herramientas usadas

- **Docker CLI**: docker ps, docker stats, docker inspect, docker logs, docker restart
- **Docker Compose**: docker compose up, down, restart, ps, logs
- **Prometheus** (puerto 9090): Métricas de contenedores vía cAdvisor
- **Loki** (puerto 3100): Almacenamiento de logs de contenedores
- **Promtail**: Agente de recolección de logs de contenedores
- **docker-compose.yml**: Configuración de servicios, health checks, redes, volúmenes
- **shared-logger** (packages/shared-logger): Logging de operaciones Docker
- **shared-telemetry** (packages/shared-telemetry): Métricas de aplicación en contenedores
- **Grafana** (puerto 3000): Dashboards de contenedores
- **Auto-Recovery Skill**: Trigger de recovery actions

# Workflows

## Workflow 1: Monitoreo de Salud de Contenedores

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Consultar  │───▶│  Evaluar    │───▶│  Detectar    │───▶│  Analizar    │───▶│  Accionar   │
│  Estado de  │    │  Health     │    │  Anomalías   │    │  Causa Raíz  │    │  si Necesario│
│  Contenedor │    │  Checks     │    │              │    │              │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
       │                    │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼                    ▼
  docker ps,         Verificar health     Unhealthy,           Revisar logs,        Restart, scale,
  docker inspect,    check status,        restart loop,        métricas, config     recreate, alert
  health endpoint    uptime, restarts     OOM killed,          de health check
                                          resource limit       del servicio
```

### Health Checks Configurados:

| Servicio | Health Check | Interval | Timeout | Retries | Start Period |
|----------|-------------|----------|---------|---------|--------------|
| main | wget /api/v1/health | 30s | 10s | 3 | 40s |
| postgres | pg_isready -U postgres | 10s | 5s | 5 | 10s |
| redis | redis-cli ping | 10s | 5s | 5 | 10s |
| auth-service | HTTP health endpoint | 30s | 10s | 3 | 40s |
| users-service | HTTP health endpoint | 30s | 10s | 3 | 40s |
| notifications-service | HTTP health endpoint | 30s | 10s | 3 | 40s |

## Workflow 2: Reinicio Seguro de Contenedor

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Detectar   │───▶│  Verificar  │───▶│  Ejecutar    │───▶│  Verificar   │───▶│  Confirmar  │
│  Necesidad  │    │  Dependencias│    │  Reinicio    │    │  Salud Post  │    │  Recuperación│
│  de Reinicio│    │  y Impacto  │    │  con Backoff │    │  Reinicio    │    │             │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Pasos detallados:

1. **Detectar**: Contenedor unhealthy, restart loop, OOM killed, o trigger manual
2. **Verificar**: Identificar dependencias (depends_on), evaluar impacto en servicios downstream
3. **Ejecutar**: docker compose restart <service> con backoff exponencial si falla
4. **Verificar**: Esperar health check pass, verificar logs de startup sin errores
5. **Confirmar**: Verificar servicio respondiendo correctamente, monitorear 5 minutos

## Workflow 3: Diagnóstico de Contenedor

```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Contenedor │───▶│  Inspeccionar│───▶│  Analizar    │───▶│  Correlar    │───▶│  Diagnosticar│
│  Problemático│   │  Configuración│   │  Logs y      │    │  con Métricas│    │  y Recomendar│
│             │    │  y Estado    │    │  Eventos     │    │  y Dependencias│  │  Solución   │
└─────────────┘    └─────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
```

### Problemas Comunes y Diagnóstico:

| Problema | Síntoma | Diagnóstico | Solución |
|----------|---------|-------------|----------|
| OOM Kill | Container died, exit code 137 | docker inspect → OOMKilled: true | Aumentar memory limit, fix memory leak |
| Restart Loop | Restarting state, high restart count | docker logs → error en startup | Fix error de configuración o código |
| Health Check Fail | unhealthy status | docker inspect → Health.Status | Verificar endpoint de health, dependencias |
| Network Issue | Cannot connect to other services | docker exec → ping/curl | Verificar redes, DNS, puertos |
| Volume Full | Disk usage high, write errors | docker system df | Limpiar volúmenes, aumentar disco |
| Port Conflict | Cannot start, port in use | docker ps → port mapping | Liberar puerto, cambiar mapping |

# Casos de uso

## Caso 1: Contenedor Unhealthy - Auto Recovery

**Escenario**: main container falla health check 3 veces consecutivas.

**Flujo**:
1. Docker marca contenedor como unhealthy después de 3 fallos
2. Docker Ops detecta estado unhealthy
3. Verifica logs: error de conexión a PostgreSQL
4. Verifica dependencias: postgres container está healthy
5. Diagnóstico: main no puede conectar a postgres por red
6. Acción: restart main container
7. Verifica health check post-reinicio: pass
8. Confirma servicio respondiendo en puerto 3010

**Output**:
```json
{
  "containerId": "abc123def456",
  "service": "main",
  "issue": "health_check_failure",
  "diagnosis": {
    "status": "unhealthy",
    "failedChecks": 3,
    "lastError": "Connection refused to postgres:5432",
    "rootCause": "Network connectivity issue between main and postgres",
    "dependencies": {
      "postgres": "healthy",
      "redis": "healthy"
    }
  },
  "action": {
    "type": "restart",
    "command": "docker compose restart main",
    "result": "success",
    "postRestartHealth": "healthy",
    "recoveryTime": "45s"
  },
  "timestamp": "2026-05-21T10:15:00.000Z"
}
```

## Caso 2: OOM Kill en auth-service

**Escenario**: auth-service killed por OOM, exit code 137.

**Flujo**:
1. Docker Ops detecta contenedor died con OOMKilled: true
2. Analiza memory usage pre-kill: 512MB (límite alcanzado)
3. Revisa logs: memory leak en session cache
4. Recomienda: aumentar límite a 1GB + fix memory leak
5. Ejecuta restart con nuevo límite
6. Monitorea memory usage post-reinicio

## Caso 3: Diagnóstico de Red entre Contenedores

**Escenario**: users-service no puede conectar a postgres.

**Flujo**:
1. Docker Ops ejecuta diagnóstico de red
2. Verifica que ambos contenedores están en red "backend"
3. Ejecuta ping desde users-service a postgres: exitoso
4. Ejecuta curl al health endpoint de postgres: exitoso
5. Verifica credenciales de conexión: incorrectas
6. Diagnóstico: variable de entorno DATABASE_URL incorrecta
7. Solución: corregir .env y recrear contenedor

# Alertas

- **CRITICAL**: Contenedor de servicio principal (main, postgres, redis) down → Alerta inmediata
- **HIGH**: Contenedor en restart loop (>3 restarts en 5 min) → Alerta inmediata
- **HIGH**: OOM kill en cualquier contenedor → Alerta inmediata
- **MEDIUM**: Health check fail (>2 intentos fallidos) → Alerta en 1 minuto
- **MEDIUM**: Uso de volumen >80% → Alerta de disco
- **LOW**: Contenedor usando >90% de CPU limit → Alerta de recursos
- **LOW**: Contenedor sin health check configurado → Registro para mejora
- **INFO**: Contenedor reiniciado exitosamente → Logging

# Integraciones

- **Auto-Recovery Skill**: Trigger de recovery actions para contenedores problemáticos
- **Runtime Monitoring Agent**: Recibe alertas de contenedores unhealthy
- **Incident Response Skill**: Crea incidentes para fallos de contenedores críticos
- **Diagnostics Skill**: Proporciona diagnóstico de contenedores
- **Observability Skill**: Logs de contenedores vía Promtail → Loki
- **Prometheus**: Métricas de contenedores vía cAdvisor
- **Grafana**: Dashboards de contenedores
- **Docker Compose**: Orquestación de servicios
- **shared-logger**: Logging de operaciones Docker

# Ejemplos

## Ejemplo 1: Diagnóstico Docker Completo

```bash
# Estado de todos los contenedores
docker compose ps

# Recursos en tiempo real
docker stats --no-stream

# Logs de un servicio específico
docker compose logs --tail=100 main

# Inspección detallada de un contenedor
docker inspect backend-template-main-1

# Health check status
docker inspect --format='{{.State.Health.Status}}' backend-template-main-1

# Verificar red
docker network inspect backend-template_backend

# Uso de volúmenes
docker system df -v
```

## Ejemplo 2: Script de Health Check

```bash
#!/bin/bash
# docker-health-check.sh

SERVICES=("main" "auth-service" "users-service" "notifications-service" "postgres" "redis")
UNHEALTHY=()

for service in "${SERVICES[@]}"; do
  status=$(docker inspect --format='{{.State.Health.Status}}' "backend-template-${service}-1" 2>/dev/null)

  if [ "$status" = "unhealthy" ]; then
    UNHEALTHY+=("$service")
    echo "❌ $service: unhealthy"

    # Get last error
    last_log=$(docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "backend-template-${service}-1" | tail -1)
    echo "   Last error: $last_log"
  elif [ "$status" = "healthy" ]; then
    echo "✅ $service: healthy"
  else
    echo "⚠️  $service: $status"
  fi
done

if [ ${#UNHEALTHY[@]} -gt 0 ]; then
  echo ""
  echo "Unhealthy services: ${UNHEALTHY[*]}"
  echo "Consider running: docker compose restart ${UNHEALTHY[*]}"
  exit 1
fi

echo ""
echo "All services healthy ✅"
exit 0
```

## Ejemplo 3: Query PromQL para Contenedores

```promql
# CPU usage por contenedor
rate(container_cpu_usage_seconds_total{container=~"main|auth-service|users-service|notifications-service"}[5m]) * 100

# Memory usage por contenedor
container_memory_usage_bytes{container=~"main|auth-service|users-service|notifications-service"} / 1024 / 1024

# Container restart count
increase(container_restart_count{container=~"main|auth-service|users-service|notifications-service"}[1h])

# Network I/O por contenedor
rate(container_network_receive_bytes_total{container="main"}[5m])
rate(container_network_transmit_bytes_total{container="main"}[5m])

# Container health status (via custom metric)
container_health_status{container="main"}
```

## Ejemplo 4: Restart con Backoff

```bash
#!/bin/bash
# safe-restart.sh

SERVICE=$1
MAX_RETRIES=3
BACKOFF=5

for i in $(seq 1 $MAX_RETRIES); do
  echo "Restarting $service (attempt $i/$MAX_RETRIES)..."
  docker compose restart "$SERVICE"

  # Wait for health check
  sleep $BACKOFF

  status=$(docker inspect --format='{{.State.Health.Status}}' "backend-template-${SERVICE}-1" 2>/dev/null)

  if [ "$status" = "healthy" ]; then
    echo "✅ $SERVICE is healthy after restart"
    exit 0
  fi

  # Exponential backoff
  BACKOFF=$((BACKOFF * 2))
  echo "⚠️  $SERVICE not healthy yet, waiting ${BACKOFF}s before retry..."
  sleep $BACKOFF
done

echo "❌ $SERVICE failed to become healthy after $MAX_RETRIES attempts"
exit 1
```
