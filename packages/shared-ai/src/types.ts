export enum AIProviderType {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  OLLAMA = 'OLLAMA',
  LOCAL = 'LOCAL',
}

export interface AIAnalysis {
  rootCause: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  relatedErrors: string[];
}

export interface FixSuggestion {
  description: string;
  code: string;
  explanation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedFiles: string[];
}

export interface Diagnosis {
  health: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  recommendations: string[];
  metrics: Record<string, any>;
}

export interface AIProvider {
  analyze(error: string, context: any): Promise<AIAnalysis>;
  suggestFix(error: string, context: any): Promise<FixSuggestion>;
  diagnose(metrics: any): Promise<Diagnosis>;
}
