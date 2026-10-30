import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  findSpace,
  getSpaceRelations,
  listSpaceNavItems,
  listSpaces,
  listSpacesWithRelations,
  listSpaceSummaries,
} from './space-queries';

const row = {
  id: '9ab8c032-8759-44e9-808d-0573d13f290e',
  owner_id: '11111111-1111-4111-8111-111111111111',
  name: 'Writing',
  description: null,
  icon: 'pen-line',
  tags: ['writing'],
  created_at: '2026-10-18T05:12:33.123456+00:00',
  updated_at: '2026-10-18T05:12:33.123456+00:00',
  pinned_at: null,
  last_viewed_at: null,
};

/** The client the last `queryReturning` built; each test passes it to the query under test. */
let client: SupabaseServerClient;

/** A stand-in for the PostgREST query builder that resolves to `result`. */
function queryReturning(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'order', 'eq']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  const from = vi.fn(() => builder);
  client = { from } as unknown as SupabaseServerClient;
  return { from, builder };
}

describe('space queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listSpaces', () => {
    it('maps rows onto the feature contract, newest first', async () => {
      const { from, builder } = queryReturning({ data: [row], error: null });

      const spaces = await listSpaces(client);

      expect(from).toHaveBeenCalledWith('spaces');
      expect(builder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(spaces).toEqual([
        {
          id: row.id,
          ownerId: row.owner_id,
          name: 'Writing',
          icon: 'pen-line',
          tags: ['writing'],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          pinnedAt: null,
          lastViewedAt: null,
        },
      ]);
      expect(spaces[0]).not.toHaveProperty('description', null);
    });

    it('maps the pinned and last-viewed times when they are set', async () => {
      queryReturning({
        data: [
          {
            ...row,
            pinned_at: '2026-10-18T06:00:00+00:00',
            last_viewed_at: '2026-10-18T07:00:00+00:00',
          },
        ],
        error: null,
      });

      const [space] = await listSpaces(client);

      expect(space?.pinnedAt).toBe('2026-10-18T06:00:00+00:00');
      expect(space?.lastViewedAt).toBe('2026-10-18T07:00:00+00:00');
    });

    it('keeps a description when there is one', async () => {
      queryReturning({
        data: [{ ...row, description: 'Drafts' }],
        error: null,
      });

      expect((await listSpaces(client))[0]?.description).toBe('Drafts');
    });

    it('reports a database error', async () => {
      queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

      await expect(listSpaces(client)).rejects.toThrow(
        'Failed to load spaces (code 42501)',
      );
    });

    it('rejects a malformed row instead of passing it on', async () => {
      queryReturning({ data: [{ ...row, name: 123 }], error: null });

      await expect(listSpaces(client)).rejects.toMatchObject({
        name: 'ZodError',
      });
    });
  });

  describe('listSpaceSummaries', () => {
    it('adds the document and dashboard counts to each space', async () => {
      const { builder } = queryReturning({
        data: [
          {
            ...row,
            space_documents: [{ count: 8 }],
            space_dashboards: [{ count: 1 }],
          },
        ],
        error: null,
      });

      const [space] = await listSpaceSummaries(client);

      expect(builder.select).toHaveBeenCalledWith(
        expect.stringContaining(
          'space_documents(count), space_dashboards(count)',
        ),
      );
      expect(space).toMatchObject({
        id: row.id,
        documentsTotal: 8,
        dashboardsTotal: 1,
      });
    });

    it('counts zero when nothing takes part in the space', async () => {
      queryReturning({
        data: [{ ...row, space_documents: [], space_dashboards: [] }],
        error: null,
      });

      const [space] = await listSpaceSummaries(client);

      expect(space).toMatchObject({ documentsTotal: 0, dashboardsTotal: 0 });
    });

    it('reports a database error', async () => {
      queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

      await expect(listSpaceSummaries(client)).rejects.toThrow(
        'Failed to load spaces (code 42501)',
      );
    });
  });

  describe('findSpace', () => {
    it('returns the matching space', async () => {
      const { builder } = queryReturning({ data: row, error: null });

      const space = await findSpace(client, row.id);

      expect(builder.eq).toHaveBeenCalledWith('id', row.id);
      expect(space?.id).toBe(row.id);
    });

    it('returns null when no row is visible to the owner', async () => {
      queryReturning({ data: null, error: null });

      await expect(findSpace(client, row.id)).resolves.toBeNull();
    });

    it('returns null for a malformed id without querying', async () => {
      const { from } = queryReturning({ data: row, error: null });

      await expect(findSpace(client, 'not-a-uuid')).resolves.toBeNull();
      expect(from).not.toHaveBeenCalled();
    });

    it('reports a database error with the id', async () => {
      queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

      await expect(findSpace(client, row.id)).rejects.toThrow(
        `Failed to load space ${row.id} (code 42501)`,
      );
    });
  });

  describe('listSpaceNavItems', () => {
    it('reads only the display fields, pinned first, then most recently changed', async () => {
      const { from, builder } = queryReturning({
        data: [
          {
            id: row.id,
            name: 'Writing',
            description: null,
            icon: 'pen-line',
            tags: ['writing'],
            updated_at: row.updated_at,
          },
        ],
        error: null,
      });

      await expect(listSpaceNavItems(client)).resolves.toEqual([
        {
          id: row.id,
          name: 'Writing',
          icon: 'pen-line',
          tags: ['writing'],
          updatedAt: row.updated_at,
        },
      ]);
      expect(from).toHaveBeenCalledWith('spaces');
      expect(builder.select).toHaveBeenCalledWith(
        'id, name, description, icon, tags, updated_at',
      );
      expect(builder.order).toHaveBeenNthCalledWith(1, 'pinned_at', {
        ascending: false,
        nullsFirst: false,
      });
      expect(builder.order).toHaveBeenNthCalledWith(2, 'updated_at', {
        ascending: false,
      });
    });

    it('keeps a description', async () => {
      queryReturning({
        data: [
          {
            id: row.id,
            name: 'Writing',
            description: 'Drafts',
            icon: 'pen-line',
            tags: [],
            updated_at: row.updated_at,
          },
        ],
        error: null,
      });

      expect((await listSpaceNavItems(client))[0]?.description).toBe('Drafts');
    });

    it('reports a database error', async () => {
      queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

      await expect(listSpaceNavItems(client)).rejects.toThrow(
        'Failed to load spaces (code 42501)',
      );
    });
  });

  const documentLink = {
    space_id: row.id,
    document_id: '5d1f7c0e-3b0a-4f3e-9d57-0a1b2c3d4e5f',
    pinned: false,
    position: null,
    added_at: '2026-10-18T07:00:00+00:00',
  };
  const dashboardLink = {
    space_id: row.id,
    dashboard_id: '6e2a8d1f-4c1b-4a4f-8e68-1b2c3d4e5f60',
    pinned: true,
    position: 2,
    added_at: '2026-10-18T08:00:00+00:00',
  };
  const DOCUMENT_EMBED =
    'space_documents(space_id, document_id, pinned, position, added_at)';
  const DASHBOARD_EMBED =
    'space_dashboards(space_id, dashboard_id, pinned, position, added_at)';
  const newestIn = (referencedTable: string) =>
    ['added_at', { referencedTable, ascending: false }] as const;

  describe('listSpacesWithRelations', () => {
    it('returns every space with its participation rows, each newest first', async () => {
      const { builder } = queryReturning({
        data: [
          {
            ...row,
            space_documents: [documentLink],
            space_dashboards: [dashboardLink],
          },
        ],
        error: null,
      });

      const [space] = await listSpacesWithRelations(client);

      expect(builder.select).toHaveBeenCalledWith(
        expect.stringContaining(`${DOCUMENT_EMBED}, ${DASHBOARD_EMBED}`),
      );
      expect(builder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(builder.order).toHaveBeenCalledWith(
        ...newestIn('space_documents'),
      );
      expect(builder.order).toHaveBeenCalledWith(
        ...newestIn('space_dashboards'),
      );
      expect(space).toMatchObject({
        id: row.id,
        ownerId: row.owner_id,
        space_documents: [documentLink],
        space_dashboards: [dashboardLink],
      });
    });

    it('reports a database error', async () => {
      queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

      await expect(listSpacesWithRelations(client)).rejects.toThrow(
        'Failed to load spaces (code 42501)',
      );
    });
  });

  describe('getSpaceRelations', () => {
    it.each([
      ['documents', DOCUMENT_EMBED, 'space_documents', documentLink],
      ['dashboards', DASHBOARD_EMBED, 'space_dashboards', dashboardLink],
    ] as const)(
      'reads only the %s rows when asked for that kind',
      async (type, embed, key, link) => {
        const { builder } = queryReturning({
          data: { ...row, [key]: [link] },
          error: null,
        });

        const space = await getSpaceRelations(client, row.id, type);

        const select = (builder.select as ReturnType<typeof vi.fn>).mock
          .calls[0]![0] as string;
        expect(select).toContain(embed);
        expect(select).not.toContain(
          key === 'space_documents' ? 'space_dashboards' : 'space_documents',
        );
        expect(builder.eq).toHaveBeenCalledWith('id', row.id);
        expect(builder.order).toHaveBeenCalledExactlyOnceWith(...newestIn(key));
        expect(space).toEqual({
          ...(await findSpaceFrom(row)),
          [key]: [link],
        });
      },
    );

    it('reads both kinds when no type is given', async () => {
      const { builder } = queryReturning({
        data: {
          ...row,
          space_documents: [documentLink],
          space_dashboards: [dashboardLink],
        },
        error: null,
      });

      await expect(getSpaceRelations(client, row.id)).resolves.toMatchObject({
        id: row.id,
        space_documents: [documentLink],
        space_dashboards: [dashboardLink],
      });
      expect(builder.select).toHaveBeenCalledWith(
        expect.stringContaining(`${DOCUMENT_EMBED}, ${DASHBOARD_EMBED}`),
      );
      expect(builder.order).toHaveBeenCalledTimes(2);
    });

    it('returns null for a malformed id without querying', async () => {
      const { from } = queryReturning({ data: null, error: null });

      await expect(getSpaceRelations(client, 'not-a-uuid')).resolves.toBeNull();
      expect(from).not.toHaveBeenCalled();
    });

    it('returns null when the space is missing or not the caller’s', async () => {
      queryReturning({ data: null, error: null });

      await expect(
        getSpaceRelations(client, row.id, 'documents'),
      ).resolves.toBeNull();
    });

    it('reports a database error', async () => {
      queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

      await expect(getSpaceRelations(client, row.id)).rejects.toThrow(
        `Failed to load space ${row.id} (code 42501)`,
      );
    });
  });
});

/** The Space contract for `row`, as `findSpace` maps it. */
async function findSpaceFrom(source: typeof row) {
  queryReturning({ data: source, error: null });
  return findSpace(client, source.id);
}
