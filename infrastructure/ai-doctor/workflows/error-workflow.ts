import winston from 'winston';
import { ErrorCollector, ErrorEntry } from '../collectors/error-collector';
import { ErrorAnalyzer, Analysis } from '../analyzers/error-analyzer';
import { FixSuggester, FixSuggestion } from '../analyzers/fix-suggester';
import { IncidentResponseAgent, Incident } from '../agents/incident-response-agent';
import { DiagnosticEngine, DiagnosticResult } from '../diagnostics/diagnostic-engine';
import { ReportGenerator } from '../reporters/report-generator';
import { KnowledgeBase } from '../memory/knowledge-base';
import { AlertService, AlertConfig } from '../integrations/alert-service';

export interface WorkflowStep {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}

export interface WorkflowResult {
  success: boolean;
  incident: Incident | null;
  analysis: Analysis | null;
  fix: FixSuggestion | null;
  alerts: string[];
  report: string | null;
  steps: WorkflowStep[];
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
    new winston.transports.File({ filename: 'logs/error-workflow.log' }),
  ],
});

export class ErrorWorkflow {
  private collector: ErrorCollector;
  private analyzer: ErrorAnalyzer;
  private suggester: FixSuggester;
  private incidentAgent: IncidentResponseAgent;
  private diagnosticEngine: DiagnosticEngine;
  private reportGenerator: ReportGenerator;
  private knowledgeBase: KnowledgeBase;
  private alertService: AlertService;
  private alertConfig: AlertConfig | null;

  constructor(options?: {
    collector?: ErrorCollector;
    analyzer?: ErrorAnalyzer;
    suggester?: FixSuggester;
    incidentAgent?: IncidentResponseAgent;
    diagnosticEngine?: DiagnosticEngine;
    reportGenerator?: ReportGenerator;
    knowledgeBase?: KnowledgeBase;
    alertService?: AlertService;
    alertConfig?: AlertConfig;
  }) {
    this.collector = options?.collector || new ErrorCollector();
    this.analyzer = options?.analyzer || new ErrorAnalyzer();
    this.suggester = options?.suggester || new FixSuggester();
    this.incidentAgent = options?.incidentAgent || new IncidentResponseAgent();
    this.diagnosticEngine = options?.diagnosticEngine || new DiagnosticEngine();
    this.reportGenerator = options?.reportGenerator || new ReportGenerator();
    this.knowledgeBase = options?.knowledgeBase || new KnowledgeBase();
    this.alertService = options?.alertService || new AlertService();
    this.alertConfig = options?.alertConfig || null;

    logger.info('ErrorWorkflow initialized');
  }

