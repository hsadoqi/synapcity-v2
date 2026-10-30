/*
 * The shared D5 boundary vectors against PostgreSQL, through the Data API as an
 * ordinary signed-in user: every vector is inserted into each of the three
 * tables, and must be accepted or refused exactly as the vector says. The zod
 * side of the same file is `limit-vectors.test.ts` in `@synapcity/domain-records`.
 * Also proves the position check and that a value the app would normalize is
 * accepted once normalized.
 */
import { describe, expect, it } from 'vitest';

import {
  expandVectorValue,
  LIMIT_VECTORS,
} from '@synapcity/domain-records/testing';

import { createRecord } from './records';
import { withTwoUsers } from '../testing/db';

const TABLES = ['spaces', 'documents', 'dashboards'] as const;

describe('shared metadata vectors against PostgreSQL', () => {
  for (const table of TABLES) {
    it(`${table}: every vector is accepted or refused as the vector says`, async () => {
      await withTwoUsers(async (a) => {
        const mismatches: string[] = [];

        for (const vector of LIMIT_VECTORS) {
          const base = { name: 'n', icon: 'folder', tags: [] as string[] };
          const row = {
            ...base,
            [vector.field]: expandVectorValue(vector.value),
          };
          const { error, data } = await a.client
            .from(table)
            .insert(row)
            .select('id');
          const accepted = !error && (data?.length ?? 0) === 1;
          if (accepted !== (vector.db === 'accept')) {
            mismatches.push(
              `${vector.id}: expected ${vector.db}, database ${accepted ? 'accepted' : `refused (${error?.code})`}`,
            );
          }

          // What the app would have stored for this input is always accepted.
          if (vector.zod === 'accept' && vector.zodOutput !== undefined) {
            const normalized = {
              ...base,
              [vector.field]: expandVectorValue(vector.zodOutput),
            };
            const again = await a.client
              .from(table)
              .insert(normalized)
              .select('id');
            if (again.error) {
              mismatches.push(
                `${vector.id}: the normalized value was refused (${again.error.code})`,
              );
            }
          }
        }

        expect(mismatches).toEqual([]);
      });
    });
  }

  it('nothing is truncated: a refused over-long name leaves no row, and an accepted one is stored whole', async () => {
    await withTwoUsers(async (a) => {
      const long = 'x'.repeat(121);
      const refused = await a.client
        .from('documents')
        .insert({ name: long })
        .select('id');
      expect(refused.error?.code).toBe('23514');
      const exact = 'y'.repeat(120);
      const stored = await a.client
        .from('documents')
        .insert({ name: exact })
        .select('name');
      expect(stored.data?.[0]?.name).toBe(exact);
      const count = await a.client
        .from('documents')
        .select('id', { count: 'exact', head: true });
      expect(count.count).toBe(1);
    });
  });

  it('refuses a negative participation position and accepts none, zero and more', async () => {
    await withTwoUsers(async (a) => {
      const space = await createRecord(a.client, 'spaces', { name: 'S' });
      const doc = await createRecord(a.client, 'documents', { name: 'D' });
      if (!space.ok || !doc.ok) throw new Error('setup failed');

      for (const position of [null, 0, 5]) {
        await a.client
          .from('space_documents')
          .delete()
          .eq('space_id', space.id);
        const inserted = await a.client
          .from('space_documents')
          .insert({ space_id: space.id, document_id: doc.id, position });
        expect(inserted.error, `position ${position}`).toBeNull();
      }
      const negative = await a.client
        .from('space_documents')
        .update({ position: -1 })
        .eq('space_id', space.id);
      expect(negative.error?.code).toBe('23514');
    });
  });
});
