import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getModelFromProviderConfig } from '~/lib/.server/llm/model';
import { type LLMProviderSettings } from '~/types/llm';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt, type AgentPromptContext } from './prompts';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

interface PromptContext {
  agentContext?: AgentPromptContext;
  developmentSkills?: string[];
}

export function streamText(
  messages: Messages,
  providerSettings: LLMProviderSettings,
  options?: StreamingOptions,
  promptContext?: PromptContext,
) {
  return _streamText({
    model: getModelFromProviderConfig(providerSettings),
    system: getSystemPrompt(undefined, promptContext?.agentContext, promptContext?.developmentSkills),
    maxTokens: MAX_TOKENS,
    messages: convertToCoreMessages(messages),
    ...options,
  });
}
