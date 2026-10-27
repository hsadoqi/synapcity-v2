import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listSpaceDashboards, listSpaceDocuments } from './space-participation';

const SPACE_ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

const item = {
  id: '5d1f7c0e-3b0a-4f3e-9d57-0a1b2c3d4e5f',
  owner_id: '11111111-1111-4111-8111-111111111111',
  name: 'Outline',
  description: null,
  icon: 'file-text',
  tags: ['draft'],
  created_at: '2026-10-18T05:12:33.123456+00:00',
  updated_at: '2026-10-18T06:12:33.123456+00:00',
  pinned_at: null,
  last_viewed_at: null,
};

let client: SupabaseServerClient;

/** A stand-in for the PostgREST query builder that resolves to `result`. */
function queryReturning(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order']) {
    builder[method] = vi.fn(() => builder);
  }
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  const from = vi.fn(() => builder);
  client = { from } as unknown as SupabaseServerClient;
  return { from, builder };
}

const KINDS = [
  {
    kind: 'documents',
    list: listSpaceDocuments,
    table: 'space_documents',
    embedded: 'documents',
  },
  {
    kind: 'dashboards',
    list: listSpaceDashboards,
    table: 'space_dashboards',
    embedded: 'dashboards',
  },
] as const;

describe.each(KINDS)('listSpace $kind', ({ kind, list, table, embedded }) => {
  beforeEach(() => vi.clearAllMocks());

  it(`reads ${table} for the space, newest first, through the embedded ${embedded}`, async () => {
    const { from, builder } = queryReturning({
      data: [{ [embedded]: item }],
      error: null,
    });

    await list(client, SPACE_ID);

    expect(from).toHaveBeenCalledWith(table);
    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining(`${embedded}(`),
    );
    expect(builder.eq).toHaveBeenCalledWith('space_id', SPACE_ID);
    expect(builder.order).toHaveBeenCalledWith('added_at', {
      ascending: false,
    });
  });

  it('maps each embedded row onto the base record contract', async () => {
    queryReturning({
      data: [{ [embedded]: item }],
      error: null,
    });

    const records = await list(client, SPACE_ID);

    expect(records).toEqual([
      {
        id: item.id,
        ownerId: item.owner_id,
        name: 'Outline',
        icon: 'file-text',
        tags: ['draft'],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        pinnedAt: null,
        lastViewedAt: null,
      },
    ]);
    expect(records[0]).not.toHaveProperty('description', null);
  });

  it('skips a participation row whose item is not visible', async () => {
    queryReturning({
      data: [{ [embedded]: null }, { [embedded]: item }],
      error: null,
    });

    await expect(list(client, SPACE_ID)).resolves.toHaveLength(1);
  });

  it('returns an empty list for a malformed id without querying', async () => {
    const { from } = queryReturning({ data: [], error: null });

    await expect(list(client, 'not-a-uuid')).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it('reports a database error with the space id', async () => {
    queryReturning({ data: null, error: { code: '42501', message: 'boom' } });

    await expect(list(client, SPACE_ID)).rejects.toThrow(
      `Failed to load ${kind} of space ${SPACE_ID} (code 42501)`,
    );
  });

  it('rejects a malformed item instead of passing it on', async () => {
    queryReturning({
      data: [{ [embedded]: { ...item, name: 123 } }],
      error: null,
    });

    await expect(list(client, SPACE_ID)).rejects.toMatchObject({
      name: 'ZodError',
    });
  });
});
