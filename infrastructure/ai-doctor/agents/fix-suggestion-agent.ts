import winston from 'winston';
import { Analysis } from '../analyzers/error-analyzer';
import { FixSuggestion, FixSuggester } from '../analyzers/fix-suggester';

export interface AgentResult {
  success: boolean;
  suggestions: FixSuggestion[];
  duration: number;
  errors: Error[];
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
    new winston.transports.File({ filename: 'logs/fix-suggestion-agent.log' }),
  ],
});

export class FixSuggestionAgent {
  private suggester: FixSuggester;
  private running: boolean = false;

  constructor(suggester?: FixSuggester) {
    this.suggester = suggester || new FixSuggester();
    logger.info('FixSuggestionAgent initialized');
  }

  async generateFixes(analyses: Analysis[]): Promise<FixSuggestion[]> {
    logger.info('Generating fixes', { analysisCount: analyses.length });

    const suggestions: FixSuggestion[] = [];

    for (const analysis of analyses) {
      try {
        const suggestion = await this.suggester.suggestFix(analysis);
        suggestions.push(suggestion);
      } catch (error) {
        logger.error('Failed to generate fix', {
          errorId: analysis.errorId,
          error,
        });
      }
    }

    logger.info('Fix generation complete', {
      suggestionCount: suggestions.length,
      totalAnalyses: analyses.length,
    });

    return suggestions;
  }

  explainProblem(analysis: Analysis): string {
    const lines: string[] = [];

    lines.push(`Problem Analysis for Error ${analysis.errorId}`);
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Root Cause: ${analysis.rootCause}`);
    lines.push(`Severity: ${analysis.severity}`);
    lines.push(`Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
    lines.push('');

    if (analysis.patterns.length > 0) {
      lines.push('Detected Patterns:');
      for (const pattern of analysis.patterns) {
        lines.push(`  - ${pattern}`);
      }
      lines.push('');
    }

    lines.push('Explanation:');
    lines.push(this.generateDetailedExplanation(analysis));

    return lines.join('\n');
  }

  proposeRefactors(analysis: Analysis): string[] {
    const refactors: string[] = [];
    const patterns = analysis.patterns;

    if (patterns.includes('TypeError') || patterns.includes('ReferenceError')) {
      refactors.push('Add TypeScript strict mode and enable noImplicitAny');
      refactors.push('Implement null-safe optional chaining (?.) throughout codebase');
      refactors.push('Add runtime type validation with Zod or io-ts');
    }

    if (patterns.includes('NetworkError')) {
      refactors.push('Implement circuit breaker pattern for external service calls');
      refactors.push('Add retry logic with exponential backoff');
      refactors.push('Implement health checks for dependent services');
    }

    if (patterns.includes('DatabaseError')) {
      refactors.push('Implement connection pooling with proper limits');
      refactors.push('Add query timeout configuration');
      refactors.push('Use database migration tool for schema changes');
    }

    if (patterns.includes('MemoryError')) {
      refactors.push('Replace synchronous processing with streaming');
      refactors.push('Implement pagination for large dataset queries');
      refactors.push('Add memory usage monitoring and alerts');
    }

    if (patterns.includes('TimeoutError')) {
      refactors.push('Implement async job queue for long-running operations');
      refactors.push('Add timeout configuration per endpoint');
      refactors.push('Implement request cancellation for abandoned requests');
    }

    if (patterns.includes('ValidationError')) {
      refactors.push('Centralize input validation with middleware');
      refactors.push('Add API schema validation at gateway level');
      refactors.push('Implement request sanitization pipeline');
    }

    if (refactors.length === 0) {
      refactors.push('Review error handling patterns across the codebase');
      refactors.push('Add comprehensive logging for debugging');
      refactors.push('Implement structured error types');
    }

    logger.debug('Proposed refactors', {
      errorId: analysis.errorId,
      refactorCount: refactors.length,
    });

    return refactors;
  }

  detectBadPractices(analysis: Analysis): string[] {
    const practices: string[] = [];

    if (analysis.confidence < 0.5) {
      practices.push('Insufficient error context - add more logging');
    }

    if (analysis.patterns.length === 0) {
      practices.push('No recognizable error patterns - error may be too generic');
    }

    if (analysis.rootCause.toLowerCase().includes('unknown')) {
      practices.push('Root cause detection failed - improve error metadata');
    }

    if (analysis.severity === 'CRITICAL' && analysis.confidence < 0.7) {
      practices.push('High severity with low confidence - manual review recommended');
    }

    logger.debug('Detected bad practices', {
      errorId: analysis.errorId,
      practices,
    });

    return practices;
  }

  async run(analyses: Analysis[]): Promise<AgentResult> {
    logger.info('Starting FixSuggestionAgent', { analysisCount: analyses.length });

    const startTime = Date.now();
    this.running = true;

    try {
      const suggestions = await this.generateFixes(analyses);

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        success: true,
        suggestions,
        duration,
        errors: [],
      };

      logger.info('FixSuggestionAgent completed', {
        duration,
        suggestionCount: suggestions.length,
      });

      return result;
    } catch (error) {
      logger.error('FixSuggestionAgent failed', { error });

      return {
        success: false,
        suggestions: [],
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error : new Error(String(error))],
      };
    } finally {
      this.running = false;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private generateDetailedExplanation(analysis: Analysis): string {
    const explanations: Record<string, string> = {
      TypeError: 'A type error occurs when an operation is performed on a value of inappropriate type. This often happens when null/undefined values are accessed without checks, or when function arguments have unexpected types.',
      ReferenceError: 'A reference error occurs when code tries to access a variable that has not been declared. This can happen due to typos, scope issues, or missing imports.',
      NetworkError: 'Network errors indicate connectivity problems between services. Common causes include DNS failures, service downtime, firewall rules, or network congestion.',
      DatabaseError: 'Database errors can stem from connection pool exhaustion, slow queries, deadlocks, or schema mismatches. Check connection configuration and query performance.',
      MemoryError: 'Memory errors indicate the process is running out of heap space. This can be caused by memory leaks, large data processing, or insufficient heap allocation.',
      TimeoutError: 'Timeout errors occur when operations take longer than configured limits. This can indicate slow downstream services, database bottlenecks, or insufficient resources.',
      ValidationError: 'Validation errors mean input data does not meet expected criteria. Add input validation at API boundaries and provide clear error messages to clients.',
      AuthenticationError: 'Authentication errors indicate issues with credentials or tokens. Check token expiration, refresh logic, and authentication middleware configuration.',
    };

    for (const pattern of analysis.patterns) {
      if (explanations[pattern]) {
        return explanations[pattern];
      }
    }

    return `The error "${analysis.rootCause}" requires manual investigation. Review the stack trace and error context to identify the root cause.`;
  }
}
