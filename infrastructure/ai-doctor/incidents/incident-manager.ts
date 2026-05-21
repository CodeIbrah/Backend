import winston from 'winston';
import { Analysis } from '../analyzers/error-analyzer';

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

export interface IncidentData {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  errorId: string;
  analysis: Analysis;
  tags?: string[];
  metadata?: Record<string, unknown>;
  assignee?: string;
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
    new winston.transports.File({ filename: 'logs/incident-manager.log' }),
  ],
});

export class IncidentManager {
  private incidents: Map<string, Incident> = new Map();

  constructor() {
    logger.info('IncidentManager initialized');
  }

  createIncident(data: IncidentData): Incident {
    logger.info('Creating incident', { title: data.title, severity: data.severity });

    const now = new Date();
    const incident: Incident = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: 'OPEN',
      errorId: data.errorId,
      analysis: data.analysis,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      assignee: data.assignee || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
    };

    this.incidents.set(incident.id, incident);

    logger.info('Incident created', {
      incidentId: incident.id,
      status: incident.status,
    });

    return incident;
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident {
    logger.info('Updating incident', { incidentId: id });

    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    const updatedIncident: Incident = {
      ...incident,
      ...updates,
      id: incident.id,
      updatedAt: new Date(),
    };

    if (updates.status && updates.status !== incident.status) {
      logger.info('Incident status changed', {
        incidentId: id,
        oldStatus: incident.status,
        newStatus: updates.status,
      });
    }

    this.incidents.set(id, updatedIncident);

    return updatedIncident;
  }

  resolveIncident(id: string): Incident {
    logger.info('Resolving incident', { incidentId: id });

    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    const resolvedIncident: Incident = {
      ...incident,
      status: 'RESOLVED',
      resolvedAt: new Date(),
      updatedAt: new Date(),
    };

    this.incidents.set(id, resolvedIncident);

    logger.info('Incident resolved', {
      incidentId: id,
      resolvedAt: resolvedIncident.resolvedAt,
    });

    return resolvedIncident;
  }

  closeIncident(id: string): Incident {
    logger.info('Closing incident', { incidentId: id });

    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    if (incident.status !== 'RESOLVED') {
      throw new Error(`Cannot close incident with status: ${incident.status}. Must be RESOLVED first.`);
    }

    const closedIncident: Incident = {
      ...incident,
      status: 'CLOSED',
      updatedAt: new Date(),
    };

    this.incidents.set(id, closedIncident);

    logger.info('Incident closed', { incidentId: id });
    return closedIncident;
  }

  getActiveIncidents(): Incident[] {
    logger.debug('Getting active incidents');

    const active = Array.from(this.incidents.values()).filter(
      (i) => i.status === 'OPEN' || i.status === 'INVESTIGATING',
    );

    active.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    logger.debug('Active incidents retrieved', { count: active.length });
    return active;
  }

  getResolvedIncidents(): Incident[] {
    logger.debug('Getting resolved incidents');

    const resolved = Array.from(this.incidents.values()).filter(
      (i) => i.status === 'RESOLVED' || i.status === 'CLOSED',
    );

    resolved.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    logger.debug('Resolved incidents retrieved', { count: resolved.length });
    return resolved;
  }

  getIncidentsBySeverity(severity: string): Incident[] {
    logger.debug('Getting incidents by severity', { severity });

    const incidents = Array.from(this.incidents.values()).filter(
      (i) => i.severity === severity.toUpperCase(),
    );

    incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    logger.debug('Incidents by severity retrieved', {
      severity,
      count: incidents.length,
    });

    return incidents;
  }

  getIncidentById(id: string): Incident | null {
    return this.incidents.get(id) || null;
  }

  getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  assignIncident(id: string, assignee: string): Incident {
    logger.info('Assigning incident', { incidentId: id, assignee });

    const incident = this.incidents.get(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    const updated: Incident = {
      ...incident,
      assignee,
      status: incident.status === 'OPEN' ? 'INVESTIGATING' : incident.status,
      updatedAt: new Date(),
    };

    this.incidents.set(id, updated);
    return updated;
  }

  getIncidentsByService(service: string): Incident[] {
    logger.debug('Getting incidents by service', { service });

    return Array.from(this.incidents.values()).filter(
      (i) => i.metadata.service === service,
    );
  }

  getIncidentsByTag(tag: string): Incident[] {
    logger.debug('Getting incidents by tag', { tag });

    return Array.from(this.incidents.values()).filter(
      (i) => i.tags.includes(tag),
    );
  }

  getStats(): {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } {
    const incidents = Array.from(this.incidents.values());

    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === 'OPEN').length,
      investigating: incidents.filter((i) => i.status === 'INVESTIGATING').length,
      resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
      closed: incidents.filter((i) => i.status === 'CLOSED').length,
      critical: incidents.filter((i) => i.severity === 'CRITICAL').length,
      high: incidents.filter((i) => i.severity === 'HIGH').length,
      medium: incidents.filter((i) => i.severity === 'MEDIUM').length,
      low: incidents.filter((i) => i.severity === 'LOW').length,
    };
  }

  clear(): void {
    logger.warn('Clearing all incidents');
    this.incidents.clear();
  }

  private generateId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
