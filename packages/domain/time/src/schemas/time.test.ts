import { describe, expect, it } from 'vitest';

import {
  calendarDateSchema,
  durationSchema,
  instantSchema,
  timeOfDaySchema,
} from './time';

const accepts =
  (schema: { safeParse(v: unknown): { success: boolean } }) => (v: unknown) =>
    schema.safeParse(v).success;

describe('instantSchema', () => {
  const ok = accepts(instantSchema);

  it.each([
    '2026-10-01T09:00:00Z',
    '2026-10-01T09:00:00.123456Z',
    // What PostgREST returns for every timestamptz column.
    '2026-10-01T09:00:00+00:00',
    '2026-10-01T09:00:00.123456+05:30',
  ])('accepts %s', (v) => expect(ok(v)).toBe(true));

  it.each([
    '2026-10-01',
    '2026-10-01T09:00:00',
    '09:00:00',
    '2026-13-01T09:00:00Z',
    '2026-02-30T09:00:00Z',
    '2026-10-01T09:00:00+0200',
    '2026-10-01T09:00:00+02:00[Europe/Paris]',
    '',
  ])('rejects %j', (v) => expect(ok(v)).toBe(false));

  it('keeps the string as given rather than normalizing the offset', () => {
    expect(instantSchema.parse('2026-10-01T09:00:00+00:00')).toBe(
      '2026-10-01T09:00:00+00:00',
    );
  });

  it('is not ordered as a string across offsets: compare parsed values', () => {
    const later = '2026-10-30T09:00:00+02:00'; // 07:00Z
    const earlier = '2026-10-30T08:00:00Z';
    expect(later < earlier).toBe(false);
    expect(Date.parse(later) < Date.parse(earlier)).toBe(true);
  });
});

describe('calendarDateSchema', () => {
  const ok = accepts(calendarDateSchema);

  it.each(['2026-10-30', '2028-02-29'])('accepts %s', (v) =>
    expect(ok(v)).toBe(true),
  );
  it.each([
    '2026-02-30',
    '2027-02-29',
    '10/30/2026',
    '2026-10-30T09:00:00Z',
    '2026-1-3',
    '',
  ])('rejects %j', (v) => expect(ok(v)).toBe(false));
});

describe('timeOfDaySchema', () => {
  const ok = accepts(timeOfDaySchema);

  it.each(['09:00:00', '09:00:00.123', '09:00', '23:59:59'])(
    'accepts %s',
    (v) => expect(ok(v)).toBe(true),
  );
  it.each([
    '9:00:00 AM',
    '09:00:00Z',
    '09:00:00+01:00',
    '2026-10-01T09:00:00Z',
    '24:00:00',
    '',
    'noon',
  ])('rejects %j', (v) => expect(ok(v)).toBe(false));
});

describe('durationSchema', () => {
  const ok = accepts(durationSchema);

  it.each(['PT5M', 'PT1H30M', 'P1DT2H', 'P1W', 'P1Y2M3DT4H5M6S', 'PT0S'])(
    'accepts %s',
    (v) => expect(ok(v)).toBe(true),
  );
  it.each(['5 minutes', 'PT', 'P', '', '1h', '-PT1H'])('rejects %j', (v) =>
    expect(ok(v)).toBe(false),
  );
});
