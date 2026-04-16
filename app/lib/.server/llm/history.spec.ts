import { describe, expect, it } from 'vitest';
import type { Messages } from './stream-text';
import { buildHistoryContext } from './history';

describe('buildHistoryContext', () => {
  it('keeps most recent messages within budget', () => {
    const input: Messages = [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'second' },
      { role: 'user', content: 'third' },
    ];

    const result = buildHistoryContext(input, 10);
    expect(result).toEqual([{ role: 'user', content: 'third' }]);
  });

  it('trims a single oversized latest message', () => {
    const oversized = 'x'.repeat(2000);
    const result = buildHistoryContext([{ role: 'assistant', content: oversized }], 1000);

    expect(result).toHaveLength(1);
    expect(result[0]?.content.length).toBe(1500);
    expect(result[0]?.content).toBe(oversized.slice(-1500));
  });
});