  async execute(error: Error, context: Record<string, unknown> = {}): Promise<WorkflowResult> {
    logger.info('Starting error workflow', {
      message: error.message,
      service: context.service || 'unknown',
    });

    const startTime = Date.now();
    const steps: WorkflowStep[] = this.initializeSteps();
    const errors: Error[] = [];
    let errorEntry: ErrorEntry | null = null;
    let analysis: Analysis | null = null;
    let fix: FixSuggestion | null = null;
    let incident: Incident | null = null;
    const alerts: string[] = [];
    let report: string | null = null;

    try {
      // Step 1: Capture
      await this.runStep(steps, 'capture', async () => {
        this.collector.collect(error, context);
        logger.debug('Error captured');
      });

      // Step 2: Log
      await this.runStep(steps, 'log', async () => {
        const recentErrors = this.collector.getRecentErrors(1);
        errorEntry = recentErrors[0] || null;
        if (!errorEntry) {
          throw new Error('Failed to retrieve captured error');
        }
        logger.debug('Error logged', { errorId: errorEntry.id });
      });

      // Step 3: Trace
      await this.runStep(steps, 'trace', async () => {
        if (!errorEntry) throw new Error('No error entry available');
        const parsedStack = this.analyzer.parseStackTrace(errorEntry.stack);
        logger.debug('Stack trace parsed', { frameCount: parsedStack.length });
      });

      // Step 4: Analyze
      await this.runStep(steps, 'analyze', async () => {
        if (!errorEntry) throw new Error('No error entry available');
        analysis = await this.analyzer.analyze(errorEntry);
        logger.debug('Error analyzed', { errorId: errorEntry.id });
      });

      // Step 5: Classify
      await this.runStep(steps, 'classify', async () => {
        if (!errorEntry || !analysis) throw new Error('Analysis not available');
        const severity = this.analyzer.classifySeverity(errorEntry);
        errorEntry.severity = severity;
        analysis.severity = severity;
        logger.debug('Severity classified', { severity });
      });

      // Step 6: Diagnose
      await this.runStep(steps, 'diagnose', async () => {
        if (!errorEntry) throw new Error('No error entry available');
        const rootCause = await this.analyzer.detectRootCause(errorEntry, context);
        if (analysis) {
          analysis.rootCause = rootCause;
        }
        logger.debug('Root cause diagnosed', { rootCause });
      });

      // Step 7: Suggest Fix
      await this.runStep(steps, 'suggestFix', async () => {
        if (!analysis) throw new Error('Analysis not available');
        fix = await this.suggester.suggestFix(analysis);
        logger.debug('Fix suggested', { priority: fix.priority });
      });

      // Step 8: Create Incident
      await this.runStep(steps, 'createIncident', async () => {
        if (!errorEntry || !analysis) throw new Error('Required data not available');
        incident = this.incidentAgent.createIncidentReport(errorEntry, analysis);
        logger.debug('Incident created', { incidentId: incident.id });
      });

      // Step 9: Alert
      await this.runStep(steps, 'alert', async () => {
        if (!incident) throw new Error('Incident not available');
        await this.incidentAgent.sendAlerts(incident);

        if (this.alertConfig) {
          await this.alertService.sendAlert(this.alertConfig, incident);
        }

        alerts.push(`Alert sent for incident ${incident.id}`);
        logger.debug('Alerts sent');
      });

      // Step 10: Save History
      await this.runStep(steps, 'saveHistory', async () => {
        if (!errorEntry || !analysis || !fix || !incident) {
          throw new Error('Required data not available');
        }
        this.knowledgeBase.saveError(errorEntry, analysis);
        this.knowledgeBase.saveFix(fix);
        this.knowledgeBase.saveIncident(incident);
        this.knowledgeBase.learn(errorEntry, fix);
        logger.debug('History saved to knowledge base');
      });

      // Step 11: Generate Report
      await this.runStep(steps, 'generateReport', async () => {
        if (!incident) throw new Error('Incident not available');
        report = this.reportGenerator.generateIncidentReport(incident);
        logger.debug('Report generated');
      });

      const duration = Date.now() - startTime;

      logger.info('Error workflow completed successfully', {
        duration,
        incidentId: incident?.id,
        analysisConfidence: analysis?.confidence,
      });

      return {
        success: true,
        incident,
        analysis,
        fix,
        alerts,
        report,
        steps,
        duration,
        errors: [],
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const workflowError = error instanceof Error ? error : new Error(String(error));

      logger.error('Error workflow failed', {
        error: workflowError.message,
        duration,
      });

      errors.push(workflowError);

      return {
        success: false,
        incident,
        analysis,
        fix,
        alerts,
        report,
        steps,
        duration,
        errors,
      };
    }
  }

  private initializeSteps(): WorkflowStep[] {
    return [
      { name: 'capture', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'log', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'trace', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'analyze', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'classify', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'diagnose', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'suggestFix', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      {
        name: 'createIncident',
        status: 'PENDING',
        startedAt: null,
        completedAt: null,
        error: null,
      },
      { name: 'alert', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      { name: 'saveHistory', status: 'PENDING', startedAt: null, completedAt: null, error: null },
      {
        name: 'generateReport',
        status: 'PENDING',
        startedAt: null,
        completedAt: null,
        error: null,
      },
    ];
  }

  private async runStep(
    steps: WorkflowStep[],
    stepName: string,
    action: () => Promise<void>,
  ): Promise<void> {
    const step = steps.find((s) => s.name === stepName);
    if (!step) {
      throw new Error(`Unknown step: ${stepName}`);
    }

    step.status = 'RUNNING';
    step.startedAt = new Date();

    try {
      await action();
      step.status = 'COMPLETED';
      step.completedAt = new Date();
    } catch (error) {
      step.status = 'FAILED';
      step.completedAt = new Date();
      step.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }
}
