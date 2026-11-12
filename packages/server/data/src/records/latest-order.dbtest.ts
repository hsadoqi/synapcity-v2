/*
 * The sidebar's bounded reads (`listLatestSpaces`, `listLatestRecords`)
 * against PostgreSQL, through the Data API as ordinary signed-in users.
 *
 * Ordering parity: before these reads, the app read every row newest first
 * (`created_at DESC`) and sorted in memory with `latestRecords`
 * (`apps/web/src/lib/sidebar-records/latest-records.ts`): pinned first, the
 * newest pin on top, then the most recently changed, a stable sort that keeps
 * the input order for ties. The SQL order must give the same result. These
 * tests seed ties on the pin time, on the change time, on both, and a change
 * time with and without fractional seconds, then check the SQL order against
 * an explicit list and against that in-memory rule applied to the full,
 * newest-first read. `latest-records.test.ts` in the app runs `latestRecords`
 * itself over the same seed and expects the same list.
 */
import { describe, expect, it } from 'vitest';

import { listLatestSpaces, listSpaces } from '../spaces/space-queries';
import { withSessions, withTwoUsers, type TestUser } from '../testing/db';
import {
  createRecord,
  listLatestRecords,
  listRecordSummaries,
  type RecordTable,
} from './records';

/**
 * The seed, as `[label, created_at, updated_at, pinned_at]`. The expected
 * order is p4 p3 p2 p1 u1 u2 u4 u3; every row's creation time is distinct, so
 * the in-memory rule's fallback (input order) is defined.
 */
const SEED = [
  [
    'p1',
    '2026-09-01 00:00:00+00',
    '2026-09-01 00:00:00+00',
    '2026-10-10 00:00:00+00',
  ],
  [
    'p2',
    '2026-09-02 00:00:00+00',
    '2026-09-05 00:00:00+00',
    '2026-10-10 00:00:00+00',
  ],
  [
    'p3',
    '2026-09-03 00:00:00+00',
    '2026-09-05 00:00:00+00',
    '2026-10-10 00:00:00+00',
  ],
  [
    'p4',
    '2026-08-01 00:00:00+00',
    '2026-08-01 00:00:00+00',
    '2026-10-12 00:00:00+00',
  ],
  ['u1', '2026-08-02 00:00:00+00', '2026-10-20 00:00:00.5+00', null],
  ['u2', '2026-08-03 00:00:00+00', '2026-10-20 00:00:00+00', null],
  ['u3', '2026-08-04 00:00:00+00', '2026-10-15 00:00:00+00', null],
  ['u4', '2026-08-05 00:00:00+00', '2026-10-15 00:00:00+00', null],
  // Older and unpinned: outside the first eight.
  ['o1', '2026-07-01 00:00:00+00', '2026-07-01 00:00:00+00', null],
  ['o2', '2026-07-02 00:00:00+00', '2026-07-02 00:00:00+00', null],
] as const;

const EXPECTED = ['p4', 'p3', 'p2', 'p1', 'u1', 'u2', 'u4', 'u3'];

type Ordered = { id: string; pinnedAt?: string | null; updatedAt: string };

/**
 * The in-memory rule `latestRecords` applies: a stable sort, so ties keep the
 * input order. Times compare as text; PostgREST returns them in one format.
 */
function latestFirst<T extends Ordered>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    if (Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)) return a.pinnedAt ? -1 : 1;
    if (a.pinnedAt && b.pinnedAt && a.pinnedAt !== b.pinnedAt) {
      return a.pinnedAt < b.pinnedAt ? 1 : -1;
    }
    if (a.updatedAt === b.updatedAt) return 0;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

const TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?\+00$/;

/** Sets a row's times as the administrator, with the stamping triggers off. */
async function setTimes(
  table: RecordTable,
  times: {
    id: string;
    created: string;
    updated: string;
    pinned: string | null;
  }[],
) {
  await withSessions(1, async ([admin]) => {
    await admin!.run('set session_replication_role = replica');
    for (const { id, created, updated, pinned } of times) {
      for (const value of [created, updated, pinned ?? created]) {
        if (!TIMESTAMP.test(value)) throw new Error(`Bad seed time ${value}`);
      }
      const pin = pinned ? `'${pinned}'` : 'null';
      const { err } = await admin!.run(
        `update public.${table} set created_at = '${created}', updated_at = '${updated}', pinned_at = ${pin} where id = '${id}'`,
      );
      if (err.trim()) throw new Error(`Seeding ${table}: ${err.trim()}`);
    }
    await admin!.run('set session_replication_role = origin');
  });
}

async function create(user: TestUser, table: RecordTable, name: string) {
  const created = await createRecord(user.client, table, { name });
  if (!created.ok)
    throw new Error(`Creating ${table}: ${created.failure.code}`);
  return created.id;
}

/** Creates the seed in `table` for `user`; returns the label of each id. */
async function seed(user: TestUser, table: RecordTable) {
  const labels = new Map<string, string>();
  const times = [];
  for (const [label, created, updated, pinned] of SEED) {
    const id = await create(user, table, label);
    labels.set(id, label);
    times.push({ id, created, updated, pinned });
  }
  await setTimes(table, times);
  return labels;
}

/** The newest-first full read the sidebar used before, for each table. */
function fullRead(user: TestUser, table: RecordTable) {
  return table === 'spaces'
    ? listSpaces(user.client)
    : listRecordSummaries(user.client, table);
}

function latestRead(user: TestUser, table: RecordTable, limit: number) {
  return table === 'spaces'
    ? listLatestSpaces(user.client, limit)
    : listLatestRecords(user.client, table, limit);
}

describe.each(['spaces', 'documents', 'dashboards'] as const)(
  'the latest %s',
  (table) => {
    it('come back in the in-memory order, cut to the limit, with ties resolved the same way', async () => {
      await withTwoUsers(async (a, b) => {
        const labels = await seed(a, table);
        await create(b, table, 'Not yours');

        const latest = await latestRead(a, table, 8);
        const full = await fullRead(a, table);

        expect(latest.map((row) => labels.get(row.id))).toEqual(EXPECTED);
        expect(latest.map((row) => row.id)).toEqual(
          latestFirst(full)
            .slice(0, 8)
            .map((row) => row.id),
        );
        // Plain contracts: no participation counts are read.
        for (const row of latest) {
          expect(row).not.toHaveProperty('spacesTotal');
          expect(row).not.toHaveProperty('documentsTotal');
        }
      });
    });

    it('order rows equal in every time by id, and read only the caller’s', async () => {
      await withTwoUsers(async (a, b) => {
        const first = await create(a, table, 'first');
        const second = await create(a, table, 'second');
        const theirs = await create(b, table, 'theirs');
        const same = '2026-09-01 00:00:00+00';
        await setTimes(
          table,
          [first, second, theirs].map((id) => ({
            id,
            created: same,
            updated: same,
            pinned: null,
          })),
        );

        const latest = await latestRead(a, table, 8);

        expect(latest.map((row) => row.id)).toEqual([first, second].sort());
      });
    });
  },
);
