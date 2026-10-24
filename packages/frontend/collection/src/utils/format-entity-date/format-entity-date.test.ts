import { describe, expect, it } from 'vitest';

import { formatEntityDate } from '../../utils';

const now = new Date(2026, 9, 18, 14, 0);

describe('formatEntityDate', () => {
  it('says Today for the same calendar day', () => {
    expect(
      formatEntityDate(new Date(2026, 9, 18, 1, 0).toISOString(), now),
    ).toBe('Today');
  });

  it('says Yesterday for the previous calendar day, whatever the hour', () => {
    expect(
      formatEntityDate(new Date(2026, 9, 17, 23, 59).toISOString(), now),
    ).toBe('Yesterday');
  });

  it('counts days within the week', () => {
    expect(
      formatEntityDate(new Date(2026, 9, 15, 9, 0).toISOString(), now),
    ).toBe('3 days ago');
  });

  it('falls back to a short date, with the year only when it is not this one', () => {
    expect(
      formatEntityDate(new Date(2026, 9, 2, 9, 0).toISOString(), now),
    ).toBe('Oct 2');
    expect(
      formatEntityDate(new Date(2025, 8, 24, 9, 0).toISOString(), now),
    ).toBe('Sep 24, 2025');
  });
});
