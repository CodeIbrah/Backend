import winston from 'winston';
import { ErrorEntry } from '../collectors/error-collector';
import { ErrorAnalyzer, Analysis, ParsedStack } from './error-analyzer';

export interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  service: string;
  metadata: Record<string, unknown>;
}

export interface Pattern {
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frequency: number;
  examples: string[];
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentResult {
  success: boolean;
  analyses: Analysis[];
  patterns: Pattern[];
  severityMap: Map<string, Severity>;
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
    new winston.transports.File({ filename: 'logs/error-analysis-agent.log' }),
  ],
});

export class ErrorAnalysisAgent {
  private analyzer: ErrorAnalyzer;
  private running: boolean = false;

  constructor(analyzer?: ErrorAnalyzer) {
    this.analyzer = analyzer || new ErrorAnalyzer();
    logger.info('ErrorAnalysisAgent initialized');
  }

  async readLogs(service: string): Promise<LogEntry[]> {
    logger.info('Reading logs for service', { service });

    try {
      const logs: LogEntry[] = [];

      logger.debug('Log read complete', {
        service,
        entryCount: logs.length,
      });

      return logs;
    } catch (error) {
      logger.error('Failed to read logs', { service, error });
      return [];
    }
  }

  async analyzeStackTraces(errors: ErrorEntry[]): Promise<Analysis[]> {
    logger.info('Analyzing stack traces', { errorCount: errors.length });

    const analyses: Analysis[] = [];

    for (const error of errors) {
      try {
        const analysis = await this.analyzer.analyze(error);
        analyses.push(analysis);
      } catch (error) {
        logger.error('Failed to analyze error', {
          errorId: error.id,
          error,
        });
      }
    }

    logger.info('Stack trace analysis complete', {
      analyzedCount: analyses.length,
      totalErrors: errors.length,
    });

    return analyses;
  }

  detectPatterns(errors: ErrorEntry[]): Pattern[] {
    logger.info('Detecting patterns across errors', { errorCount: errors.length });

    const patternMap = new Map<string, Pattern>();

    for (const error of errors) {
      const detectedPatterns = this.analyzer.detectPatterns(error);

      for (const patternName of detectedPatterns) {
        if (!patternMap.has(patternName)) {
          patternMap.set(patternName, {
            name: patternName,
            description: this.getPatternDescription(patternName),
            severity: this.analyzer.classifySeverity(error),
            frequency: 1,
            examples: [error.message],
          });
        } else {
          const pattern = patternMap.get(patternName)!;
          pattern.frequency++;
          if (pattern.examples.length < 5) {
            pattern.examples.push(error.message);
          }
        }
      }
    }

    const patterns = Array.from(patternMap.values());
    patterns.sort((a, b) => b.frequency - a.frequency);

    logger.info('Pattern detection complete', { patternCount: patterns.length });
    return patterns;
  }

  classifySeverity(errors: ErrorEntry[]): Map<string, Severity> {
    logger.info('Classifying severities', { errorCount: errors.length });

    const severityMap = new Map<string, Severity>();

    for (const error of errors) {
      const severity = this.analyzer.classifySeverity(error);
      severityMap.set(error.id, severity);
    }

    logger.info('Severity classification complete', {
      severityMap,
    });

    return severityMap;
  }

  async detectRootCause(error: ErrorEntry): Promise<string> {
    logger.info('Detecting root cause', { errorId: error.id });

    const context: Record<string, unknown> = {
      service: error.service,
      traceId: error.traceId,
      ...error.context,
    };

    return this.analyzer.detectRootCause(error, context);
  }

  async run(errors: ErrorEntry[]): Promise<AgentResult> {
    logger.info('Starting ErrorAnalysisAgent', { errorCount: errors.length });

    const startTime = Date.now();
    this.running = true;

    try {
      const analyses = await this.analyzeStackTraces(errors);
      const patterns = this.detectPatterns(errors);
      const severityMap = this.classifySeverity(errors);

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        success: true,
        analyses,
        patterns,
        severityMap,
        duration,
        errors: [],
      };

      logger.info('ErrorAnalysisAgent completed', {
        duration,
        analysisCount: analyses.length,
        patternCount: patterns.length,
      });

      return result;
    } catch (error) {
      logger.error('ErrorAnalysisAgent failed', { error });

      return {
        success: false,
        analyses: [],
        patterns: [],
        severityMap: new Map(),
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

  private getPatternDescription(patternName: string): string {
    const descriptions: Record<string, string> = {
      TypeError: 'Type mismatch or invalid operation on a value',
      ReferenceError: 'Reference to an undefined variable or property',
      SyntaxError: 'Invalid syntax in code or data',
      RangeError: 'Value outside allowed range',
      NetworkError: 'Network connectivity or DNS resolution failure',
      DatabaseError: 'Database connection, query, or transaction issue',
      MemoryError: 'Memory exhaustion or allocation failure',
      TimeoutError: 'Operation exceeded configured time limit',
      ValidationError: 'Input data failed validation rules',
      AuthenticationError: 'Authentication or authorization failure',
      ThirdPartyLibraryError: 'Error originating from external dependency',
      FileNotFoundError: 'File or resource not found at expected path',
      PermissionError: 'Insufficient permissions for operation',
      RetryExhausted: 'All retry attempts exhausted without success',
    };

    return descriptions[patternName] || `Unknown pattern: ${patternName}`;
  }
}
