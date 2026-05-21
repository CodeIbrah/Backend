import { AIProvider, AIAnalysis, FixSuggestion, Diagnosis } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  protected apiKey: string;
  protected model: string;

  constructor(config: { apiKey: string; model: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  abstract analyze(error: string, context: any): Promise<AIAnalysis>;

  abstract suggestFix(error: string, context: any): Promise<FixSuggestion>;

  abstract diagnose(metrics: any): Promise<Diagnosis>;

  protected buildSystemPrompt(): string {
    return 'You are an expert software debugging assistant. Provide concise, accurate analysis.';
  }

  protected parseJSONResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
    }
  }
}
