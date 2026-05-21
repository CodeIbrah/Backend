import winston from 'winston';
import { Incident } from '../agents/incident-response-agent';
import { DiagnosticResult } from '../diagnostics/diagnostic-engine';
import { Analysis } from '../analyzers/error-analyzer';
import { FixSuggestion } from '../analyzers/fix-suggester';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/report-generator.log' }),
  ],
});

export class ReportGenerator {
  generateIncidentReport(incident: Incident): string {
    logger.info('Generating incident report', { incidentId: incident.id });

    const lines: string[] = [];

    lines.push('# Incident Report');
    lines.push('');
    lines.push(`## Overview`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Incident ID | ${incident.id} |`);
    lines.push(`| Error ID | ${incident.errorId} |`);
    lines.push(`| Title | ${incident.title} |`);
    lines.push(`| Severity | ${incident.severity} |`);
    lines.push(`| Status | ${incident.status} |`);
    lines.push(`| Created | ${incident.createdAt.toISOString()} |`);
    lines.push(`| Updated | ${incident.updatedAt.toISOString()} |`);
    lines.push(`| Assignee | ${incident.assignee || 'Unassigned'} |`);
    lines.push('');

    lines.push('## Description');
    lines.push('');
    lines.push(incident.description);
    lines.push('');

    lines.push('## Root Cause Analysis');
    lines.push('');
    lines.push(`**Root Cause:** ${incident.analysis.rootCause}`);
    lines.push(`**Confidence:** ${(incident.analysis.confidence * 100).toFixed(0)}%`);
    lines.push('');

    lines.push('### Detected Patterns');
    lines.push('');
    if (incident.analysis.patterns.length > 0) {
      for (const pattern of incident.analysis.patterns) {
        lines.push(`- ${pattern}`);
      }
    } else {
      lines.push('No patterns detected');
    }
    lines.push('');

    lines.push('## Tags');
    lines.push('');
    lines.push(incident.tags.map((t) => `\`${t}\``).join(', '));
    lines.push('');

