import { describe, expect, it } from 'vitest';

import { padTime, parseDuration } from '@synapcity/frontend-ui/lib/countdown';

describe('padTime', () => {
  it('pads a single digit to two', () => {
    expect(padTime(7)).toBe('07');
    expect(padTime(42)).toBe('42');
  });

  it('floors fractions and never goes below zero', () => {
    expect(padTime(5.9)).toBe('05');
    expect(padTime(-3)).toBe('00');
  });
});

describe('parseDuration', () => {
  it('reads hh:mm:ss as seconds', () => {
    expect(parseDuration('01:02:03')).toBe(3723);
    expect(parseDuration('00:15:00')).toBe(900);
  });

  it('treats missing or non-numeric parts as zero', () => {
    expect(parseDuration('2')).toBe(7200);
    expect(parseDuration('aa:10:bb')).toBe(600);
    expect(parseDuration('')).toBe(0);
  });
});
