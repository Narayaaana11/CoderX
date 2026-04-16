interface Env {
  AGENT_SERVICE_URL?: string;
  LLM_PROVIDER?: 'ollama-local' | 'ollama-cloud' | 'openai-compatible-cloud';
  LLM_BASE_URL?: string;
  LLM_MODEL?: string;
  LLM_API_KEY?: string;
  OLLAMA_BASE_URL?: string;
  OLLAMA_MODEL?: string;
  OLLAMA_CLOUD_BASE_URL?: string;
  OLLAMA_CLOUD_MODEL?: string;
  OLLAMA_CLOUD_API_KEY?: string;
  OPENAI_COMPATIBLE_BASE_URL?: string;
  OPENAI_COMPATIBLE_MODEL?: string;
  OPENAI_COMPATIBLE_API_KEY?: string;
}
