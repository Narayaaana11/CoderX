import type { Messages } from './stream-text';

const DEFAULT_MAX_HISTORY_CHARS = 24_000;

/**
 * Keep recent conversation turns within a character budget.
 */
export function buildHistoryContext(messages: Messages, maxChars = DEFAULT_MAX_HISTORY_CHARS): Messages {
  if (messages.length === 0) {
    return [];
  }

  const selected: Messages = [];
  let used = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    const content = message.content || '';
    const next = used + content.length;

    if (next > maxChars) {
      if (selected.length === 0) {
        const trimmed = content.slice(-Math.max(1500, maxChars));
        selected.unshift({ ...message, content: trimmed });
      }

      break;
    }

    selected.unshift(message);
    used = next;
  }

  return selected;
}
