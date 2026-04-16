export type LLMProvider = 'ollama-local' | 'ollama-cloud' | 'openai-compatible-cloud';

export interface BaseLLMProviderSettings {
  provider: LLMProvider;
  baseUrl: string;
  model: string;
}

export interface OllamaLocalSettings extends BaseLLMProviderSettings {
  provider: 'ollama-local';
}

export interface OllamaCloudSettings extends BaseLLMProviderSettings {
  provider: 'ollama-cloud';
  apiKey: string;
}

export interface OpenAICompatibleCloudSettings extends BaseLLMProviderSettings {
  provider: 'openai-compatible-cloud';
  apiKey: string;
}

export type LLMProviderSettings = OllamaLocalSettings | OllamaCloudSettings | OpenAICompatibleCloudSettings;

export interface LLMProviderValidationResult {
  valid: boolean;
  error?: string;
}

export const DEFAULT_LOCAL_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
export const DEFAULT_LOCAL_OLLAMA_MODEL = 'llama3.2';

export function createDefaultProviderSettings(provider: LLMProvider): LLMProviderSettings {
  switch (provider) {
    case 'ollama-cloud':
      return {
        provider,
        baseUrl: 'https://ollama.com',
        model: 'llama3.1:8b',
        apiKey: '',
      };
    case 'openai-compatible-cloud':
      return {
        provider,
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        apiKey: '',
      };
    case 'ollama-local':
    default:
      return {
        provider: 'ollama-local',
        baseUrl: DEFAULT_LOCAL_OLLAMA_BASE_URL,
        model: DEFAULT_LOCAL_OLLAMA_MODEL,
      };
  }
}

export function getDefaultLLMProviderSettings(): LLMProviderSettings {
  return createDefaultProviderSettings('ollama-local');
}

export function isLLMProvider(value: unknown): value is LLMProvider {
  return value === 'ollama-local' || value === 'ollama-cloud' || value === 'openai-compatible-cloud';
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function ensureOpenAICompatibleBaseUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);

  if (normalized.endsWith('/v1')) {
    return normalized;
  }

  return `${normalized}/v1`;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateLLMProviderSettings(settings: LLMProviderSettings): LLMProviderValidationResult {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);

  if (!settings.model.trim()) {
    return { valid: false, error: 'Model name is required.' };
  }

  if (!baseUrl || !isHttpUrl(baseUrl)) {
    return { valid: false, error: 'A valid HTTP(S) base URL is required.' };
  }

  if ((settings.provider === 'ollama-cloud' || settings.provider === 'openai-compatible-cloud') && !settings.apiKey.trim()) {
    return { valid: false, error: 'API key is required for cloud providers.' };
  }

  return { valid: true };
}

export function parseLLMProviderSettings(value: unknown): { success: true; value: LLMProviderSettings } | { success: false; error: string } {
  if (!value || typeof value !== 'object') {
    return { success: false, error: 'Provider settings are missing.' };
  }

  const record = value as Record<string, unknown>;

  if (!isLLMProvider(record.provider)) {
    return { success: false, error: 'Provider is invalid.' };
  }

  const model = typeof record.model === 'string' ? record.model.trim() : '';
  const baseUrl = typeof record.baseUrl === 'string' ? normalizeBaseUrl(record.baseUrl) : '';
  const apiKey = typeof record.apiKey === 'string' ? record.apiKey.trim() : '';

  const baseSettings = {
    provider: record.provider,
    model,
    baseUrl,
  } as const;

  let parsed: LLMProviderSettings;

  if (record.provider === 'ollama-local') {
    parsed = {
      ...baseSettings,
      provider: 'ollama-local',
    };
  } else if (record.provider === 'ollama-cloud') {
    parsed = {
      ...baseSettings,
      provider: 'ollama-cloud',
      apiKey,
    };
  } else {
    parsed = {
      ...baseSettings,
      provider: 'openai-compatible-cloud',
      apiKey,
    };
  }

  const validation = validateLLMProviderSettings(parsed);

  if (!validation.valid) {
    return { success: false, error: validation.error || 'Provider settings are invalid.' };
  }

  return { success: true, value: parsed };
}