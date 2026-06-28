export enum ReportType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  INCIDENT = 'INCIDENT',
  BUILD = 'BUILD',
  DEPLOYMENT = 'DEPLOYMENT',
  MANUAL = 'MANUAL',
}

export enum ReportSection {
  NAME = 'NAME',
  DATE = 'DATE',
  CHANGES = 'CHANGES',
  ERRORS = 'ERRORS',
  TASKS_DONE = 'TASKS_DONE',
  TASKS_PENDING = 'TASKS_PENDING',
  TASKS_TODO = 'TASKS_TODO',
  CONTEXT = 'CONTEXT',
  SUMMARY = 'SUMMARY',
}

export interface ReportConfig {
  type: ReportType;
  sections: ReportSection[];
  outputPath: string;
  format: string;
}

export interface ReportData {
  name: string;
  date: string;
  changes: string[];
  errors: string[];
  tasksDone: string[];
  tasksPending: string[];
  tasksTodo: string[];
  context: string;
  summary: string;
}
