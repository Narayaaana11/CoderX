import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { resolveProviderSettings } from '~/lib/.server/llm/provider-config';
import { ensureOpenAICompatibleBaseUrl, normalizeBaseUrl, type LLMProviderSettings } from '~/types/llm';

interface ModelsResponse {
  models: string[];
}

function getHeaders(providerSettings: LLMProviderSettings): HeadersInit {
  if (providerSettings.provider === 'ollama-local') {
    return { Accept: 'application/json' };
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${providerSettings.apiKey}`,
  };
}

async function fetchOllamaTagModels(providerSettings: LLMProviderSettings): Promise<ModelsResponse> {
  const baseUrl = normalizeBaseUrl(providerSettings.baseUrl).replace(/\/v1$/i, '');

  const response = await fetch(`${baseUrl}/api/tags`, {
    method: 'GET',
    headers: getHeaders(providerSettings),
  });

  if (!response.ok) {
    throw new Error(`Provider request failed (${response.status})`);
  }

  const payload = await response.json<{ models?: Array<{ name?: string }> }>();
  const models = (payload.models || []).map((item) => item.name).filter((name): name is string => Boolean(name));

  return { models };
}

async function fetchOpenAICompatibleModels(providerSettings: LLMProviderSettings): Promise<ModelsResponse> {
  const response = await fetch(`${ensureOpenAICompatibleBaseUrl(providerSettings.baseUrl)}/models`, {
    method: 'GET',
    headers: getHeaders(providerSettings),
  });

  if (!response.ok) {
    throw new Error(`Provider request failed (${response.status})`);
  }

  const payload = await response.json<{ data?: Array<{ id?: string }> }>();
  const models = (payload.data || []).map((item) => item.id).filter((id): id is string => Boolean(id));

  return { models };
}

export async function action({ context, request }: ActionFunctionArgs) {
  const { providerSettings: requestProviderSettings } = await request.json<{ providerSettings?: unknown }>();

  const resolvedProviderSettings = resolveProviderSettings(requestProviderSettings, context.cloudflare.env);

  if (!resolvedProviderSettings.ok || !resolvedProviderSettings.settings) {
    return new Response(
      JSON.stringify({ error: resolvedProviderSettings.error || 'Provider settings are invalid.' }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  }

  try {
    const providerSettings = resolvedProviderSettings.settings;
    const result =
      providerSettings.provider === 'openai-compatible-cloud'
        ? await fetchOpenAICompatibleModels(providerSettings)
        : await fetchOllamaTagModels(providerSettings);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to retrieve model list.',
      }),
      {
        status: 502,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  }
}