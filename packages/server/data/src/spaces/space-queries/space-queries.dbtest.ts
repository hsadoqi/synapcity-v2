/*
 * The navigation and relation reads against PostgreSQL, through the Data API
 * as ordinary signed-in users: the orders PostgREST applies (including inside
 * embeds), the kind filter, and row-level security keeping each person to
 * their own Spaces and participation rows.
 */
import { describe, expect, it } from 'vitest';

import { createRecord, type RecordTable } from '../../records';
import { withTwoUsers, type TestUser } from '../../testing/db';
import { addSpaceDashboard, addSpaceDocument } from '../space-participation';
import { setSpacePinned } from '../space-writes';
import {
  getSpaceRelations,
  listSpaceNavItems,
  listSpacesWithRelations,
} from './space-queries';

async function create(
  user: TestUser,
  table: RecordTable,
  name: string = table,
): Promise<string> {
  const created = await createRecord(user.client, table, { name });
  if (!created.ok) throw new Error(`Creating ${table}: ${created.error.code}`);
  return created.id;
}

describe('listSpaceNavItems', () => {
  it('lists only the caller’s spaces, pinned first, then most recently changed, with display fields only', async () => {
    await withTwoUsers(async (a, b) => {
      const first = await create(a, 'spaces', 'First');
      const second = await create(a, 'spaces', 'Second');
      const pinned = await create(a, 'spaces', 'Pinned');
      await create(b, 'spaces', 'Not yours');
      const pin = await setSpacePinned(a.client, first, true);
      if (!pin.ok) throw new Error(`Pinning: ${pin.error.code}`);

      const items = await listSpaceNavItems(a.client);

      // `first` is pinned; of the rest, `pinned` changed last.
      expect(items.map((item) => item.id)).toEqual([first, pinned, second]);
      // Display fields only: no owner, pin or view times leave the query.
      const allowed = [
        'description',
        'icon',
        'id',
        'name',
        'tags',
        'updatedAt',
      ];
      for (const item of items) {
        expect(
          Object.keys(item).filter((key) => !allowed.includes(key)),
        ).toEqual([]);
      }
    });
  });
});

describe('space relations', () => {
  it('lists every space with its own rows, newest addition first, and none of another person’s', async () => {
    await withTwoUsers(async (a, b) => {
      const space = await create(a, 'spaces');
      const empty = await create(a, 'spaces');
      const older = await create(a, 'documents');
      const newer = await create(a, 'documents');
      const dashboard = await create(a, 'dashboards');
      for (const outcome of [
        await addSpaceDocument(a.client, space, older),
        await addSpaceDocument(a.client, space, newer),
        await addSpaceDashboard(a.client, space, dashboard),
      ]) {
        expect(outcome).toEqual({ ok: true });
      }
      await create(b, 'spaces');

      const spaces = await listSpacesWithRelations(a.client);

      expect(spaces.map((s) => s.id)).toEqual([empty, space]);
      const withItems = spaces[1]!;
      expect(withItems.space_documents.map((l) => l.document_id)).toEqual([
        newer,
        older,
      ]);
      expect(withItems.space_dashboards).toEqual([
        expect.objectContaining({
          space_id: space,
          dashboard_id: dashboard,
          pinned: false,
          position: null,
        }),
      ]);
      expect(spaces[0]).toMatchObject({
        space_documents: [],
        space_dashboards: [],
      });
    });
  });

  it('reads one space’s rows of the kind asked for, or both', async () => {
    await withTwoUsers(async (a) => {
      const space = await create(a, 'spaces');
      const document = await create(a, 'documents');
      const dashboard = await create(a, 'dashboards');
      await addSpaceDocument(a.client, space, document);
      await addSpaceDashboard(a.client, space, dashboard);

      const documents = await getSpaceRelations(a.client, space, 'documents');
      expect(documents?.space_documents.map((l) => l.document_id)).toEqual([
        document,
      ]);
      expect(documents).not.toHaveProperty('space_dashboards');

      const dashboards = await getSpaceRelations(a.client, space, 'dashboards');
      expect(dashboards?.space_dashboards.map((l) => l.dashboard_id)).toEqual([
        dashboard,
      ]);
      expect(dashboards).not.toHaveProperty('space_documents');

      const both = await getSpaceRelations(a.client, space);
      expect(both?.space_documents).toHaveLength(1);
      expect(both?.space_dashboards).toHaveLength(1);
    });
  });

  it('reads someone else’s space as missing', async () => {
    await withTwoUsers(async (a, b) => {
      const theirs = await create(b, 'spaces');

      await expect(getSpaceRelations(a.client, theirs)).resolves.toBeNull();
    });
  });
});
