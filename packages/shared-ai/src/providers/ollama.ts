import { BaseAIProvider } from './base';
import { AIAnalysis, FixSuggestion, Diagnosis } from '../types';

export class OllamaProvider extends BaseAIProvider {
  private baseUrl: string;

  constructor(config: { baseUrl?: string; model?: string }) {
    super({ apiKey: '', model: config.model || 'llama3' });
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  private async callOllama(prompt: string, maxTokens: number = 1024): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: { num_predict: maxTokens },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '{}';
  }

  async analyze(error: string, context: any): Promise<AIAnalysis> {
    const prompt = `${this.buildSystemPrompt()}

Analyze the following error and provide a structured analysis:

Error: ${error}
Context: ${JSON.stringify(context, null, 2)}

Return JSON with: rootCause, severity (low|medium|high|critical), description, confidence (0-1), relatedErrors (array of strings).`;

    const response = await this.callOllama(prompt);
    const parsed = this.parseJSONResponse(response);

    return {
      rootCause: parsed.rootCause || 'Unknown',
      severity: parsed.severity || 'medium',
      description: parsed.description || '',
      confidence: parsed.confidence || 0.5,
      relatedErrors: parsed.relatedErrors || [],
    };
  }

  async suggestFix(error: string, context: any): Promise<FixSuggestion> {
    const prompt = `${this.buildSystemPrompt()}

Suggest a fix for the following error:

Error: ${error}
Context: ${JSON.stringify(context, null, 2)}

Return JSON with: description, code (string with fix), explanation, priority (low|medium|high|critical), affectedFiles (array of strings).`;

    const response = await this.callOllama(prompt, 2048);
    const parsed = this.parseJSONResponse(response);

    return {
      description: parsed.description || '',
      code: parsed.code || '',
      explanation: parsed.explanation || '',
      priority: parsed.priority || 'medium',
      affectedFiles: parsed.affectedFiles || [],
    };
  }

  async diagnose(metrics: any): Promise<Diagnosis> {
    const prompt = `${this.buildSystemPrompt()}

Diagnose system health based on the following metrics:

Metrics: ${JSON.stringify(metrics, null, 2)}

Return JSON with: health (healthy|degraded|unhealthy), issues (array of strings), recommendations (array of strings), metrics (object with analyzed metrics).`;

    const response = await this.callOllama(prompt);
    const parsed = this.parseJSONResponse(response);

    return {
      health: parsed.health || 'healthy',
      issues: parsed.issues || [],
      recommendations: parsed.recommendations || [],
      metrics: parsed.metrics || metrics,
    };
  }
}
