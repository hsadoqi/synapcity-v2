import { describe, expect, it } from 'vitest';
import {
  regionalDefaults,
  resolveDateTimeFormatting,
} from '@synapcity/domain-preferences';

import { formatEntityDate } from '../../utils';

const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const formatting = resolveDateTimeFormatting(regionalDefaults, browserZone);
const now = new Date(2026, 9, 18, 14, 0);

describe('formatEntityDate', () => {
  it('says Today for the same calendar day', () => {
    expect(
      formatEntityDate(
        new Date(2026, 9, 18, 1, 0).toISOString(),
        formatting,
        now,
      ),
    ).toBe('Today');
  });

  it('says Yesterday for the previous calendar day, whatever the hour', () => {
    expect(
      formatEntityDate(
        new Date(2026, 9, 17, 23, 59).toISOString(),
        formatting,
        now,
      ),
    ).toBe('Yesterday');
  });

  it('counts days within the week', () => {
    expect(
      formatEntityDate(
        new Date(2026, 9, 15, 9, 0).toISOString(),
        formatting,
        now,
      ),
    ).toBe('3 days ago');
  });

  it('falls back to a short date, with the year only when it is not this one', () => {
    expect(
      formatEntityDate(
        new Date(2026, 9, 2, 9, 0).toISOString(),
        formatting,
        now,
      ),
    ).toBe('Oct 2');
    expect(
      formatEntityDate(
        new Date(2025, 8, 24, 9, 0).toISOString(),
        formatting,
        now,
      ),
    ).toBe('Sep 24, 2025');
  });

  it('writes the date in the chosen order', () => {
    const dayFirst = resolveDateTimeFormatting(
      { ...regionalDefaults, dateFormat: 'DD/MM/YYYY' },
      browserZone,
    );
    expect(
      formatEntityDate(new Date(2026, 9, 2, 9, 0).toISOString(), dayFirst, now),
    ).toBe('2 Oct');
  });

  it('counts days in the chosen zone, not the device one', () => {
    // 23:30 UTC on the 17th is already the 18th in Tokyo.
    const tokyo = resolveDateTimeFormatting(
      { ...regionalDefaults, timezone: 'Asia/Tokyo' },
      null,
    );
    expect(
      formatEntityDate(
        '2026-10-17T23:30:00.000Z',
        tokyo,
        new Date('2026-10-18T05:00:00.000Z'),
      ),
    ).toBe('Today');
  });
});
