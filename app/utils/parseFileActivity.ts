export interface FileActivity {
  path: string;
  done: boolean;
}

/**
 * Parse fenced file blocks like ```src/file.ts from streamed model text.
 * Results are deduplicated by path in first-seen order.
 */
export function parseFileActivity(text: string): FileActivity[] {
  const openingFence = /^```([\w./\-@]+\.[a-zA-Z0-9]+)\s*$/gm;
  const result: FileActivity[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;

  while ((match = openingFence.exec(text)) !== null) {
    const path = match[1] ?? '';

    if (!path || seen.has(path)) {
      continue;
    }

    seen.add(path);

    const afterOpen = text.slice((match.index ?? 0) + match[0].length);
    const done = /^```\s*$/m.test(afterOpen);

    result.push({ path, done });
  }

  return result;
}
