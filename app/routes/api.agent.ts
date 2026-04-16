import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { fetchAgentPromptContext } from '~/lib/.server/agents/client';

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
    });
  }

  try {
    const { prompt } = await request.json<{ prompt?: string }>();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or missing prompt' }), {
        status: 400,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    const agentContext = await fetchAgentPromptContext(prompt, context.cloudflare.env);

    return new Response(
      JSON.stringify({
        success: Boolean(agentContext),
        agentContext,
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      },
    );
  }
}
