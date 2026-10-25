import { describe, expect, it } from 'vitest';

import {
  padTwo,
  parseClockDuration,
  splitDuration,
} from '@synapcity/frontend-ui/lib/duration';

describe('splitDuration', () => {
  it('splits milliseconds into hours, minutes and seconds', () => {
    expect(splitDuration(3_725_000)).toEqual({
      hours: 1,
      minutes: 2,
      seconds: 5,
    });
  });

  it('keeps counting hours past a day', () => {
    expect(splitDuration(100 * 3_600_000).hours).toBe(100);
  });

  it('drops the partial second', () => {
    expect(splitDuration(1_999)).toEqual({ hours: 0, minutes: 0, seconds: 1 });
  });

  it.each([-1, -3_600_000, Number.NaN, Number.NEGATIVE_INFINITY])(
    'treats %j as no time left',
    (input) => {
      expect(splitDuration(input)).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
    },
  );
});

describe('padTwo', () => {
  it('pads a single digit', () => {
    expect(padTwo(5)).toBe('05');
  });

  it('leaves two or more digits alone', () => {
    expect(padTwo(42)).toBe('42');
    expect(padTwo(120)).toBe('120');
  });

  it('floors and clamps like the countdown does', () => {
    expect(padTwo(7.9)).toBe('07');
    expect(padTwo(-3)).toBe('00');
  });
});

describe('parseClockDuration', () => {
  it('reads HH:MM:SS as seconds', () => {
    expect(parseClockDuration('00:15:00')).toBe(900);
    expect(parseClockDuration('01:02:03')).toBe(3_723);
  });

  it('allows hours past 23', () => {
    expect(parseClockDuration('48:00:00')).toBe(172_800);
  });

  it.each([
    '',
    'soon',
    '12',
    '12:30',
    '1:2:3:4',
    '00:60:00',
    '00:00:60',
    '-1:00:00',
    '00:0x:00',
  ])('rejects %j instead of coercing it to zero', (input) => {
    expect(parseClockDuration(input)).toBeNull();
  });
});
