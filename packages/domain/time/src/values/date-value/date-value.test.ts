import { describe, expect, it } from 'vitest';

import {
  fromDateRangeValue,
  fromDateValue,
  toDateRangeValue,
  toDateValue,
} from './date-value';

describe('date values', () => {
  it('reads yyyy-MM-dd as a local date and writes it back unchanged', () => {
    const date = fromDateValue('2026-05-04');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(4);
    expect(toDateValue(date)).toBe('2026-05-04');
  });

  it('refuses impossible dates, other formats and non-strings', () => {
    expect(fromDateValue('2026-02-31')).toBeUndefined();
    expect(fromDateValue('2026-5-4')).toBeUndefined();
    expect(fromDateValue('2026-05-04T00:00')).toBeUndefined();
    expect(fromDateValue(20260504)).toBeUndefined();
    expect(toDateValue(undefined)).toBeUndefined();
  });

  it('pads years before 1000', () => {
    expect(toDateValue(new Date(999, 0, 2))).toBe('0999-01-02');
  });
});

describe('date range values', () => {
  it('round-trips a full range and a start-only range', () => {
    const full = fromDateRangeValue({ from: '2026-01-01', to: '2026-01-05' });
    expect(toDateRangeValue(full)).toEqual({
      from: '2026-01-01',
      to: '2026-01-05',
    });
    const open = fromDateRangeValue({ from: '2026-01-01' });
    expect(open?.to).toBeUndefined();
    expect(toDateRangeValue(open)).toEqual({ from: '2026-01-01' });
  });

  it('is undefined without a valid start', () => {
    expect(fromDateRangeValue(undefined)).toBeUndefined();
    expect(fromDateRangeValue({ to: '2026-01-05' })).toBeUndefined();
    expect(fromDateRangeValue({ from: 'soon' })).toBeUndefined();
    expect(toDateRangeValue({ to: new Date(2026, 0, 5) })).toBeUndefined();
    expect(toDateRangeValue(undefined)).toBeUndefined();
  });

  it('drops an invalid end rather than the whole range', () => {
    expect(fromDateRangeValue({ from: '2026-01-01', to: 'later' })).toEqual({
      from: new Date(2026, 0, 1),
    });
  });
});
