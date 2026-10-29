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
});
