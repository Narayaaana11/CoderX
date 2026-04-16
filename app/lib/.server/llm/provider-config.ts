import {
  type LLMProvider,
  type LLMProviderSettings,
  createDefaultProviderSettings,
  isLLMProvider,
  normalizeBaseUrl,
  parseLLMProviderSettings,
  validateLLMProviderSettings,
} from '~/types/llm';

interface ResolveProviderSettingsResult {
  ok: boolean;
  settings?: LLMProviderSettings;
  error?: string;
}

function getProviderFromEnv(env: Env): LLMProvider {
  if (isLLMProvider(env.LLM_PROVIDER)) {
    return env.LLM_PROVIDER;
  }

  return 'ollama-local';
}

function resolveFromEnv(env: Env): LLMProviderSettings {
  const provider = getProviderFromEnv(env);
  const defaults = createDefaultProviderSettings(provider);

  if (provider === 'ollama-local') {
    return {
      provider,
      baseUrl: normalizeBaseUrl(env.OLLAMA_BASE_URL || env.LLM_BASE_URL || defaults.baseUrl),
      model: env.OLLAMA_MODEL || env.LLM_MODEL || defaults.model,
    };
  }

  if (provider === 'ollama-cloud') {
    const defaultApiKey = defaults.provider === 'ollama-cloud' ? defaults.apiKey : '';

    return {
      provider,
      baseUrl: normalizeBaseUrl(env.OLLAMA_CLOUD_BASE_URL || env.LLM_BASE_URL || defaults.baseUrl),
      model: env.OLLAMA_CLOUD_MODEL || env.LLM_MODEL || defaults.model,
      apiKey: env.OLLAMA_CLOUD_API_KEY || env.LLM_API_KEY || defaultApiKey,
    };
  }

  const defaultApiKey = defaults.provider === 'openai-compatible-cloud' ? defaults.apiKey : '';

  return {
    provider,
    baseUrl: normalizeBaseUrl(env.OPENAI_COMPATIBLE_BASE_URL || env.LLM_BASE_URL || defaults.baseUrl),
    model: env.OPENAI_COMPATIBLE_MODEL || env.LLM_MODEL || defaults.model,
    apiKey: env.OPENAI_COMPATIBLE_API_KEY || env.LLM_API_KEY || defaultApiKey,
  };
}

export function resolveProviderSettings(value: unknown, env: Env): ResolveProviderSettingsResult {
  if (value !== undefined) {
    const parsed = parseLLMProviderSettings(value);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error,
      };
    }

    return {
      ok: true,
      settings: parsed.value,
    };
  }

  const settings = resolveFromEnv(env);
  const validation = validateLLMProviderSettings(settings);

  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error,
    };
  }

  return {
    ok: true,
    settings,
  };
}
