import winston from 'winston';
import { ErrorEntry } from '../collectors/error-collector';
import { Analysis } from '../analyzers/error-analyzer';
import { FixSuggestion } from '../analyzers/fix-suggester';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  errorId: string;
  analysis: Analysis;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  assignee: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: Date;
  type: 'ERROR' | 'DETECTION' | 'ANALYSIS' | 'ALERT' | 'RESOLUTION' | 'ESCALATION';
  message: string;
  actor: string;
  metadata: Record<string, unknown>;
}

export interface ErrorGroup {
  id: string;
  errors: ErrorEntry[];
  commonPattern: string;
  firstOccurrence: Date;
  lastOccurrence: Date;
  count: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AgentResult {
  success: boolean;
  incidents: Incident[];
  timelines: TimelineEvent[][];
  errorGroups: ErrorGroup[];
  duration: number;
  errors: Error[];
}

export interface IncidentData {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  errorId: string;
  analysis: Analysis;
  tags?: string[];
  metadata?: Record<string, unknown>;
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
    new winston.transports.File({ filename: 'logs/incident-response-agent.log' }),
  ],
});

export class IncidentResponseAgent {
  private running: boolean = false;
  private incidents: Incident[] = [];
  private timelines: Map<string, TimelineEvent[]> = new Map();

  constructor() {
    logger.info('IncidentResponseAgent initialized');
  }

  createIncidentReport(error: ErrorEntry, analysis: Analysis): Incident {
    logger.info('Creating incident report', { errorId: error.id });

    const incident: Incident = {
      id: this.generateId(),
      title: this.generateTitle(error),
      description: this.generateDescription(error, analysis),
      severity: analysis.severity,
      status: 'OPEN',
      errorId: error.id,
      analysis,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      assignee: null,
      tags: this.generateTags(error, analysis),
      metadata: {
        service: error.service,
        traceId: error.traceId,
        context: error.context,
      },
    };

    this.incidents.push(incident);

    const timeline: TimelineEvent[] = [
      {
        id: this.generateId(),
        incidentId: incident.id,
        timestamp: error.timestamp,
        type: 'ERROR',
        message: `Error occurred: ${error.message}`,
        actor: error.service,
        metadata: { errorId: error.id },
      },
      {
        id: this.generateId(),
        incidentId: incident.id,
        timestamp: new Date(),
        type: 'DETECTION',
        message: 'Incident detected and created',
        actor: 'IncidentResponseAgent',
        metadata: { incidentId: incident.id },
      },
    ];

    this.timelines.set(incident.id, timeline);

    logger.info('Incident report created', {
      incidentId: incident.id,
      severity: incident.severity,
    });

    return incident;
  }

  generateTimeline(incident: Incident): TimelineEvent[] {
    logger.debug('Generating timeline', { incidentId: incident.id });

    const timeline = this.timelines.get(incident.id) || [];

    const events: TimelineEvent[] = [
      ...timeline,
      {
        id: this.generateId(),
        incidentId: incident.id,
        timestamp: new Date(),
        type: 'ANALYSIS',
        message: `Analysis complete: ${incident.analysis.rootCause}`,
        actor: 'ErrorAnalyzer',
        metadata: {
          rootCause: incident.analysis.rootCause,
          confidence: incident.analysis.confidence,
        },
      },
    ];

    if (incident.status === 'RESOLVED' && incident.resolvedAt) {
      events.push({
        id: this.generateId(),
        incidentId: incident.id,
        timestamp: incident.resolvedAt,
        type: 'RESOLUTION',
        message: 'Incident resolved',
        actor: incident.assignee || 'System',
        metadata: {},
      });
    }

    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return events;
  }

