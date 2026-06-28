---
name: auto-recovery
description: Implementar recuperación automática segura del sistema
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: operations
---

## What I do

- Reintentar operaciones fallidas con backoff exponencial y circuit breaker
- Reconectar servicios dependientes caídos (PostgreSQL, Redis, BullMQ)
- Reiniciar servicios con health check verification post-recovery
- Activar fallbacks cuando servicios primarios no están disponibles
- Escalar a humanos cuando el recovery automático falla

## When to use me

Use this when a service, database, cache, or queue goes down or degrades and automatic recovery should be attempted before human intervention. Triggers on health check failures and connection errors.
