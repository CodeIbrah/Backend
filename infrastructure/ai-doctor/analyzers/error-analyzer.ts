import winston from 'winston';
import { ErrorEntry } from '../collectors/error-collector';

export interface ParsedStack {
  file: string;
  line: number;
  column: number;
  method: string;
}

export interface Analysis {
  errorId: string;
  rootCause: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  patterns: string[];
  confidence: number;
  relatedErrors: string[];
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
    new winston.transports.File({ filename: 'logs/error-analyzer.log' }),
  ],
});

export class ErrorAnalyzer {
  private readonly patternRules: Map<string, RegExp> = new Map([
    ['TypeError', /TypeError/],
    ['ReferenceError', /ReferenceError/],
    ['SyntaxError', /SyntaxError/],
    ['RangeError', /RangeError/],
    ['NetworkError', /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET/],
    ['DatabaseError', /ECONNREFUSED.*5432|query.*timeout|deadlock/],
    ['MemoryError', /heap.*out|allocation.*failed|heap.*limit/],
    ['TimeoutError', /timeout|timed?\s*out/],
    ['ValidationError', /validation.*failed|invalid.*input/],
    ['AuthenticationError', /unauthorized|forbidden|invalid.*token/],
  ]);

  analyze(error: ErrorEntry): Promise<Analysis> {
    logger.info('Analyzing error', { errorId: error.id });

    const patterns = this.detectPatterns(error);
    const severity = this.classifySeverity(error);
    const parsedStack = this.parseStackTrace(error.stack);

    const analysis: Analysis = {
      errorId: error.id,
      rootCause: this.inferRootCause(error, patterns, parsedStack),
      severity,
      patterns,
      confidence: this.calculateConfidence(patterns, parsedStack),
      relatedErrors: [],
    };

    logger.info('Analysis complete', {
      errorId: analysis.errorId,
      rootCause: analysis.rootCause,
      severity: analysis.severity,
      confidence: analysis.confidence,
    });

    return Promise.resolve(analysis);
  }

  parseStackTrace(stack: string): ParsedStack[] {
    if (!stack) return [];

    const parsed: ParsedStack[] = [];
    const lines = stack.split('\n');

    for (const line of lines) {
      const match = line.match(
        /at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|native)/,
      );
      if (match) {
        parsed.push({
          method: match[1] || '<anonymous>',
          file: match[2] || 'native',
          line: parseInt(match[3], 10) || 0,
          column: parseInt(match[4], 10) || 0,
        });
      }
    }

    logger.debug('Parsed stack trace', { frameCount: parsed.length });
    return parsed;
  }

  detectPatterns(error: ErrorEntry): string[] {
    const patterns: string[] = [];

    for (const [name, regex] of this.patternRules) {
      if (
        regex.test(error.message) ||
        regex.test(error.stack) ||
        regex.test(JSON.stringify(error.context))
      ) {
        patterns.push(name);
      }
    }

    if (error.stack.includes('node_modules')) {
      patterns.push('ThirdPartyLibraryError');
    }

    if (error.message.includes('ENOENT')) {
      patterns.push('FileNotFoundError');
    }

    if (error.message.includes('EACCES')) {
      patterns.push('PermissionError');
    }

    if (error.context && (error.context as Record<string, unknown>).retries) {
      patterns.push('RetryExhausted');
    }

    logger.debug('Detected patterns', { errorId: error.id, patterns });
    return patterns;
  }

  classifySeverity(error: ErrorEntry): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const message = error.message.toLowerCase();
    const stack = error.stack.toLowerCase();

    if (
      message.includes('out of memory') ||
      stack.includes('fatal') ||
      message.includes('segfault') ||
      message.includes('panic')
    ) {
      return 'CRITICAL';
    }

    if (
      message.includes('database') ||
      message.includes('connection refused') ||
      message.includes('deadlock') ||
      message.includes('unauthorized')
    ) {
      return 'HIGH';
    }

    if (
      message.includes('timeout') ||
      message.includes('validation') ||
      message.includes('not found')
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  detectRootCause(
    error: ErrorEntry,
    context: Record<string, unknown>,
  ): Promise<string> {
    logger.info('Detecting root cause', { errorId: error.id });

    const patterns = this.detectPatterns(error);
    const parsedStack = this.parseStackTrace(error.stack);

    const rootCause = this.inferRootCause(error, patterns, parsedStack, context);

    return Promise.resolve(rootCause);
  }

  private inferRootCause(
    error: ErrorEntry,
    patterns: string[],
    parsedStack: ParsedStack[],
    context: Record<string, unknown> = {},
  ): string {
    if (patterns.includes('NetworkError')) {
      return 'Network connectivity issue - service unreachable or DNS resolution failure';
    }

    if (patterns.includes('DatabaseError')) {
      return 'Database connection or query issue - check connection pool and query performance';
    }

    if (patterns.includes('MemoryError')) {
      return 'Memory exhaustion - possible memory leak or insufficient heap allocation';
    }

    if (patterns.includes('TimeoutError')) {
      return 'Operation exceeded time limit - check downstream service latency or increase timeout';
    }

    if (patterns.includes('ValidationError')) {
      return 'Input validation failure - client sent malformed or invalid data';
    }

    if (patterns.includes('AuthenticationError')) {
      return 'Authentication or authorization failure - invalid credentials or expired token';
    }

    if (patterns.includes('FileNotFoundError')) {
      return 'File or resource not found - check file paths and permissions';
    }

    if (patterns.includes('ThirdPartyLibraryError')) {
      const frame = parsedStack.find((f) => f.file.includes('node_modules'));
      return `Third-party library error in ${frame?.file || 'unknown module'} - check library version and known issues`;
    }

    if (parsedStack.length > 0) {
      const topFrame = parsedStack[0];
      return `Error originated at ${topFrame.file}:${topFrame.line} in method ${topFrame.method}`;
    }

    return 'Unknown root cause - insufficient context for analysis';
  }

  private calculateConfidence(
    patterns: string[],
    parsedStack: ParsedStack[],
  ): number {
    let confidence = 0.5;

    if (patterns.length > 0) confidence += 0.2;
    if (parsedStack.length > 0) confidence += 0.1;
    if (patterns.length > 2) confidence += 0.1;
    if (parsedStack.some((f) => f.line > 0)) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}