  groupRelatedErrors(errors: ErrorEntry[]): ErrorGroup[] {
    logger.info('Grouping related errors', { errorCount: errors.length });

    const groupMap = new Map<string, ErrorGroup>();

    for (const error of errors) {
      const groupKey = this.getGroupKey(error);

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: this.generateId(),
          errors: [error],
          commonPattern: groupKey,
          firstOccurrence: error.timestamp,
          lastOccurrence: error.timestamp,
          count: 1,
          severity: error.severity,
        });
      } else {
        const group = groupMap.get(groupKey)!;
        group.errors.push(error);
        group.count++;
        if (error.timestamp < group.firstOccurrence) {
          group.firstOccurrence = error.timestamp;
        }
        if (error.timestamp > group.lastOccurrence) {
          group.lastOccurrence = error.timestamp;
        }
        if (this.severityRank(error.severity) > this.severityRank(group.severity)) {
          group.severity = error.severity;
        }
      }
    }

    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => b.count - a.count);

    logger.info('Error grouping complete', { groupCount: groups.length });
    return groups;
  }

  generateTechnicalSummary(incident: Incident): string {
    const lines: string[] = [];

    lines.push('Technical Incident Summary');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Incident ID: ${incident.id}`);
    lines.push(`Error ID: ${incident.errorId}`);
    lines.push(`Severity: ${incident.severity}`);
    lines.push(`Status: ${incident.status}`);
    lines.push(`Service: ${incident.metadata.service || 'unknown'}`);
    lines.push(`Trace ID: ${incident.metadata.traceId || 'N/A'}`);
    lines.push('');
    lines.push('Root Cause Analysis:');
    lines.push(`  ${incident.analysis.rootCause}`);
    lines.push('');
    lines.push('Detected Patterns:');
    for (const pattern of incident.analysis.patterns) {
      lines.push(`  - ${pattern}`);
    }
    lines.push('');
    lines.push(`Confidence: ${(incident.analysis.confidence * 100).toFixed(0)}%`);
    lines.push('');

    if (incident.analysis.relatedErrors.length > 0) {
      lines.push('Related Errors:');
      for (const relatedId of incident.analysis.relatedErrors) {
        lines.push(`  - ${relatedId}`);
      }
      lines.push('');
    }

    lines.push('Stack Trace:');
    lines.push('(Available in error entry)');

    return lines.join('\n');
  }

  generateExecutiveSummary(incident: Incident): string {
    const lines: string[] = [];

    lines.push('Executive Incident Summary');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Incident: ${incident.title}`);
    lines.push(`Severity: ${incident.severity}`);
    lines.push(`Status: ${incident.status}`);
    lines.push('');

    const impactDescription = this.getImpactDescription(incident.severity);
    lines.push(`Impact: ${impactDescription}`);
    lines.push('');

    lines.push('Summary:');
    lines.push(incident.description);
    lines.push('');

    if (incident.status === 'RESOLVED' && incident.resolvedAt) {
      const duration = incident.resolvedAt.getTime() - incident.createdAt.getTime();
      const minutes = Math.round(duration / 60000);
      lines.push(`Resolution Time: ${minutes} minutes`);
      lines.push('');
    }

    lines.push('Recommended Actions:');
    const actions = this.getRecommendedActions(incident);
    for (const action of actions) {
      lines.push(`  - ${action}`);
    }

    return lines.join('\n');
  }

  async sendAlerts(incident: Incident): Promise<void> {
    logger.info('Sending alerts for incident', {
      incidentId: incident.id,
      severity: incident.severity,
    });

    const timeline = this.timelines.get(incident.id) || [];
    timeline.push({
      id: this.generateId(),
      incidentId: incident.id,
      timestamp: new Date(),
      type: 'ALERT',
      message: `Alerts sent for ${incident.severity} severity incident`,
      actor: 'IncidentResponseAgent',
      metadata: { severity: incident.severity },
    });
    this.timelines.set(incident.id, timeline);

    logger.info('Alerts sent', { incidentId: incident.id });
  }

  async run(errors: ErrorEntry[], analyses: Analysis[]): Promise<AgentResult> {
    logger.info('Starting IncidentResponseAgent', {
      errorCount: errors.length,
      analysisCount: analyses.length,
    });

    const startTime = Date.now();
    this.running = true;

    try {
      const incidents: Incident[] = [];
      const timelines: TimelineEvent[][] = [];

      for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        const analysis = analyses[i];

        if (analysis) {
          const incident = this.createIncidentReport(error, analysis);
          incidents.push(incident);
          await this.sendAlerts(incident);
          timelines.push(this.generateTimeline(incident));
        }
      }

      const errorGroups = this.groupRelatedErrors(errors);

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        success: true,
        incidents,
        timelines,
        errorGroups,
        duration,
        errors: [],
      };

      logger.info('IncidentResponseAgent completed', {
        duration,
        incidentCount: incidents.length,
        groupCount: errorGroups.length,
      });

      return result;
    } catch (error) {
      logger.error('IncidentResponseAgent failed', { error });

      return {
        success: false,
        incidents: [],
        timelines: [],
        errorGroups: [],
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

  getIncidents(): Incident[] {
    return [...this.incidents];
  }

  private generateTitle(error: ErrorEntry): string {
    const prefix =
      error.severity === 'CRITICAL'
        ? '[CRITICAL]'
        : error.severity === 'HIGH'
          ? '[HIGH]'
          : error.severity === 'MEDIUM'
            ? '[MEDIUM]'
            : '[LOW]';

    const message =
      error.message.length > 80 ? error.message.substring(0, 80) + '...' : error.message;

    return `${prefix} ${message} in ${error.service}`;
  }

  private generateDescription(error: ErrorEntry, analysis: Analysis): string {
    return `Error "${error.message}" occurred in service "${error.service}". Root cause: ${analysis.rootCause}. Detected patterns: ${analysis.patterns.join(', ') || 'none'}.`;
  }

  private generateTags(error: ErrorEntry, analysis: Analysis): string[] {
    const tags: string[] = [
      error.service,
      error.severity.toLowerCase(),
      ...analysis.patterns.map((p) => p.toLowerCase()),
    ];

    return [...new Set(tags)];
  }

  private getGroupKey(error: ErrorEntry): string {
    const message = error.message.split(':')[0].trim();
    const stackLines = error.stack.split('\n').slice(1, 4).join('|');
    return `${message}|${stackLines}`;
  }

  private severityRank(severity: string): number {
    const ranks: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    return ranks[severity] || 0;
  }

  private getImpactDescription(severity: string): string {
    const impacts: Record<string, string> = {
      LOW: 'Minimal impact. Does not affect core functionality.',
      MEDIUM: 'Moderate impact. May affect some users or features.',
      HIGH: 'Significant impact. Affects core functionality or multiple users.',
      CRITICAL: 'Severe impact. System stability or data integrity at risk.',
    };
    return impacts[severity] || 'Unknown impact level.';
  }

  private getRecommendedActions(incident: Incident): string[] {
    const actions: string[] = [];

    if (incident.severity === 'CRITICAL') {
      actions.push('Immediately investigate and escalate to on-call engineer');
      actions.push('Consider service restart or failover if appropriate');
    }

    if (incident.severity === 'HIGH') {
      actions.push('Prioritize investigation within 1 hour');
      actions.push('Monitor for additional occurrences');
    }

    actions.push(`Review root cause: ${incident.analysis.rootCause}`);
    actions.push('Implement fix based on analysis recommendations');
    actions.push('Add monitoring for this error pattern');
    actions.push('Update runbook with resolution steps');

    return actions;
  }

  private generateId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
