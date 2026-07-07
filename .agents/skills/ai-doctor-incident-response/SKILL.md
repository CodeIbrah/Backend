# AI Doctor — Incident Response Agent (DeepSeek)

## What I Do

Gestiono el ciclo de vida completo de incidentes: creación, timeline, agrupación de errores relacionados, reportes técnicos y ejecutivos, y envío de alertas. **Sin API externa** — toda la lógica es local.

## Files I Reference

- `infrastructure/ai-doctor/agents/incident-response-agent.ts` — clase agente completa
- `infrastructure/ai-doctor/collectors/error-collector.ts` — `ErrorEntry`
- `infrastructure/ai-doctor/analyzers/error-analyzer.ts` — `Analysis`
- `infrastructure/ai-doctor/analyzers/fix-suggester.ts` — `FixSuggestion`
- `infrastructure/ai-doctor/integrations/alert-service.ts` — envío de alertas
- `infrastructure/ai-doctor/prompts/error-analysis.prompt.ts` — templates de reportes

## How to Invoke Me

```typescript
task(
  category="deep",
  load_skills=["ai-doctor-incident-response"],
  prompt="Create incident report for errors: [error list with analyses]"
)
```

## My Workflow

### 1. Create Incident Report
```typescript
import { IncidentResponseAgent } from 'infrastructure/ai-doctor/agents/incident-response-agent';
import { AlertService } from 'infrastructure/ai-doctor/integrations/alert-service';

const agent = new IncidentResponseAgent();

const incident = agent.createIncidentReport(error, analysis);
// Incident { id, title, description, severity, status, tags, ... }
```

Cada incidente incluye:
- **ID**: `inc_{timestamp}_{random}`
- **Título**: `[{severity}] {message[:80]} in {service}`
- **Descripción**: error + root cause + patrones
- **Tags**: service, severity, pattern names
- **Metadata**: service, traceId, context

### 2. Build Timeline
```typescript
const timeline = agent.generateTimeline(incident);
// TimelineEvent[] with types: ERROR, DETECTION, ANALYSIS, ALERT, RESOLUTION, ESCALATION
```

### 3. Group Related Errors
```typescript
const groups = agent.groupRelatedErrors(errors);
// ErrorGroup[] → grouped by message prefix + first 3 stack lines
```

Agrupación por:
- Primer segmento del mensaje (antes de `:`)
- Primeras 3 líneas del stack trace

### 4. Generate Reports

**Technical Summary:**
```typescript
const tech = agent.generateTechnicalSummary(incident);
// Incident ID, Error ID, Severity, Service, Root Cause, Patterns, Stack Trace
```

**Executive Summary:**
```typescript
const exec = agent.generateExecutiveSummary(incident);
// Title, Severity, Impact, Description, Resolution Time, Recommended Actions
```

### 5. Send Alerts
```typescript
import { AlertService, AlertConfig } from 'infrastructure/ai-doctor/integrations/alert-service';

const alertService = new AlertService();
const config: AlertConfig = {
  slack: { webhookUrl: '...', enabled: true },
  email: { to: 'ops@example.com', from: 'ai-doctor@example.com', enabled: true }
};

const results = await alertService.sendAlert(config, incident);
```

Canales soportados: Discord, Slack, Email, Telegram.

### 6. Run Full Agent
```typescript
const result = await agent.run(errors, analyses);
// result.incidents, result.timelines, result.errorGroups
```

## Recommended Actions by Severity

| Severity | Acciones |
|---|---|
| CRITICAL | Investigar inmediatamente, escalar a on-call, considerar restart/failover |
| HIGH | Priorizar investigación en 1 hora, monitorear recurrencias |
| MEDIUM | Revisar root cause, implementar fix, agregar monitoreo |
| LOW | Agregar a backlog técnico, actualizar runbook |

## Impact Descriptions

| Severity | Impacto |
|---|---|
| CRITICAL | Severe impact — system stability or data integrity at risk |
| HIGH | Significant impact — affects core functionality or multiple users |
| MEDIUM | Moderate impact — may affect some users or features |
| LOW | Minimal impact — does not affect core functionality |

## Known Limitations

- Sin conexión a OpenAI/ChatGPT — DeepSeek usado solo como skill de OpenCode
- Alertas: el envío real requiere webhooks configurados (actualmente solo loggean)
- No hay escalamiento automático real — es un template de sistema
- IDs de incidente: formato simple timestamp+random (no UUID)
