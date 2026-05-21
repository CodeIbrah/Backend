import winston from 'winston';
import { ErrorEntry } from '../collectors/error-collector';
import { Analysis } from '../analyzers/error-analyzer';
import { FixSuggestion } from '../analyzers/fix-suggester';
import { Incident } from '../agents/incident-response-agent';

export interface Pattern {
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frequency: number;
  examples: string[];
}

export interface KnowledgeEntry {
  id: string;
  type: 'error' | 'fix' | 'pattern' | 'incident';
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
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
    new winston.transports.File({ filename: 'logs/knowledge-base.log' }),
  ],
});

export class KnowledgeBase {
  private errors: Map<string, { error: ErrorEntry; analysis: Analysis }> = new Map();
  private fixes: Map<string, FixSuggestion> = new Map();
  private patterns: Map<string, Pattern> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private learningHistory: Map<string, { error: ErrorEntry; fix: FixSuggestion }> = new Map();

  constructor() {
    logger.info('KnowledgeBase initialized');
  }

  saveError(error: ErrorEntry, analysis: Analysis): void {
    logger.debug('Saving error to knowledge base', { errorId: error.id });

    this.errors.set(error.id, {
      error,
      analysis,
    });

    logger.debug('Error saved', {
      totalErrors: this.errors.size,
    });
  }

  saveFix(fix: FixSuggestion): void {
    logger.debug('Saving fix to knowledge base');

    const id = this.generateId();
    this.fixes.set(id, fix);

    logger.debug('Fix saved', {
      totalFixes: this.fixes.size,
    });
  }

  savePattern(pattern: Pattern): void {
    logger.debug('Saving pattern to knowledge base', { patternName: pattern.name });

    this.patterns.set(pattern.name, pattern);

    logger.debug('Pattern saved', {
      totalPatterns: this.patterns.size,
    });
  }

  saveIncident(incident: Incident): void {
    logger.debug('Saving incident to knowledge base', { incidentId: incident.id });

    this.incidents.set(incident.id, incident);

    logger.debug('Incident saved', {
      totalIncidents: this.incidents.size,
    });
  }

  searchSimilar(error: ErrorEntry): ErrorEntry[] {
    logger.debug('Searching for similar errors', { errorId: error.id });

    const similar: ErrorEntry[] = [];

    for (const [, stored] of this.errors) {
      const similarity = this.calculateSimilarity(error, stored.error);
      if (similarity > 0.5) {
        similar.push(stored.error);
      }
    }

    similar.sort((a, b) => {
      const simA = this.calculateSimilarity(error, a);
      const simB = this.calculateSimilarity(error, b);
      return simB - simA;
    });

    logger.debug('Similar errors found', {
      count: similar.length,
      errorId: error.id,
    });

    return similar.slice(0, 10);
  }

  getKnownPatterns(): Pattern[] {
    logger.debug('Getting known patterns', { count: this.patterns.size });
    return Array.from(this.patterns.values());
  }

  getHistoricalIncidents(): Incident[] {
    logger.debug('Getting historical incidents', { count: this.incidents.size });
    return Array.from(this.incidents.values());
  }

  getAppliedSolutions(): FixSuggestion[] {
    logger.debug('Getting applied solutions', { count: this.fixes.size });
    return Array.from(this.fixes.values());
  }

  learn(error: ErrorEntry, fix: FixSuggestion): void {
    logger.info('Learning from error-fix pair', {
      errorId: error.id,
    });

    this.learningHistory.set(error.id, { error, fix });

    for (const pattern of this.extractPatterns(error)) {
      const existing = this.patterns.get(pattern);
      if (existing) {
        existing.frequency++;
      } else {
        this.patterns.set(pattern, {
          name: pattern,
          description: `Learned pattern from error: ${error.message}`,
          severity: error.severity,
          frequency: 1,
          examples: [error.message],
        });
      }
    }

    logger.info('Learning complete', {
      totalLearnings: this.learningHistory.size,
      totalPatterns: this.patterns.size,
    });
  }

  getErrorAnalysis(errorId: string): Analysis | null {
    const stored = this.errors.get(errorId);
    return stored ? stored.analysis : null;
  }

  getErrorById(errorId: string): ErrorEntry | null {
    const stored = this.errors.get(errorId);
    return stored ? stored.error : null;
  }

  getIncidentById(incidentId: string): Incident | null {
    return this.incidents.get(incidentId) || null;
  }

  getStats(): {
    errorCount: number;
    fixCount: number;
    patternCount: number;
    incidentCount: number;
    learningCount: number;
  } {
    return {
      errorCount: this.errors.size,
      fixCount: this.fixes.size,
      patternCount: this.patterns.size,
      incidentCount: this.incidents.size,
      learningCount: this.learningHistory.size,
    };
  }

  clear(): void {
    logger.warn('Clearing knowledge base');
    this.errors.clear();
    this.fixes.clear();
    this.patterns.clear();
    this.incidents.clear();
    this.learningHistory.clear();
  }

  private calculateSimilarity(error1: ErrorEntry, error2: ErrorEntry): number {
    let score = 0;

    if (error1.message === error2.message) {
      score += 0.5;
    } else if (error1.message.includes(error2.message) || error2.message.includes(error1.message)) {
      score += 0.3;
    } else {
      const messageSimilarity = this.stringSimilarity(error1.message, error2.message);
      score += messageSimilarity * 0.3;
    }

    if (error1.service === error2.service) {
      score += 0.2;
    }

    if (error1.severity === error2.severity) {
      score += 0.1;
    }

    const stackSimilarity = this.stringSimilarity(error1.stack, error2.stack);
    score += stackSimilarity * 0.2;

    return Math.min(score, 1.0);
  }

  private stringSimilarity(s1: string, s2: string): number {
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  private extractPatterns(error: ErrorEntry): string[] {
    const patterns: string[] = [];

    const errorTypeMatch = error.message.match(/^(\w+Error)/);
    if (errorTypeMatch) {
      patterns.push(errorTypeMatch[1]);
    }

    if (error.stack.includes('node_modules')) {
      patterns.push('ThirdPartyError');
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      patterns.push('NetworkError');
    }

    if (error.message.includes('timeout')) {
      patterns.push('TimeoutError');
    }

    return [...new Set(patterns)];
  }

  private generateId(): string {
    return `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
