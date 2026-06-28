---
name: incident-response
description: Gestionar el ciclo de vida completo de incidentes
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: operations
---

## What I do

- Crear incidentes con contexto completo y línea de tiempo
- Agrupar errores relacionados en un solo incidente (deduplicación)
- Enviar alertas a Slack, PagerDuty y email según severidad
- Coordinar respuesta entre Error Analysis, Fix Suggestion y Auto Recovery
- Generar reportes post-mortem y executive summaries

## When to use me

Use this when a CRITICAL or HIGH severity issue is detected, errors accumulate rapidly, or an incident needs structured tracking, escalation, and post-mortem reporting.
