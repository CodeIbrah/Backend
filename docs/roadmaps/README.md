# Roadmap del Backend Template

> **Proyecto:** Backend Template — NestJS + Express + Microservicios Híbridos
> **Versión del documento:** 1.0.0
> **Última actualización:** Junio 2026

---

## Tabla de Contenidos

- [Visión](#visión)
- [Principios Rectores](#principios-rectores)
- [Estado Actual](#estado-actual)
- [Objetivos a Corto Plazo — Q3 2026](#objetivos-a-corto-plazo--q3-2026)
- [Objetivos a Medio Plazo — Q4 2026](#objetivos-a-medio-plazo--q4-2026)
- [Objetivos a Largo Plazo — 2027+](#objetivos-a-largo-plazo--2027)
- [Cómo Contribuir](#cómo-contribuir)
- [Framework de Priorización](#framework-de-priorización)
- [Métrica de Progreso](#métrica-de-progreso)
- [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Visión

Convertir el **Backend Template** en el punto de partida _de facto_ para equipos que construyen sistemas backend empresariales en Node.js. Un template que no solo genera código inicial, sino que entrega una plataforma completa con observabilidad, diagnóstico automatizado, recuperación ante fallos, y capacidades de IA integradas desde el primer `npm run dev`.

Creemos que un backend moderno debe ser:

- **Observable por diseño** — sin instrumentación retroactiva.
- **Autoreparable** — detección y corrección automática de fallos comunes.
- **Seguro por defecto** — autenticación, autorización y cifrado sin configuración adicional.
- **Escalable sin fricción** — del monolito a microservicios sin reescribir.
- **Documentado vivamente** — la documentación evoluciona con el código.

---

## Principios Rectores

| Principio | Descripción |
|-----------|-------------|
| **Calidad > Velocidad** | Preferimos una feature bien hecha a tres features a medias. |
| **Seguridad por defecto** | Cada nueva feature debe pasar una revisión de seguridad antes de integrarse. |
| **Observable desde el día 1** | No se aceptan features sin métricas, logs o trazas. |
| **Deuda técnica cero** | El roadmap prioriza pagar deuda técnica antes de acumular nueva. |
| **Documentación viva** | Toda feature nueva incluye su documentación en el mismo PR. |
| **IA como ciudadano de primera clase** | El sistema de IA (AI Doctor) es un componente central, no un experimento. |

---

## Estado Actual

| Dimensión | Estado | Notas |
|-----------|--------|-------|
| Monolito principal (main/) | ✅ Operativo | NestJS con módulos core |
| Auth Service | ✅ Operativo | JWT + OAuth2 |
| Users Service | ✅ Operativo | CRUD + roles |
| Payment Service | ✅ Operativo | Stripe integrado |
| Notifications Service | ✅ Operativo | Email + SMS + push |
| AI Doctor System | 🚧 En desarrollo | Análisis de errores funcional, auto-recovery pendiente |
| Observabilidad básica | ✅ Operativo | Prometheus + Loki + Jaeger + Grafana |
| CI/CD | 📋 Planificado | GitHub Actions pendiente de configuración |
| Cobertura de tests | 🚧 En desarrollo | ~45% de cobertura actual |
| Seguridad | 🚧 En desarrollo | Auditoría externa pendiente |

**Leyenda:** ✅ Completo | 🚧 En progreso | 📋 Planificado

---

## Objetivos a Corto Plazo — Q3 2026

> Julio 2026 — Septiembre 2026
> **Tema:** Estabilización del núcleo y fundamentos

### Infraestructura y CI/CD

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q3-01 | Pipeline CI/CD con GitHub Actions para todos los workspaces | 🔴 Alta | 📋 | — |
| Q3-02 | Linting y type-check automático en PRs | 🔴 Alta | 📋 | Q3-01 |
| Q3-03 | Despliegue automatizado a staging | 🟡 Media | 📋 | Q3-01 |
| Q3-04 | Contenerización completa con Docker Compose multi-entorno | 🟡 Media | 🚧 | — |

### Calidad de Código

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q3-05 | Alcanzar 70% de cobertura en tests unitarios | 🔴 Alta | 🚧 | — |
| Q3-06 | Alcanzar 50% de cobertura en tests de integración | 🔴 Alta | 📋 | Q3-05 |
| Q3-07 | Implementar contrato de API con OpenAPI 3.1 para todos los servicios | 🟡 Media | 📋 | — |
| Q3-08 | Automatizar generación de documentación de API | 🟢 Baja | 📋 | Q3-07 |

### Estabilidad

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q3-09 | Corrección de bugs críticos identificados en backlog | 🔴 Alta | 🚧 | — |
| Q3-10 | Manejo de errores consistente en todos los microservicios | 🔴 Alta | 📋 | — |
| Q3-11 | Timeouts y retry policies configurados en todas las comunicaciones HTTP | 🟡 Media | 📋 | — |
| Q3-12 | Health checks en todos los servicios con endpoints `/health` | 🟡 Media | 🚧 | — |

### Documentación

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q3-13 | Wiki de arquitectura actualizada con diagramas C4 | 🟡 Media | 📋 | — |
| Q3-14 | Guía de onboarding para nuevos desarrolladores (< 30 min) | 🟡 Media | 📋 | — |
| Q3-15 | README multilingüe completo (10 idiomas) | 🟢 Baja | ✅ | — |

---

## Objetivos a Medio Plazo — Q4 2026

> Octubre 2026 — Diciembre 2026
> **Tema:** Observabilidad, IA y madurez operativa

### Observabilidad Avanzada

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q4-01 | Dashboards de Grafana para métricas de negocio por servicio | 🔴 Alta | 📋 | Q3-01 |
| Q4-02 | Alertas tuneadas con thresholds dinámicos basados en baselines | 🔴 Alta | 📋 | Q4-01 |
| Q4-03 | Distributed tracing completo con span metadata enriquecido | 🟡 Media | 📋 | — |
| Q4-04 | Definición de SLO/SLI para todos los endpoints críticos | 🔴 Alta | 📋 | — |
| Q4-05 | Error budget dashboard y alertas por quema de presupuesto | 🟡 Media | 📋 | Q4-04 |
| Q4-06 | Logs estructurados con contexto de correlación en todos los servicios | 🟡 Media | 🚧 | — |

### Sistema de IA (AI Doctor)

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q4-07 | AI Doctor listo para producción (testing completado) | 🔴 Alta | 🚧 | Q3-05 |
| Q4-08 | Análisis de causa raíz automatizado con recomendaciones | 🔴 Alta | 📋 | Q4-07 |
| Q4-09 | Base de conocimiento de errores con búsqueda semántica | 🟡 Media | 📋 | Q4-08 |
| Q4-10 | Detección de patrones de error recurrentes | 🟡 Media | 📋 | Q4-09 |
| Q4-11 | Incidencias generadas automáticamente con contexto completo | 🟡 Media | 📋 | Q4-07 |

### Automatización y Recuperación

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q4-12 | Auto-recovery para fallos comunes (DB, Redis, colas) | 🔴 Alta | 📋 | Q4-07 |
| Q4-13 | Incident Response automatizado con playbooks | 🟡 Media | 📋 | Q4-11 |
| Q4-14 | Reportes automáticos semanales de salud del sistema | 🟢 Baja | 📋 | Q4-01 |

### Performance Inicial

| ID | Objetivo | Prioridad | Estado | Dependencias |
|----|----------|-----------|--------|--------------|
| Q4-15 | Benchmarking de referencia (baseline) para todos los endpoints | 🟡 Media | 📋 | Q3-01 |
| Q4-16 | Identificación de cuellos de botella tempranos | 🟡 Media | 📋 | Q4-15 |
| Q4-17 | Caché Redis para consultas frecuentes implementado | 🟡 Media | 📋 | — |

---

## Objetivos a Largo Plazo — 2027+

> Enero 2027 — Diciembre 2027
> **Tema:** Escalabilidad, producción y excelencia operativa

### Q1 2027 — Performance y Carga

| ID | Objetivo | Prioridad | Estado |
|----|----------|-----------|--------|
| 2027-01 | Pruebas de carga con k6 (1000 RPS sostenidos) | 🔴 Alta | 📋 |
| 2027-02 | Optimización de consultas Prisma (N+1, joins, índices) | 🔴 Alta | 📋 |
| 2027-03 | Implementación de caché multinivel (Redis + CDN) | 🟡 Media | 📋 |
| 2027-04 | Conexión pool tuning para PostgreSQL | 🟡 Media | 📋 |
| 2027-05 | Compresión y optimización de payloads de API | 🟢 Baja | 📋 |

### Q2 2027 — Seguridad y Cumplimiento

| ID | Objetivo | Prioridad | Estado |
|----|----------|-----------|--------|
| 2027-06 | Auditoría de seguridad externa completa | 🔴 Alta | 📋 |
| 2027-07 | Escaneo automatizado de vulnerabilidades en CI/CD | 🔴 Alta | 📋 |
| 2027-08 | Cumplimiento OWASP Top 10 verificado | 🔴 Alta | 📋 |
| 2027-09 | Rate limiting y protección DDoS a nivel de Gateway | 🟡 Media | 📋 |
| 2027-10 | Secret scanning en commits (pre-commit hook) | 🟡 Media | 📋 |

### Q3 2027 — Disaster Recovery y Alta Disponibilidad

| ID | Objetivo | Prioridad | Estado |
|----|----------|-----------|--------|
| 2027-11 | Plan de disaster recovery documentado y probado | 🔴 Alta | 📋 |
| 2027-12 | Backup automatizado con verificación de restauración | 🔴 Alta | 📋 |
| 2027-13 | Estrategia de replicación multi-región | 🟡 Media | 📋 |
| 2027-14 | Failover automático para servicios críticos | 🟡 Media | 📋 |
| 2027-15 | Pruebas de caos (Chaos Engineering) mensuales | 🟢 Baja | 📋 |

### Q4 2027 — Automatización y Plataforma

| ID | Objetivo | Prioridad | Estado |
|----|----------|-----------|--------|
| 2027-16 | Despliegue automatizado a producción (zero-downtime) | 🔴 Alta | 📋 |
| 2027-17 | Self-service portal para equipos (provisionamiento de servicios) | 🟡 Media | 📋 |
| 2027-18 | Kubernetes migration (evaluación y POC) | 🟡 Media | 📋 |
| 2027-19 | Feature flags para despliegues graduales | 🟡 Media | 📋 |
| 2027-20 | Post-mortem automation con análisis de incidentes | 🟢 Baja | 📋 |

---

## Cómo Contribuir

Valoramos las contribuciones de la comunidad. Para mantener la calidad del proyecto, seguimos estos lineamientos:

### Pasos para contribuir

1. **Revisa el roadmap** — Asegúrate de que tu contribución esté alineada con los objetivos actuales.
2. **Abre un issue** — Describe el cambio propuesto antes de empezar a codificar.
3. **Discute el enfoque** — El equipo revisará y sugerirá ajustes si es necesario.
4. **Desarrolla con estándares** — Sigue las guías de estilo y convenciones del proyecto.
5. **PR con descripción clara** — Explica qué resuelve, cómo se probó y qué impacto tiene.

### Áreas de contribución bienvenidas

| Área | Dificultad | Impacto |
|------|-----------|---------|
| Corrección de bugs | 🟢 Baja | Alto |
| Tests unitarios y de integración | 🟢 Baja | Muy alto |
| Documentación y ejemplos | 🟢 Baja | Alto |
| Dashboards y alertas | 🟡 Media | Alto |
| Nuevos módulos y features | 🟡 Media | Medio |
| Optimizaciones de performance | 🔴 Alta | Muy alto |
| Integraciones de IA | 🔴 Alta | Muy alto |
| Arquitectura y escalabilidad | 🔴 Alta | Muy alto |

### Guía de PRs

- Cada PR debe pasar lint, type-check y tests antes de revisarse.
- Incluye tests para código nuevo (mínimo 80% de cobertura en el módulo afectado).
- Actualiza la documentación si el PR cambia APIs o comportamiento.
- Sigue [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.).

---

## Framework de Priorización

Usamos una matriz **Impacto × Esfuerzo** para priorizar el backlog:

```
              ┌─────────────────────────────────────────────────┐
              │              ESFUERZO                           │
              │         BAJO          |        ALTO             │
├─────────────┼─────────────────────────────────────────────────┤
│   I         │                                                 │
│   M   ALTO  │    🔴 HACER AHORA     │    🟡 PLANIFICAR        │
│   P         │    (Q3-01, Q3-05)     │    (Q4-07, 2027-01)    │
│   A         │─────────────────────────────────────────────────┤
│   C   BAJO  │    🟢 RÁPIDO           │    ⚪ CONSIDERAR        │
│   T         │    (Q3-15, Q4-14)     │    (2027-18, 2027-20)  │
│   O         │                                                 │
└─────────────┴─────────────────────────────────────────────────┘
```

### Dimensiones de prioridad

| Prioridad | Criterio |
|-----------|----------|
| 🔴 Alta | Bloqueante para otras features, seguridad, estabilidad del sistema |
| 🟡 Media | Mejora significativa sin ser bloqueante, deuda técnica importante |
| 🟢 Baja | Deseable pero no urgente, automatización de procesos internos |
| ⚪ Considerar | Valor a largo plazo, requiere investigación previa |

---

## Métrica de Progreso

| Período | Items Planificados | Items Completados | Progreso |
|---------|-------------------|-------------------|----------|
| Q3 2026 | 15 | 0 | 0% |
| Q4 2026 | 15 | 0 | 0% |
| 2027 Q1 | 5 | 0 | 0% |
| 2027 Q2 | 5 | 0 | 0% |
| 2027 Q3 | 5 | 0 | 0% |
| 2027 Q4 | 5 | 0 | 0% |

> **Meta:** 100% de los objetivos Q3 2026 completados antes del 30 de Septiembre de 2026.

---

## Preguntas Frecuentes

**¿Puedo proponer un objetivo que no está en el roadmap?**
Sí. Abre un issue con la propuesta y el equipo la evaluará usando el framework de priorización.

**¿Cómo se decide qué va en cada trimestre?**
El equipo revisa el roadmap cada sprint (2 semanas) y ajusta prioridades según el contexto actual.

**¿Qué pasa si un objetivo no se completa en el trimestre?**
Se reevalúa su prioridad. Si sigue siendo relevante, pasa al siguiente trimestre. Si perdió prioridad, se archiva.

**¿Cómo se mide el éxito de un objetivo?**
Cada objetivo tiene criterios de aceptación definidos en el issue correspondiente. El éxito se mide contra esos criterios.

---

> **Próximo hito:** Revisión de mitad de Q3 2026 (Agosto 2026)
