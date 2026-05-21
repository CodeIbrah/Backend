import { AIProvider, AIProviderType } from '../types';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { OllamaProvider } from './ollama';
import { LocalProvider } from './local';

export function createAIProvider(type: AIProviderType, config?: any): AIProvider {
  switch (type) {
    case AIProviderType.OPENAI:
      return new OpenAIProvider({
        apiKey: config?.apiKey || process.env.OPENAI_API_KEY || '',
        model: config?.model,
      });

    case AIProviderType.CLAUDE:
      return new ClaudeProvider({
        apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY || '',
        model: config?.model,
      });

    case AIProviderType.OLLAMA:
      return new OllamaProvider({
        baseUrl: config?.baseUrl,
        model: config?.model,
      });

    case AIProviderType.LOCAL:
      return new LocalProvider();

    default:
      throw new Error(`Unknown AI provider type: ${type}`);
  }
}