    lines.push('## Metadata');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(incident.metadata, null, 2));
    lines.push('```');
    lines.push('');

    logger.info('Incident report generated', { incidentId: incident.id });
    return lines.join('\n');
  }

  generateDiagnosticReport(result: DiagnosticResult): string {
    logger.info('Generating diagnostic report');

    const lines: string[] = [];

    lines.push('# Diagnostic Report');
    lines.push('');
    lines.push(`**Generated:** ${result.timestamp.toISOString()}`);
    lines.push(`**Overall Status:** ${result.overall}`);
    lines.push(`**Duration:** ${result.duration}ms`);
    lines.push('');

    lines.push('## Health Checks');
    lines.push('');
    lines.push('| Service | Status | Latency | Message |');
    lines.push('| --- | --- | --- | --- |');

    for (const check of result.checks) {
      const statusIcon = check.status === 'HEALTHY' ? 'OK' :
        check.status === 'DEGRADED' ? 'WARN' : 'FAIL';
      lines.push(`| ${check.service} | ${statusIcon} | ${check.latency}ms | ${check.message} |`);
    }

    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    for (const rec of result.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');

    logger.info('Diagnostic report generated');
    return lines.join('\n');
  }

  generateAnalysisReport(analyses: Analysis[]): string {
    logger.info('Generating analysis report', { analysisCount: analyses.length });

    const lines: string[] = [];

    lines.push('# Error Analysis Report');
    lines.push('');
    lines.push(`**Total Errors Analyzed:** ${analyses.length}`);
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');

    const severityCounts = this.countSeverities(analyses);
    lines.push('## Severity Distribution');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('| --- | --- |');
    lines.push(`| CRITICAL | ${severityCounts.CRITICAL} |`);
    lines.push(`| HIGH | ${severityCounts.HIGH} |`);
    lines.push(`| MEDIUM | ${severityCounts.MEDIUM} |`);
    lines.push(`| LOW | ${severityCounts.LOW} |`);
    lines.push('');

    lines.push('## Pattern Summary');
    lines.push('');
    const patternCounts = this.countPatterns(analyses);
    const sortedPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);

    lines.push('| Pattern | Occurrences |');
    lines.push('| --- | --- |');
    for (const [pattern, count] of sortedPatterns) {
      lines.push(`| ${pattern} | ${count} |`);
    }
    lines.push('');

    lines.push('## Detailed Analyses');
    lines.push('');

    for (const analysis of analyses) {
      lines.push(`### Error: ${analysis.errorId}`);
      lines.push('');
      lines.push(`- **Root Cause:** ${analysis.rootCause}`);
      lines.push(`- **Severity:** ${analysis.severity}`);
      lines.push(`- **Confidence:** ${(analysis.confidence * 100).toFixed(0)}%`);
      lines.push(`- **Patterns:** ${analysis.patterns.join(', ') || 'None'}`);
      lines.push(`- **Related Errors:** ${analysis.relatedErrors.length}`);
      lines.push('');
    }

    logger.info('Analysis report generated');
    return lines.join('\n');
  }

  generateExecutiveReport(incidents: Incident[]): string {
    logger.info('Generating executive report', { incidentCount: incidents.length });

    const lines: string[] = [];

    lines.push('# Executive Error Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(`**Total Incidents:** ${incidents.length}`);
    lines.push('');

    const severityCounts = this.countIncidentSeverities(incidents);
    const statusCounts = this.countIncidentStatuses(incidents);

    lines.push('## Incident Summary');
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('| --- | --- |');
    lines.push(`| CRITICAL | ${severityCounts.CRITICAL} |`);
    lines.push(`| HIGH | ${severityCounts.HIGH} |`);
    lines.push(`| MEDIUM | ${severityCounts.MEDIUM} |`);
    lines.push(`| LOW | ${severityCounts.LOW} |`);
    lines.push('');

    lines.push('| Status | Count |');
    lines.push('| --- | --- |');
    lines.push(`| OPEN | ${statusCounts.OPEN} |`);
    lines.push(`| INVESTIGATING | ${statusCounts.INVESTIGATING} |`);
    lines.push(`| RESOLVED | ${statusCounts.RESOLVED} |`);
    lines.push(`| CLOSED | ${statusCounts.CLOSED} |`);
    lines.push('');

    lines.push('## Critical Incidents');
    lines.push('');
    const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL');
    if (criticalIncidents.length > 0) {
      for (const incident of criticalIncidents) {
        lines.push(`### ${incident.title}`);
        lines.push('');
        lines.push(`- **Status:** ${incident.status}`);
        lines.push(`- **Root Cause:** ${incident.analysis.rootCause}`);
        lines.push(`- **Created:** ${incident.createdAt.toISOString()}`);
        lines.push('');
      }
    } else {
      lines.push('No critical incidents');
      lines.push('');
    }

    lines.push('## Top Error Patterns');
    lines.push('');
    const allPatterns = this.countAllPatterns(incidents);
    const topPatterns = Object.entries(allPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    lines.push('| Pattern | Occurrences |');
    lines.push('| --- | --- |');
    for (const [pattern, count] of topPatterns) {
      lines.push(`| ${pattern} | ${count} |`);
    }
    lines.push('');

    lines.push('## Recommendations');
    lines.push('');
    const recommendations = this.generateExecutiveRecommendations(incidents);
    for (const rec of recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');

    logger.info('Executive report generated');
    return lines.join('\n');
  }

  private countSeverities(analyses: Analysis[]): Record<string, number> {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const analysis of analyses) {
      counts[analysis.severity]++;
    }
    return counts;
  }

  private countPatterns(analyses: Analysis[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const analysis of analyses) {
      for (const pattern of analysis.patterns) {
        counts[pattern] = (counts[pattern] || 0) + 1;
      }
    }
    return counts;
  }

  private countIncidentSeverities(incidents: Incident[]): Record<string, number> {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const incident of incidents) {
      counts[incident.severity]++;
    }
    return counts;
  }

  private countIncidentStatuses(incidents: Incident[]): Record<string, number> {
    const counts = { OPEN: 0, INVESTIGATING: 0, RESOLVED: 0, CLOSED: 0 };
    for (const incident of incidents) {
      counts[incident.status]++;
    }
    return counts;
  }

  private countAllPatterns(incidents: Incident[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const incident of incidents) {
      for (const pattern of incident.analysis.patterns) {
        counts[pattern] = (counts[pattern] || 0) + 1;
      }
    }
    return counts;
  }

  private generateExecutiveRecommendations(incidents: Incident[]): string[] {
    const recommendations: string[] = [];
    const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
    const openCount = incidents.filter((i) => i.status === 'OPEN').length;

    if (criticalCount > 0) {
      recommendations.push(`Address ${criticalCount} critical incident(s) immediately`);
    }

    if (openCount > 5) {
      recommendations.push(`High number of open incidents (${openCount}) - consider increasing team capacity`);
    }

    const patterns = this.countAllPatterns(incidents);
    const topPattern = Object.entries(patterns).sort((a, b) => b[1] - a[1])[0];
    if (topPattern && topPattern[1] > 3) {
      recommendations.push(`Most frequent pattern "${topPattern[0]}" (${topPattern[1]} occurrences) - prioritize root cause fix`);
    }

    recommendations.push('Review and update error handling patterns across services');
    recommendations.push('Implement automated alerting for recurring error patterns');
    recommendations.push('Schedule regular error review meetings');

    return recommendations;
  }
}
