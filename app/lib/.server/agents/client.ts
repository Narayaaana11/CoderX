/**
 * CoderX Agent Context Client
 *
 * This module is the server-side bridge from chat prompts to the optional
 * external agent service. It normalizes planner/repository output into a
 * compact prompt context that is safe to inject into LLM system prompts.
 *
 * Contribution notes:
 * - Keep sanitization defensive; treat service responses as untrusted input.
 * - Prefer additive fields so older agent-service payloads stay compatible.
 * - Keep network timeouts short to avoid blocking primary chat generation.
 */
export interface AgentRepositorySummary {
  name: string;
  stack?: string;
}

export interface AgentPromptContext {
  modules: string[];
  repositories: AgentRepositorySummary[];
  extractedModules: string[];
}

interface AgentServiceRepository {
  name?: string;
  stack?: string;
}

interface AgentServicePlannerOutput {
  modules?: string[];
}

interface AgentServiceResponse {
  planner_output?: AgentServicePlannerOutput;
  repositories?: AgentServiceRepository[];
  extracted_modules?: string[];
}

const DEFAULT_AGENT_SERVICE_URL = 'http://127.0.0.1:8001/build-project';
const AGENT_FETCH_TIMEOUT_MS = 8000;

function getAgentServiceUrl(env: Env): string | undefined {
  return env.AGENT_SERVICE_URL || DEFAULT_AGENT_SERVICE_URL;
}

function sanitizeAgentContext(payload: AgentServiceResponse): AgentPromptContext | null {
  const modules = Array.isArray(payload.planner_output?.modules)
    ? payload.planner_output.modules.filter((item): item is string => typeof item === 'string')
    : [];

  const repositories = Array.isArray(payload.repositories)
    ? payload.repositories
        .filter(
          (repo): repo is Required<Pick<AgentServiceRepository, 'name'>> & AgentServiceRepository =>
            typeof repo.name === 'string',
        )
        .map((repo) => ({
          name: repo.name,
          stack: typeof repo.stack === 'string' ? repo.stack : undefined,
        }))
    : [];

  const extractedModules = Array.isArray(payload.extracted_modules)
    ? payload.extracted_modules.filter((item): item is string => typeof item === 'string')
    : [];

  if (modules.length === 0 && repositories.length === 0 && extractedModules.length === 0) {
    return null;
  }

  return {
    modules,
    repositories,
    extractedModules,
  };
}

export async function fetchAgentPromptContext(userPrompt: string, env: Env): Promise<AgentPromptContext | null> {
  const serviceUrl = getAgentServiceUrl(env);

  if (!serviceUrl || !userPrompt.trim()) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        user_prompt: userPrompt,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json<AgentServiceResponse>();

    return sanitizeAgentContext(payload);
  } catch (error) {
    console.warn('Agent service unavailable:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
