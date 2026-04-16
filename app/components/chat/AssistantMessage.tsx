import { memo } from 'react';
import { parseThinking } from '~/utils/parseThinking';
import { AgentActivity } from './AgentActivity';
import { Markdown } from './Markdown';
import { ThinkingBlock } from './ThinkingBlock';

interface AssistantMessageProps {
  content: string;
}

export const AssistantMessage = memo(({ content }: AssistantMessageProps) => {
  const { thinking, isThinking, rest } = parseThinking(content);

  return (
    <div className="overflow-hidden w-full">
      <ThinkingBlock thinking={thinking} isStreaming={isThinking} />
      <AgentActivity content={rest} isStreaming={isThinking} />
      <Markdown html>{rest}</Markdown>
    </div>
  );
});
