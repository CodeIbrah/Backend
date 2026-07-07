# AI Doctor — Error Analysis Agent (DeepSeek)

## What I Do

Analizo errores capturados para identificar causa raíz, clasificar severidad y detectar patrones. **No uso API externa** — todo el análisis se ejecuta localmente con DeepSeek (OpenCode Zen) más las clases TypeScript existentes en `infrastructure/ai-doctor/`.

## Files I Reference

- `infrastructure/ai-doctor/collectors/error-collector.ts` — fuente de errores (`ErrorEntry`)
- `infrastructure/ai-doctor/analyzers/error-analyzer.ts` — lógica local: parseo de stack traces, patrones regex, clasificación
- `infrastructure/ai-doctor/agents/error-analysis-agent.ts` — clase agente wrapper
- `infrastructure/ai-doctor/prompts/error-analysis.prompt.ts` — templates de prompt (adaptados para DeepSeek)
- `infrastructure/ai-doctor/memory/knowledge-base.ts` — Knowledge Base para patrones históricos

## How to Invoke Me

```typescript
task(
  category="deep",
  load_skills=["ai-doctor-error-analysis"],
  prompt="Analyze errors from [source]: identify root cause, classify severity, detect patterns"
)
```

## My Workflow

### 1. Read & Parse Errors
- Obtengo `ErrorEntry[]` desde `ErrorCollector` o fuente similar
- Cada entrada tiene: id, message, stack, service, severity, timestamp, traceId, context

### 2. Analyze Stack Traces
```typescript
import { ErrorAnalyzer } from 'infrastructure/ai-doctor/analyzers/error-analyzer';
import { ErrorAnalysisAgent } from 'infrastructure/ai-doctor/agents/error-analysis-agent';

const analyzer = new ErrorAnalyzer();
const agent = new ErrorAnalysisAgent(analyzer);
const analysis = await analyzer.analyze(errorEntry);
```

### 3. Classify Severity
| Condición | Severidad |
|---|---|
| Out of memory, fatal, segfault, panic | CRITICAL |
| Database error, connection refused, deadlock, unauthorized | HIGH |
| Timeout, validation, not found | MEDIUM |
| Otros | LOW |

### 4. Detect Patterns (Regex-based)
- `TypeError`, `ReferenceError`, `SyntaxError`, `RangeError`
- `NetworkError` → ECONNREFUSED, ENOTFOUND, ETIMEDOUT, ECONNRESET
- `DatabaseError` → ECONNREFUSED:5432, query timeout, deadlock
- `MemoryError` → heap out of memory
- `TimeoutError`, `ValidationError`, `AuthenticationError`

### 5. Infer Root Cause (Rule-based)
Basado en patrones detectados + frame superior del stack trace.

### 6. Calculate Confidence
| Factor | Aporte |
|---|---|
| Base | 0.5 |
| Patrón detectado | +0.2 |
| Stack trace parseado | +0.1 |
| 3+ patrones | +0.1 |
| Stack con líneas exactas | +0.1 |

## Analysis Output Example

```json
{
  "errorId": "err-abc123",
  "rootCause": "Database connection or query issue - check connection pool and query performance",
  "severity": "HIGH",
  "patterns": ["DatabaseError", "TimeoutError"],
  "confidence": 0.8,
  "relatedErrors": []
}
```

## Run Full Agent

```typescript
const agent = new ErrorAnalysisAgent();
const result = await agent.run(errors);
// result.analyses, result.patterns, result.severityMap
```

## Known Limitations

- Análisis **solo local**: no conecta con OpenAI, ChatGPT ni ningún LLM externo
- Usa el modelo DeepSeek V4 Flash Free de OpenCode Zen para procesamiento de lenguaje cuando se invoca como skill
- La detección de patrones es basada en regex, no en ML
- `ErrorEntry` debe incluir stack trace para análisis completos
