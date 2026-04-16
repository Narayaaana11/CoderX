export interface ParsedThinking {
  thinking: string;
  isThinking: boolean;
  rest: string;
}

/**
 * Extract optional <think>...</think> / <thinking>...</thinking> blocks from
 * model output so reasoning can be rendered separately from final answer text.
 */
export function parseThinking(text: string): ParsedThinking {
  const openPattern = /<think(?:ing)?>/i;
  const closePattern = /<\/think(?:ing)?>/i;

  const openMatch = openPattern.exec(text);

  if (!openMatch) {
    return { thinking: '', isThinking: false, rest: text };
  }

  const beforeOpen = text.slice(0, openMatch.index).trimEnd();
  const afterOpen = text.slice(openMatch.index + openMatch[0].length);
  const closeMatch = closePattern.exec(afterOpen);

  if (!closeMatch) {
    return { thinking: afterOpen.trimStart(), isThinking: true, rest: beforeOpen };
  }

  const thinking = afterOpen.slice(0, closeMatch.index).trim();
  const afterClose = afterOpen.slice(closeMatch.index + closeMatch[0].length).trimStart();
  const rest = [beforeOpen, afterClose].filter(Boolean).join('\n\n');

  return { thinking, isThinking: false, rest };
}
