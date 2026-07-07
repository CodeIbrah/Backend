# AI Doctor — Fix Suggestion Agent (DeepSeek)

## What I Do

Genero sugerencias de fix accionables a partir de análisis de errores. **No uso API externa** — todo es local con reglas determinísticas más el modelo DeepSeek de OpenCode para explicaciones en lenguaje natural.

## Files I Reference

- `infrastructure/ai-doctor/analyzers/error-analyzer.ts` — `Analysis` interface y tipos
- `infrastructure/ai-doctor/analyzers/fix-suggester.ts` — clase con lógica de generación de parches
- `infrastructure/ai-doctor/agents/fix-suggestion-agent.ts` — clase agente wrapper
- `infrastructure/ai-doctor/prompts/error-analysis.prompt.ts` — `suggestFixTemplate()` para prompts estructurados

## How to Invoke Me

```typescript
task(
  category="deep",
  load_skills=["ai-doctor-fix-suggestion"],
  prompt="Generate fix suggestions for analysis: [analysis data]"
)
```

## My Workflow

### 1. Receive Analysis
Tomo un `Analysis[]` desde `ErrorAnalysisAgent` que incluye: errorId, rootCause, severity, patterns, confidence.

### 2. Generate Diagnosis
Resumen estructurado del análisis:
```
Error {errorId}: {rootCause}. Detected patterns: {patterns}. Confidence: {confidence}%
```

### 3. Generate Fix (Rule-based)
| Patrón Detectado | Fix Sugerido |
|---|---|
| NetworkError | Implement retry with exponential backoff + circuit breaker |
| DatabaseError | Check connection pool config, add retry logic, verify queries |
| MemoryError | Profile memory, fix leaks, increase heap, implement streaming |
| TimeoutError | Increase timeout, optimize operations, use async job queue |
| ValidationError | Add input validation middleware, sanitize inputs |
| TypeError / ReferenceError | Add proper type checking, null guards, check imports |

### 4. Extract Affected Files
| Patrón | Archivos sugeridos |
|---|---|
| ThirdPartyLibraryError | package.json |
| DatabaseError | src/database/connection.ts, src/database/config.ts |
| NetworkError | src/services/http-client.ts, src/config/network.ts |

### 5. Generate Patch Stub
```typescript
import { FixSuggester } from 'infrastructure/ai-doctor/analyzers/fix-suggester';

const suggester = new FixSuggester();
const suggestion = await suggester.suggestFix(analysis);
// suggestion.patch → diff-style patch
```

### 6. Detect Bad Practices
| Señal | Práctica |
|---|---|
| `catch (e)` genérico | Usar nombre descriptivo |
| undefined/null en mensaje | Faltan null checks |
| console.log/error | Usar logger estructurado |
| `any` type | Preferir tipos específicos |
| eval() | Riesgo de seguridad |
| setTimeout sin clearTimeout | Potencial timer leak |
| Promise sin catch | Riesgo de promise no manejada |

## Fix Suggestion Output

```json
{
  "diagnosis": "Error err-abc: Database connection issue. Patterns: DatabaseError. Confidence: 80%",
  "rootCause": "Database connection or query issue",
  "fix": "Check connection pool config, add retry logic, verify query parameters",
  "priority": "HIGH",
  "affectedFiles": ["src/database/connection.ts", "src/database/config.ts"],
  "patch": "```diff\n- await db.query(sql);\n+ await withRetry(() => db.query(sql), { maxRetries: 3 });\n```",
  "explanation": "Root Cause: Database connection or query issue\nSeverity: HIGH\nConfidence: 80%\n\nDetected Patterns:\n  - DatabaseError\n\nRecommended Action: Check connection pool config..."
}
```

## Run Full Agent

```typescript
const agent = new FixSuggestionAgent();
const result = await agent.run(analyses);
// result.suggestions
```

## Known Limitations

- Fixes son **basados en reglas**, no generados por IA externa
- Parches son stub/didácticos, no aplican automáticamente
- No conecta con OpenAI ni ChatGPT — usa DeepSeek solo cuando se invoca como skill de OpenCode
- Las sugerencias de archivos afectados son estimaciones genéricas
