import { describe, expect, it } from 'vitest';

import { latestRecords } from './latest-records';

const record = (
  id: string,
  updatedAt: string,
  pinnedAt: string | null = null,
) => ({ id, name: id.toUpperCase(), updatedAt, pinnedAt });

describe('latestRecords', () => {
  it('lists pinned records first, newest pin on top, then by last change', () => {
    const records = [
      record('old', '2026-10-01T00:00:00Z'),
      record('new', '2026-10-20T00:00:00Z'),
      record('pin-early', '2026-09-01T00:00:00Z', '2026-10-02T00:00:00Z'),
      record('pin-late', '2026-09-01T00:00:00Z', '2026-10-10T00:00:00Z'),
    ];

    expect(latestRecords(records).map((r) => r.id)).toEqual([
      'pin-late',
      'pin-early',
      'new',
      'old',
    ]);
  });

  it('keeps only the limit and only what the sidebar needs', () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      record(`r${i}`, `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z`),
    );
    const latest = latestRecords(records, 3);

    expect(latest).toEqual([
      { id: 'r11', name: 'R11' },
      { id: 'r10', name: 'R10' },
      { id: 'r9', name: 'R9' },
    ]);
  });

  it('keeps a record’s stored icon name for the sidebar to show', () => {
    expect(
      latestRecords([
        { ...record('a', '2026-10-01T00:00:00Z'), icon: 'pen-line' },
      ]),
    ).toEqual([{ id: 'a', name: 'A', icon: 'pen-line' }]);
  });

  it('does not reorder the list it was given', () => {
    const records = [
      record('a', '2026-10-01T00:00:00Z'),
      record('b', '2026-10-02T00:00:00Z'),
    ];
    latestRecords(records);

    expect(records.map((r) => r.id)).toEqual(['a', 'b']);
  });

  /*
   * Ordering parity with the bounded SQL reads. This is the seed
   * `packages/server/data/src/records/latest-order.dbtest.ts` writes, in the
   * order the old full read returned it (newest first, `created_at DESC`) and
   * with times in the format PostgREST returns. That test expects the SQL
   * order to be this same list.
   */
  it('orders ties the way the bounded SQL reads do', () => {
    const t = (value: string) => `2026-${value}+00:00`;
    const seed = [
      ['p3', t('09-05T00:00:00'), t('10-10T00:00:00')],
      ['p2', t('09-05T00:00:00'), t('10-10T00:00:00')],
      ['p1', t('09-01T00:00:00'), t('10-10T00:00:00')],
      ['u4', t('10-15T00:00:00'), null],
      ['u3', t('10-15T00:00:00'), null],
      ['u2', t('10-20T00:00:00'), null],
      ['u1', t('10-20T00:00:00.5'), null],
      ['p4', t('08-01T00:00:00'), t('10-12T00:00:00')],
      ['o2', t('07-02T00:00:00'), null],
      ['o1', t('07-01T00:00:00'), null],
    ] as const;

    const latest = latestRecords(
      seed.map(([id, updatedAt, pinnedAt]) => record(id, updatedAt, pinnedAt)),
    );

    expect(latest.map((r) => r.id)).toEqual([
      'p4',
      'p3',
      'p2',
      'p1',
      'u1',
      'u2',
      'u4',
      'u3',
    ]);
  });
});
