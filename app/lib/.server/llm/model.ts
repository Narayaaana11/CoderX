import { createOpenAI } from '@ai-sdk/openai';
import { ensureOpenAICompatibleBaseUrl, type LLMProviderSettings } from '~/types/llm';

function getAuthorizationHeader(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

export function getModelFromProviderConfig(providerSettings: LLMProviderSettings) {
  if (providerSettings.provider === 'openai-compatible-cloud') {
    const openai = createOpenAI({
      apiKey: providerSettings.apiKey,
      baseURL: ensureOpenAICompatibleBaseUrl(providerSettings.baseUrl),
    });

    return openai(providerSettings.model);
  }

  const openai = createOpenAI({
    apiKey: providerSettings.provider === 'ollama-local' ? 'ollama' : providerSettings.apiKey,
    baseURL: ensureOpenAICompatibleBaseUrl(providerSettings.baseUrl),
    headers: providerSettings.provider === 'ollama-local' ? undefined : getAuthorizationHeader(providerSettings.apiKey),
  });

  return openai(providerSettings.model);
}
