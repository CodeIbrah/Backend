export { ErrorCollector, ErrorEntry } from './collectors/error-collector';

export { ErrorAnalyzer, Analysis, ParsedStack } from './analyzers/error-analyzer';

export { FixSuggester, FixSuggestion } from './analyzers/fix-suggester';

export {
  ErrorAnalysisAgent,
  LogEntry,
  Pattern,
  Severity,
  AgentResult as ErrorAnalysisAgentResult,
} from './agents/error-analysis-agent';

export {
  FixSuggestionAgent,
  AgentResult as FixSuggestionAgentResult,
} from './agents/fix-suggestion-agent';

export {
  RuntimeMonitoringAgent,
  Alert,
  MemoryMetrics,
  ResponseTimeMetrics,
  AgentResult as RuntimeMonitoringAgentResult,
} from './agents/runtime-monitoring-agent';

export {
  IncidentResponseAgent,
  Incident,
  TimelineEvent,
  ErrorGroup,
  AgentResult as IncidentResponseAgentResult,
  IncidentData,
} from './agents/incident-response-agent';

export { DiagnosticEngine, HealthCheck, DiagnosticResult } from './diagnostics/diagnostic-engine';

export { ReportGenerator } from './reporters/report-generator';

export { ErrorWorkflow, WorkflowStep, WorkflowResult } from './workflows/error-workflow';

export {
  KnowledgeBase,
  KnowledgeEntry,
  Pattern as KnowledgePattern,
} from './memory/knowledge-base';

export {
  analyzeErrorTemplate,
  suggestFixTemplate,
  diagnoseTemplate,
  incidentSummaryTemplate,
  PromptContext,
} from './prompts/error-analysis.prompt';

export {
  IncidentManager,
  Incident as ManagedIncident,
  IncidentData as ManagedIncidentData,
} from './incidents/incident-manager';

export { AlertService, AlertConfig, AlertResult } from './integrations/alert-service';

export { AutoRecovery, RecoveryAction, RecoveryResult } from './integrations/auto-recovery';
