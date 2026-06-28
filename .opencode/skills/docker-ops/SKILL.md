---
name: docker-ops
description: Monitorear, diagnosticar y gestionar operaciones de contenedores Docker
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: operations
---

## What I do

- Monitorear estado, recursos y salud de todos los contenedores del stack
- Diagnosticar problemas como OOM kills, restart loops y resource limits
- Ejecutar reinicios seguros con verificación de salud post-reinicio
- Agregar logs de contenedores vía Promtail a Loki
- Gestionar redes, volúmenes y límites de recursos por servicio

## When to use me

Use this when a container fails a health check, enters a restart loop, uses excessive resources, or needs diagnosis. Also for inspecting logs across all services.
