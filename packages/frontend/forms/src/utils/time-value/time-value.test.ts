import { describe, expect, it } from 'vitest';

import {
  isTimeValue,
  stepShowsSeconds,
  timeToSeconds,
  toTimeValue,
} from './time-value';

describe('time values', () => {
  it('accepts 24-hour HH:mm and HH:mm:ss', () => {
    for (const value of ['00:00', '09:30', '23:59', '12:00:45']) {
      expect(isTimeValue(value)).toBe(true);
    }
  });

  it('refuses anything else', () => {
    for (const value of [
      '',
      '24:00',
      '9:30',
      '09:60',
      '09:30:60',
      '09:30 PM',
      '0930',
      ' 09:30',
      null,
      930,
    ]) {
      expect(isTimeValue(value)).toBe(false);
    }
  });

  it('turns an unusable value into the empty string', () => {
    expect(toTimeValue('09:30')).toBe('09:30');
    expect(toTimeValue('late')).toBe('');
    expect(toTimeValue(undefined)).toBe('');
  });

  it('reads seconds since midnight', () => {
    expect(timeToSeconds('00:00')).toBe(0);
    expect(timeToSeconds('01:02:03')).toBe(3723);
    expect(timeToSeconds('nope')).toBeUndefined();
  });

  it('shows seconds only for a step under a minute', () => {
    expect(stepShowsSeconds(undefined)).toBe(false);
    expect(stepShowsSeconds(60)).toBe(false);
    expect(stepShowsSeconds(1)).toBe(true);
  });
});
