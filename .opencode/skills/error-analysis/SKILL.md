---
name: error-analysis
description: Analizar errores para identificar causas raíz, clasificar severidad y detectar patrones
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: observability
---

## What I do

- Parsear stack traces para identificar puntos de fallo exactos
- Clasificar severidad de errores (CRITICAL, HIGH, MEDIUM, LOW)
- Detectar patrones recurrentes mediante firmas de error
- Correlacionar errores entre servicios usando traces y correlation IDs
- Mantener base de datos de patrones para detección de similitudes

## When to use me

Use this when errors are captured by the Error Collector and need root cause analysis, severity classification, and pattern matching against historical incidents.
