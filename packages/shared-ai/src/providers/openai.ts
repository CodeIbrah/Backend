import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { AIAnalysis, FixSuggestion, Diagnosis } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(config: { apiKey: string; model?: string }) {
    super({ apiKey: config.apiKey, model: config.model || 'gpt-4o' });
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async analyze(error: string, context: any): Promise<AIAnalysis> {
    const prompt = `Analyze the following error and provide a structured analysis:

Error: ${error}
Context: ${JSON.stringify(context, null, 2)}

Return JSON with: rootCause, severity (low|medium|high|critical), description, confidence (0-1), relatedErrors (array of strings).`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = this.parseJSONResponse(content);

    return {
      rootCause: parsed.rootCause || 'Unknown',
      severity: parsed.severity || 'medium',
      description: parsed.description || '',
      confidence: parsed.confidence || 0.5,
      relatedErrors: parsed.relatedErrors || [],
    };
  }

  async suggestFix(error: string, context: any): Promise<FixSuggestion> {
    const prompt = `Suggest a fix for the following error:

Error: ${error}
Context: ${JSON.stringify(context, null, 2)}

Return JSON with: description, code (string with fix), explanation, priority (low|medium|high|critical), affectedFiles (array of strings).`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = this.parseJSONResponse(content);

    return {
      description: parsed.description || '',
      code: parsed.code || '',
      explanation: parsed.explanation || '',
      priority: parsed.priority || 'medium',
      affectedFiles: parsed.affectedFiles || [],
    };
  }

  async diagnose(metrics: any): Promise<Diagnosis> {
    const prompt = `Diagnose system health based on the following metrics:

Metrics: ${JSON.stringify(metrics, null, 2)}

Return JSON with: health (healthy|degraded|unhealthy), issues (array of strings), recommendations (array of strings), metrics (object with analyzed metrics).`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = this.parseJSONResponse(content);

    return {
      health: parsed.health || 'healthy',
      issues: parsed.issues || [],
      recommendations: parsed.recommendations || [],
      metrics: parsed.metrics || metrics,
    };
  }
}
