import { BaseAIProvider } from './base';
import { AIAnalysis, FixSuggestion, Diagnosis } from '../types';

export class LocalProvider extends BaseAIProvider {
  constructor() {
    super({ apiKey: '', model: 'local-rules' });
  }

  async analyze(error: string, _context: any): Promise<AIAnalysis> {
    const errorLower = error.toLowerCase();

    let rootCause = 'Unknown error pattern';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let description = 'Unable to determine root cause automatically.';
    let confidence = 0.3;
    const relatedErrors: string[] = [];

    if (errorLower.includes('null') || errorLower.includes('undefined')) {
      rootCause = 'Null or undefined reference';
      severity = 'high';
      description = 'A variable or property is being accessed that is null or undefined.';
      confidence = 0.8;
      relatedErrors.push('TypeError: Cannot read properties of undefined');
      relatedErrors.push('ReferenceError: variable is not defined');
    } else if (
      errorLower.includes('connection') ||
      errorLower.includes('network') ||
      errorLower.includes('econnrefused')
    ) {
      rootCause = 'Network or connection failure';
      severity = 'high';
      description = 'Unable to establish connection to a remote service or database.';
      confidence = 0.75;
      relatedErrors.push('ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND');
    } else if (
      errorLower.includes('permission') ||
      errorLower.includes('access denied') ||
      errorLower.includes('eacces')
    ) {
      rootCause = 'Permission denied';
      severity = 'medium';
      description = 'Insufficient permissions to perform the requested operation.';
      confidence = 0.85;
      relatedErrors.push('EACCES', 'EPERM', 'Unauthorized');
    } else if (
      errorLower.includes('memory') ||
      errorLower.includes('heap') ||
      errorLower.includes('oom')
    ) {
      rootCause = 'Out of memory';
      severity = 'critical';
      description = 'Process has exceeded available memory limits.';
      confidence = 0.9;
      relatedErrors.push('JavaScript heap out of memory', 'OOM killed');
    } else if (errorLower.includes('syntax')) {
      rootCause = 'Syntax error';
      severity = 'low';
      description = 'Code contains a syntax error that prevents parsing.';
      confidence = 0.95;
      relatedErrors.push('Unexpected token', 'Missing semicolon');
    }

    return { rootCause, severity, description, confidence, relatedErrors };
  }

  async suggestFix(error: string, context: any): Promise<FixSuggestion> {
    const errorLower = error.toLowerCase();

    let description = 'Review the error message and stack trace.';
    let code = '// Add error handling here';
    let explanation = 'Manual review required.';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    const affectedFiles: string[] = [];

    if (errorLower.includes('null') || errorLower.includes('undefined')) {
      description = 'Add null/undefined checks before accessing properties.';
      code = `if (value != null) {\n  // Safe to access properties\n  const result = value.property;\n}`;
      explanation =
        'Use optional chaining or explicit null checks to prevent null reference errors.';
      priority = 'high';
    } else if (errorLower.includes('connection') || errorLower.includes('network')) {
      description = 'Implement retry logic with exponential backoff.';
      code = `async function withRetry(fn, retries = 3, delay = 1000) {\n  for (let i = 0; i < retries; i++) {\n    try { return await fn(); }\n    catch (e) { if (i === retries - 1) throw e; }\n    await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));\n  }\n}`;
      explanation = 'Add resilience to transient network failures with automatic retries.';
      priority = 'high';
    } else if (errorLower.includes('permission') || errorLower.includes('access denied')) {
      description = 'Verify permissions and credentials.';
      code = `// Check permissions before operation\nif (!hasPermission(user, 'required-action')) {\n  throw new UnauthorizedError('Insufficient permissions');\n}`;
      explanation = 'Ensure the user or process has the required permissions.';
      priority = 'medium';
    } else if (errorLower.includes('memory') || errorLower.includes('heap')) {
      description = 'Optimize memory usage or increase limits.';
      code = `// Increase Node.js memory limit\n// node --max-old-space-size=4096 app.js\n\n// Or optimize: release references to large objects\nlargeObject = null;\nglobal.gc();`;
      explanation = 'Either increase available memory or optimize code to use less memory.';
      priority = 'critical';
    }

    if (context?.file) {
      affectedFiles.push(context.file);
    }

    return { description, code, explanation, priority, affectedFiles };
  }

  async diagnose(metrics: any): Promise<Diagnosis> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    const cpuUsage = metrics?.cpu?.usage ?? metrics?.cpuUsage ?? 0;
    const memoryUsage = metrics?.memory?.usage ?? metrics?.memoryUsage ?? 0;
    const errorRate = metrics?.errors?.rate ?? metrics?.errorRate ?? 0;
    const responseTime = metrics?.responseTime ?? metrics?.latency ?? 0;

    if (cpuUsage > 90) {
      issues.push(`High CPU usage: ${cpuUsage}%`);
      recommendations.push('Optimize CPU-intensive operations or scale horizontally.');
      health = health === 'healthy' ? 'degraded' : health;
    }

    if (memoryUsage > 85) {
      issues.push(`High memory usage: ${memoryUsage}%`);
      recommendations.push('Check for memory leaks and optimize memory consumption.');
      health = 'degraded';
    }

    if (errorRate > 5) {
      issues.push(`High error rate: ${errorRate}%`);
      recommendations.push('Investigate error sources and implement better error handling.');
      health = 'unhealthy';
    }

    if (responseTime > 1000) {
      issues.push(`High response time: ${responseTime}ms`);
      recommendations.push('Optimize slow endpoints or add caching.');
      health = health === 'healthy' ? 'degraded' : health;
    }

    if (issues.length === 0) {
      recommendations.push('System is operating within normal parameters.');
    }

    return { health, issues, recommendations, metrics };
  }
}
