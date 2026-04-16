import { describe, expect, it } from 'vitest';
import { parseThinking } from './parseThinking';

describe('parseThinking', () => {
  it('returns original text when no thinking tags exist', () => {
    const input = 'Final answer only';
    expect(parseThinking(input)).toEqual({
      thinking: '',
      isThinking: false,
      rest: 'Final answer only',
    });
  });

  it('extracts completed think block', () => {
    const input = '<think>step 1\nstep 2</think>Answer';
    expect(parseThinking(input)).toEqual({
      thinking: 'step 1\nstep 2',
      isThinking: false,
      rest: 'Answer',
    });
  });

  it('marks incomplete think block as streaming', () => {
    const input = 'Lead text<thinking>working through details';
    expect(parseThinking(input)).toEqual({
      thinking: 'working through details',
      isThinking: true,
      rest: 'Lead text',
    });
  });
});
