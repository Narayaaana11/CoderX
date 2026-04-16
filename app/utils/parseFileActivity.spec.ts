import { describe, expect, it } from 'vitest';
import { parseFileActivity } from './parseFileActivity';

describe('parseFileActivity', () => {
  it('returns empty array when no file fences are present', () => {
    expect(parseFileActivity('plain text')).toEqual([]);
  });

  it('parses open and closed file fences', () => {
    const input = [
      '```src/App.tsx',
      'export function App() {}',
      '```',
      '```src/utils/math.ts',
      'export const sum = (a:number,b:number)=>a+b;',
    ].join('\n');

    expect(parseFileActivity(input)).toEqual([
      { path: 'src/App.tsx', done: true },
      { path: 'src/utils/math.ts', done: false },
    ]);
  });

  it('deduplicates repeated file paths', () => {
    const input = [
      '```src/App.tsx',
      'one',
      '```',
      '```src/App.tsx',
      'two',
      '```',
    ].join('\n');

    expect(parseFileActivity(input)).toEqual([{ path: 'src/App.tsx', done: true }]);
  });
});
