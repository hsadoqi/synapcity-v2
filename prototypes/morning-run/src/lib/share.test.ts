import { describe, expect, it } from 'vitest';

import { intentionFilename, wrapText } from './share';

const measure = (s: string) => s.length * 10;

describe('wrapText', () => {
  it('breaks on word boundaries within the width', () => {
    expect(wrapText('one two three four', 80, measure)).toEqual([
      'one two',
      'three',
      'four',
    ]);
  });

  it('keeps an over-long word on its own line instead of dropping it', () => {
    expect(wrapText('supercalifragilistic ok', 50, measure)).toEqual([
      'supercalifragilistic',
      'ok',
    ]);
  });

  it('keeps explicit line breaks', () => {
    expect(wrapText('a\nb', 100, measure)).toEqual(['a', 'b']);
  });
});

describe('intentionFilename', () => {
  it('slugs the date', () => {
    const name = intentionFilename(
      {
        dateLabel: 'Sunday 25 October',
        runName: 'x',
        headline: 'y',
        lines: [],
      },
      'png',
    );
    expect(name).toBe('intention-sunday-25-october.png');
  });
});
