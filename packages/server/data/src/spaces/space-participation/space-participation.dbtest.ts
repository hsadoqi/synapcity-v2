/*
 * Adding documents and dashboards to Spaces against PostgreSQL, through the
 * Data API as ordinary signed-in users, so the participation policies and
 * grants apply exactly as in production: a repeat add is a no-op that keeps
 * the row's per-Space settings, and someone else's Space or item is refused
 * with an error rather than skipped.
 */
import { describe, expect, it } from 'vitest';

import { createRecord, type RecordTable } from '../../records';
import { withTwoUsers, type TestUser } from '../../testing/db';
import {
  addSpaceDashboard,
  addSpaceDocument,
  listSpaceDashboards,
  listSpaceDocuments,
} from './space-participation';

async function create(user: TestUser, table: RecordTable): Promise<string> {
  const created = await createRecord(user.client, table, { name: table });
  if (!created.ok) throw new Error(`Creating ${table}: ${created.error.code}`);
  return created.id;
}

const KINDS = [
  {
    kind: 'documents',
    table: 'documents',
    add: addSpaceDocument,
    list: listSpaceDocuments,
  },
  {
    kind: 'dashboards',
    table: 'dashboards',
    add: addSpaceDashboard,
    list: listSpaceDashboards,
  },
] as const;

describe.each(KINDS)(
  'adding $kind to a Space',
  ({ kind, table, add, list }) => {
    it('adds once, and a repeat add changes nothing, per-Space settings included', async () => {
      await withTwoUsers(async (a) => {
        const spaceId = await create(a, 'spaces');
        const itemId = await create(a, table);

        await expect(add(a.client, spaceId, itemId)).resolves.toEqual({
          ok: true,
        });
        expect((await list(a.client, spaceId)).map((r) => r.id)).toEqual([
          itemId,
        ]);

        // Per-Space presentation the owner set after adding.
        const participation =
          kind === 'documents'
            ? a.client
                .from('space_documents')
                .update({ pinned: true, position: 3 })
                .eq('space_id', spaceId)
                .eq('document_id', itemId)
            : a.client
                .from('space_dashboards')
                .update({ pinned: true, position: 3 })
                .eq('space_id', spaceId)
                .eq('dashboard_id', itemId);
        expect((await participation).error).toBeNull();

        await expect(add(a.client, spaceId, itemId)).resolves.toEqual({
          ok: true,
        });

        const { data, error } =
          kind === 'documents'
            ? await a.client
                .from('space_documents')
                .select('pinned, position')
                .eq('space_id', spaceId)
            : await a.client
                .from('space_dashboards')
                .select('pinned, position')
                .eq('space_id', spaceId);
        expect(error).toBeNull();
        expect(data).toEqual([{ pinned: true, position: 3 }]);
      });
    });

    it('does not move ownership: the item stays the owner’s own record', async () => {
      await withTwoUsers(async (a) => {
        const spaceId = await create(a, 'spaces');
        const itemId = await create(a, table);
        await add(a.client, spaceId, itemId);

        const { data } = await a.client
          .from(table)
          .select('owner_id')
          .eq('id', itemId)
          .single();
        expect(data?.owner_id).toBe(a.id);
      });
    });

    it('refuses someone else’s item in your Space, and your item in theirs', async () => {
      await withTwoUsers(async (a, b) => {
        const aSpace = await create(a, 'spaces');
        const aItem = await create(a, table);
        const bSpace = await create(b, 'spaces');
        const bItem = await create(b, table);

        for (const [spaceId, itemId] of [
          [aSpace, bItem],
          [bSpace, aItem],
        ] as const) {
          const outcome = await add(a.client, spaceId, itemId);
          expect(outcome).toMatchObject({
            ok: false,
            error: { code: '42501' },
          });
        }
        expect(await list(a.client, aSpace)).toEqual([]);
        expect(await list(b.client, bSpace)).toEqual([]);
      });
    });

    it('refuses a repeat of someone else’s existing pair instead of passing it off as a duplicate', async () => {
      await withTwoUsers(async (a, b) => {
        const bSpace = await create(b, 'spaces');
        const bItem = await create(b, table);
        await expect(add(b.client, bSpace, bItem)).resolves.toEqual({
          ok: true,
        });

        // The pair exists, but the policy is checked before the conflict.
        await expect(add(a.client, bSpace, bItem)).resolves.toMatchObject({
          ok: false,
          error: { code: '42501' },
        });
      });
    });

    it('refuses a Space or item that does not exist', async () => {
      await withTwoUsers(async (a) => {
        const spaceId = await create(a, 'spaces');
        const missing = '00000000-0000-4000-8000-000000000000';

        await expect(add(a.client, spaceId, missing)).resolves.toMatchObject({
          ok: false,
        });
        await expect(
          add(a.client, missing, await create(a, table)),
        ).resolves.toMatchObject({ ok: false });
      });
    });
  },
);
