import winston from 'winston';
import { ErrorEntry } from '../collectors/error-collector';
import { Analysis } from './error-analyzer';

export interface FixSuggestion {
  diagnosis: string;
  rootCause: string;
  fix: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedFiles: string[];
  patch: string;
  explanation: string;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/fix-suggester.log' }),
  ],
});

export class FixSuggester {
  async suggestFix(analysis: Analysis): Promise<FixSuggestion> {
    logger.info('Generating fix suggestion', { errorId: analysis.errorId });

    const diagnosis = this.generateDiagnosis(analysis);
    const fix = this.generateFix(analysis);
    const affectedFiles = this.extractAffectedFiles(analysis);
    const patch = this.generatePatchStub(analysis, analysis.rootCause);
    const explanation = this.generateExplanation(analysis);

    const suggestion: FixSuggestion = {
      diagnosis,
      rootCause: analysis.rootCause,
      fix,
      priority: analysis.severity,
      affectedFiles,
      patch,
      explanation,
    };

    logger.info('Fix suggestion generated', {
      errorId: analysis.errorId,
      priority: suggestion.priority,
    });

    return suggestion;
  }

  generatePatch(error: ErrorEntry, rootCause: string): string {
    logger.debug('Generating patch', { errorId: error.id });

    if (rootCause.toLowerCase().includes('null') || rootCause.toLowerCase().includes('undefined')) {
      return this.generateNullCheckPatch(error);
    }

    if (rootCause.toLowerCase().includes('connection') || rootCause.toLowerCase().includes('network')) {
      return this.generateRetryPatch(error);
    }

    if (rootCause.toLowerCase().includes('timeout')) {
      return this.generateTimeoutPatch(error);
    }

    if (rootCause.toLowerCase().includes('validation')) {
      return this.generateValidationPatch(error);
    }

    return `// Manual review required for error: ${error.message}\n// Root cause: ${rootCause}`;
  }

  detectBadPractices(error: ErrorEntry): string[] {
    const practices: string[] = [];
    const stack = error.stack;
    const message = error.message;

    if (stack.includes('catch (e)') && !stack.includes('catch (err)')) {
      practices.push('Generic catch variable name - use descriptive error variable');
    }

    if (message.includes('undefined') || message.includes('null')) {
      practices.push('Missing null/undefined checks');
    }

    if (stack.includes('console.log') || stack.includes('console.error')) {
      practices.push('Direct console usage instead of structured logger');
    }

    if (stack.includes('any')) {
      practices.push('Use of "any" type - prefer specific types');
    }

    if (stack.includes('eval(')) {
      practices.push('Use of eval() - security risk');
    }

    if (stack.includes('setTimeout') && !stack.includes('clearTimeout')) {
      practices.push('Potential timer leak - setTimeout without clearTimeout');
    }

    if (stack.includes('Promise') && !stack.includes('catch')) {
      practices.push('Unhandled promise rejection risk');
    }

    logger.debug('Detected bad practices', {
      errorId: error.id,
      practices,
    });

    return practices;
  }

  private generateDiagnosis(analysis: Analysis): string {
    const patternSummary = analysis.patterns.length > 0
      ? `Detected patterns: ${analysis.patterns.join(', ')}`
      : 'No specific patterns detected';

    return `Error ${analysis.errorId}: ${analysis.rootCause}. ${patternSummary}. Confidence: ${(analysis.confidence * 100).toFixed(0)}%`;
  }

  private generateFix(analysis: Analysis): string {
    const patterns = analysis.patterns;

    if (patterns.includes('NetworkError')) {
      return 'Implement retry logic with exponential backoff and circuit breaker pattern';
    }

    if (patterns.includes('DatabaseError')) {
      return 'Check database connection pool configuration, add connection retry logic, and verify query parameters';
    }

    if (patterns.includes('MemoryError')) {
      return 'Profile memory usage, fix memory leaks, increase heap size, or implement streaming for large datasets';
    }

    if (patterns.includes('TimeoutError')) {
      return 'Increase timeout threshold, optimize slow operations, or implement async processing with job queue';
    }

    if (patterns.includes('ValidationError')) {
      return 'Add input validation middleware, sanitize inputs, and return descriptive error messages';
    }

    if (patterns.includes('TypeError') || patterns.includes('ReferenceError')) {
      return 'Add proper type checking, null guards, and ensure all dependencies are imported';
    }

    return 'Review error context and stack trace to identify and fix the root cause';
  }

