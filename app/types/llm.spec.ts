import { describe, expect, it } from 'vitest';
import {
  ensureOpenAICompatibleBaseUrl,
  parseLLMProviderSettings,
  validateLLMProviderSettings,
} from './llm';

describe('llm settings helpers', () => {
  it('ensures /v1 suffix for OpenAI-compatible base URL', () => {
    expect(ensureOpenAICompatibleBaseUrl('https://api.example.com')).toBe('https://api.example.com/v1');
    expect(ensureOpenAICompatibleBaseUrl('https://api.example.com/v1')).toBe('https://api.example.com/v1');
  });

  it('validates cloud API key requirement', () => {
    const result = validateLLMProviderSettings({
      provider: 'openai-compatible-cloud',
      baseUrl: 'https://api.example.com/v1',
      model: 'gpt-4o-mini',
      apiKey: '',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('API key');
  });

  it('parses valid local provider payload', () => {
    const parsed = parseLLMProviderSettings({
      provider: 'ollama-local',
      baseUrl: 'http://127.0.0.1:11434',
      model: 'llama3.2',
    });

    expect(parsed.success).toBe(true);
  });
});
