import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findSpace, listSpaces, listSpaceSummaries } from './space-queries';

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
});
