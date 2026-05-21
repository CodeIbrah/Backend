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

export function analyzeErrorTemplate(context: PromptContext): string {
  const { error, logs, traces } = context;

  return `You are an expert error analysis AI. Analyze the following error and provide a detailed root cause analysis.

## Error Details

**Error ID:** ${error.id}
**Message:** ${error.message}
**Service:** ${error.service}
**Trace ID:** ${error.traceId}
**Timestamp:** ${error.timestamp.toISOString()}
**Severity:** ${error.severity}

## Stack Trace

\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

## Context

\`\`\`json
${JSON.stringify(error.context, null, 2)}
\`\`\`

${logs ? `## Recent Logs\n\n\`\`\`\n${logs}\n\`\`\`\n` : ''}
${traces ? `## Additional Traces\n\n\`\`\`\n${traces}\n\`\`\`\n` : ''}

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

  return `You are an expert software engineer. Suggest a fix for the following error.

## Error Details

**Error ID:** ${error.id}
**Message:** ${error.message}
**Service:** ${error.service}

## Root Cause Analysis

${analysis ? `**Root Cause:** ${analysis.rootCause}
**Confidence:** ${analysis.confidence * 100}%
**Patterns:** ${analysis.patterns.join(', ')}` : 'Root cause analysis not yet available'}

## Stack Trace

\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

${code ? `## Relevant Code\n\n\`\`\`typescript\n${code}\n\`\`\`\n` : ''}

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

  return `You are an expert system diagnostician. Diagnose the health of the system based on the following data.

## Current Error

**Error ID:** ${error.id}
**Message:** ${error.message}
**Service:** ${error.service}
**Timestamp:** ${error.timestamp.toISOString()}

## System Metrics

\`\`\`json
${JSON.stringify(metrics || {}, null, 2)}
\`\`\`

## Service Status

\`\`\`json
${JSON.stringify(services || {}, null, 2)}
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

**Incident ID:** ${incident.id}
**Title:** ${incident.title}
**Severity:** ${incident.severity}

## Description

${incident.description}

## Root Cause

${incident.rootCause}

Please generate:
1. A concise executive summary (2-3 sentences)
2. Technical summary for engineers
3. Impact assessment
4. Recommended next steps

Format as markdown with clear sections.`;
}
