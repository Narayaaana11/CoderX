import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { StreamingTextResponse, parseStreamPart } from 'ai';
import { resolveProviderSettings } from '~/lib/.server/llm/provider-config';
import { streamText } from '~/lib/.server/llm/stream-text';
import { stripIndents } from '~/utils/stripIndent';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function action(args: ActionFunctionArgs) {
  return enhancerAction(args);
}

async function enhancerAction({ context, request }: ActionFunctionArgs) {
  const { message, providerSettings } = await request.json<{
    message: string;
    providerSettings?: unknown;
  }>();

  const resolvedProviderSettings = resolveProviderSettings(providerSettings, context.cloudflare.env);

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

  try {
    const result = await streamText(
      [
        {
          role: 'user',
          content: stripIndents`
          I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

          IMPORTANT: Only respond with the improved prompt and nothing else!

          <original_prompt>
            ${message}
          </original_prompt>
        `,
        },
      ],
      resolvedProviderSettings.settings,
    );

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const processedChunk = decoder
          .decode(chunk)
          .split('\n')
          .filter((line) => line !== '')
          .map(parseStreamPart)
          .map((part) => part.value)
          .join('');

        controller.enqueue(encoder.encode(processedChunk));
      },
    });

    const transformedStream = result.toAIStream().pipeThrough(transformStream);

    return new StreamingTextResponse(transformedStream);
  } catch (error) {
    console.log(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
