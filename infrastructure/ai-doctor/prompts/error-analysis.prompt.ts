import { ErrorEntry } from '../collectors/error-collector';
import { Analysis } from '../analyzers/error-analyzer';

export interface PromptContext {
  error: ErrorEntry;
  analysis?: Analysis;
  logs?: string;
  traces?: string;
  metrics?: Record<string, unknown>;
  services?: Record<string, unknown>;
  code?: string;
}

/**
 * Strip sensitive patterns (tokens, secrets, keys) from untrusted data
 * before it reaches a prompt template.
 */
const SENSITIVE_PATTERNS = [
  /(?:sk|pk|api[_-]?key|secret|token|password|passwd|credential)[\s:=]+['"]?[a-zA-Z0-9_\-.]{16,}['"]?/gi,
  /bearer\s+[a-zA-Z0-9_\-.]{16,}/gi,
  /jwt\s+[a-zA-Z0-9_\-.]{16,}/gi,
  /(?:-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)[\s\S]*?(?:-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/g,
];

function sanitize(value: string, maxLength = 10_000): string {
  let cleaned = String(value);
  for (const pattern of SENSITIVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) + '\n... [TRUNCATED]' : cleaned;
}

function safeStringify(obj: unknown, maxLength = 5_000): string {
  try {
    const raw = JSON.stringify(obj, null, 2);
    return sanitize(raw, maxLength);
  } catch {
    return sanitize(String(obj), maxLength);
  }
}

export function analyzeErrorTemplate(context: PromptContext): string {
  const { error, logs, traces } = context;

  const sanitizedMsg = sanitize(error.message);
  const sanitizedStack = sanitize(error.stack || 'No stack trace available');
  const sanitizedContext = safeStringify(error.context);
  const sanitizedLogs = logs ? sanitize(logs, 8_000) : '';
  const sanitizedTraces = traces ? sanitize(traces, 8_000) : '';

  return `You are an expert error analysis AI. Analyze the following error and provide a detailed root cause analysis.

## Error Details

**Error ID:** ${sanitize(error.id)}
**Message:** ${sanitizedMsg}
**Service:** ${sanitize(error.service)}
**Trace ID:** ${sanitize(error.traceId)}
**Timestamp:** ${error.timestamp.toISOString()}
**Severity:** ${sanitize(error.severity)}

## Stack Trace

\`\`\`
${sanitizedStack}
\`\`\`

## Context

\`\`\`json
${sanitizedContext}
\`\`\`

${sanitizedLogs ? `## Recent Logs\n\n\`\`\`\n${sanitizedLogs}\n\`\`\`\n` : ''}
${sanitizedTraces ? `## Additional Traces\n\n\`\`\`\n${sanitizedTraces}\n\`\`\`\n` : ''}

## Analysis Required

Please provide:

1. **Root Cause**: What is the most likely root cause of this error?
2. **Severity Assessment**: Is the current severity classification accurate?
3. **Pattern Detection**: What error patterns do you recognize?
4. **Related Errors**: Are there similar errors that might be related?
5. **Confidence Score**: How confident are you in this analysis (0-100%)?
6. **Recommended Actions**: What steps should be taken to resolve this error?

Format your response as structured JSON with these fields:
- rootCause: string
- severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- patterns: string[]
- relatedErrors: string[]
- confidence: number (0-100)
- recommendedActions: string[]`;
}

export function suggestFixTemplate(context: PromptContext): string {
  const { error, analysis, code } = context;

  const sanitizedMsg = sanitize(error.message);
  const sanitizedStack = sanitize(error.stack || 'No stack trace available');
  const sanitizedCode = code ? sanitize(code, 8_000) : '';

  return `You are an expert software engineer. Suggest a fix for the following error.

## Error Details

**Error ID:** ${sanitize(error.id)}
**Message:** ${sanitizedMsg}
**Service:** ${sanitize(error.service)}

## Root Cause Analysis

${
  analysis
    ? `**Root Cause:** ${sanitize(analysis.rootCause)}
**Confidence:** ${analysis.confidence * 100}%
**Patterns:** ${analysis.patterns.join(', ')}`
    : 'Root cause analysis not yet available'
}

## Stack Trace

\`\`\`
${sanitizedStack}
\`\`\`

${sanitizedCode ? `## Relevant Code\n\n\`\`\`typescript\n${sanitizedCode}\n\`\`\`\n` : ''}

## Fix Required

Please provide:

1. **Diagnosis**: A clear explanation of the problem
2. **Root Cause**: The underlying cause of the error
3. **Fix**: Step-by-step instructions to fix the issue
4. **Priority**: LOW | MEDIUM | HIGH | CRITICAL
5. **Affected Files**: List of files that need to be modified
6. **Code Patch**: A diff-style patch showing the changes
7. **Explanation**: Why this fix works and any trade-offs

Format your response as structured JSON with these fields:
- diagnosis: string
- rootCause: string
- fix: string
- priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- affectedFiles: string[]
- patch: string
- explanation: string`;
}

export function diagnoseTemplate(context: PromptContext): string {
  const { error, metrics, services } = context;

  const sanitizedMsg = sanitize(error.message);
  const sanitizedMetrics = safeStringify(metrics || {});
  const sanitizedServices = safeStringify(services || {});

  return `You are an expert system diagnostician. Diagnose the health of the system based on the following data.

## Current Error

**Error ID:** ${sanitize(error.id)}
**Message:** ${sanitizedMsg}
**Service:** ${sanitize(error.service)}
**Timestamp:** ${error.timestamp.toISOString()}

## System Metrics

\`\`\`json
${sanitizedMetrics}
\`\`\`

## Service Status

\`\`\`json
${sanitizedServices}
\`\`\`

## Diagnosis Required

Please provide:

1. **Overall Health**: HEALTHY | DEGRADED | UNHEALTHY
2. **Problem Areas**: Which components are experiencing issues?
3. **Root Causes**: What is causing the observed problems?
4. **Cascading Effects**: Are there downstream impacts?
5. **Immediate Actions**: What should be done right now?
6. **Long-term Fixes**: What architectural changes are needed?
7. **Monitoring Recommendations**: What should be monitored going forward?

Format your response as structured JSON with these fields:
- overallHealth: "HEALTHY" | "DEGRADED" | "UNHEALTHY"
- problemAreas: string[]
- rootCauses: string[]
- cascadingEffects: string[]
- immediateActions: string[]
- longTermFixes: string[]
- monitoringRecommendations: string[]`;
}

export function incidentSummaryTemplate(incident: {
  id: string;
  title: string;
  severity: string;
  description: string;
  rootCause: string;
}): string {
  return `Generate an incident summary for the following incident.

## Incident Details

**Incident ID:** ${sanitize(incident.id)}
**Title:** ${sanitize(incident.title)}
**Severity:** ${sanitize(incident.severity)}

## Description

${sanitize(incident.description)}

## Root Cause

${sanitize(incident.rootCause)}

Please generate:
1. A concise executive summary (2-3 sentences)
2. Technical summary for engineers
3. Impact assessment
4. Recommended next steps

Format as markdown with clear sections.`;
}