  private extractAffectedFiles(analysis: Analysis): string[] {
    const files: string[] = [];

    if (analysis.patterns.includes('ThirdPartyLibraryError')) {
      files.push('package.json');
    }

    if (analysis.patterns.includes('DatabaseError')) {
      files.push('src/database/connection.ts');
      files.push('src/database/config.ts');
    }

    if (analysis.patterns.includes('NetworkError')) {
      files.push('src/services/http-client.ts');
      files.push('src/config/network.ts');
    }

    return files;
  }

  private generatePatchStub(analysis: Analysis, rootCause: string): string {
    const lines: string[] = [];
    lines.push('```diff');

    if (rootCause.toLowerCase().includes('null') || rootCause.toLowerCase().includes('undefined')) {
      lines.push('- const value = data.property;');
      lines.push('+ const value = data?.property ?? defaultValue;');
    } else if (rootCause.toLowerCase().includes('connection')) {
      lines.push('- await db.query(sql);');
      lines.push('+ await withRetry(() => db.query(sql), { maxRetries: 3 });');
    } else if (rootCause.toLowerCase().includes('timeout')) {
      lines.push('- const result = await fetch(url);');
      lines.push('+ const result = await fetchWithTimeout(url, { timeout: 30000 });');
    } else {
      lines.push('// Review required - no automatic patch available');
      lines.push(`// Root cause: ${rootCause}`);
    }

    lines.push('```');
    return lines.join('\n');
  }

  private generateExplanation(analysis: Analysis): string {
    const explanations: string[] = [];

    explanations.push(`Root Cause: ${analysis.rootCause}`);
    explanations.push(`Severity: ${analysis.severity}`);
    explanations.push(`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);

    if (analysis.patterns.length > 0) {
      explanations.push(`\nDetected Patterns:`);
      for (const pattern of analysis.patterns) {
        explanations.push(`  - ${pattern}`);
      }
    }

    explanations.push(`\nRecommended Action: ${this.generateFix(analysis)}`);

    return explanations.join('\n');
  }

  private generateNullCheckPatch(error: ErrorEntry): string {
    return [
      '```diff',
      '- const value = obj.property.nested;',
      '+ const value = obj?.property?.nested ?? fallbackValue;',
      '',
      '// Or with explicit checks:',
      '+ if (!obj || !obj.property) {',
      '+   throw new ValidationError("Missing required property");',
      '+ }',
      '```',
    ].join('\n');
  }

  private generateRetryPatch(error: ErrorEntry): string {
    return [
      '```diff',
      '+ import { withRetry } from "./utils/retry";',
      '',
      '- const result = await externalService.call();',
      '+ const result = await withRetry(',
      '+   () => externalService.call(),',
      '+   { maxRetries: 3, backoffMs: 1000 }',
      '+ );',
      '```',
    ].join('\n');
  }

  private generateTimeoutPatch(error: ErrorEntry): string {
    return [
      '```diff',
      '+ import { withTimeout } from "./utils/timeout";',
      '',
      '- const result = await slowOperation();',
      '+ const result = await withTimeout(',
      '+   slowOperation(),',
      '+   30000 // 30 second timeout',
      '+ );',
      '```',
    ].join('\n');
  }

  private generateValidationPatch(error: ErrorEntry): string {
    return [
      '```diff',
      '+ import { z } from "zod";',
      '',
      '+ const schema = z.object({',
      '+   field: z.string().min(1),',
      '+ });',
      '',
      '- const data = req.body;',
      '+ const data = schema.parse(req.body);',
      '```',
    ].join('\n');
  }
}
