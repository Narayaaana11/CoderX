import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { fetchAgentPromptContext } from '~/lib/.server/agents/client';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { buildHistoryContext } from '~/lib/.server/llm/history';
import { resolveProviderSettings } from '~/lib/.server/llm/provider-config';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ context, request }: ActionFunctionArgs) {
  const { messages, providerSettings: requestProviderSettings } = await request.json<{
    messages: Messages;
    providerSettings?: unknown;
  }>();
  const boundedMessages = buildHistoryContext(messages);

  const stream = new SwitchableStream();

  const resolvedProviderSettings = resolveProviderSettings(requestProviderSettings, context.cloudflare.env);

  if (!resolvedProviderSettings.ok || !resolvedProviderSettings.settings) {
    throw new Response(
      JSON.stringify({
        error: resolvedProviderSettings.error || 'Provider settings are invalid.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  }

  const providerSettings = resolvedProviderSettings.settings;
  const lastUserMessage = [...boundedMessages].reverse().find((message) => message.role === 'user');
  const userPrompt = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';

  const agentContext = await fetchAgentPromptContext(userPrompt, context.cloudflare.env);

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        boundedMessages.push({ role: 'assistant', content });
        boundedMessages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(boundedMessages, providerSettings, options, {
          agentContext: agentContext || undefined,
        });

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(boundedMessages, providerSettings, options, {
      agentContext: agentContext || undefined,
    });

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
