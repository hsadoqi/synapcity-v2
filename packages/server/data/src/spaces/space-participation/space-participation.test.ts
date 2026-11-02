import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addSpaceDashboard,
  addSpaceDocument,
  listSpaceDashboards,
  listSpaceDocuments,
} from './space-participation';

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

const ITEM_ID = '5d1f7c0e-3b0a-4f3e-9d57-0a1b2c3d4e5f';

/** A client whose insert resolves to `result`. */
function upsertReturning(result: { error: unknown; status?: number }) {
  const upsert = vi.fn(async () => result);
  const from = vi.fn(() => ({ upsert }));
  client = { from } as unknown as SupabaseServerClient;
  return { from, upsert };
}

const ADDS = [
  {
    kind: 'document',
    add: addSpaceDocument,
    table: 'space_documents',
    column: 'document_id',
  },
  {
    kind: 'dashboard',
    add: addSpaceDashboard,
    table: 'space_dashboards',
    column: 'dashboard_id',
  },
] as const;

describe.each(ADDS)('addSpace $kind', ({ add, table, column }) => {
  beforeEach(() => vi.clearAllMocks());

  it(`inserts only the pair into ${table}, leaving an existing row untouched`, async () => {
    const { from, upsert } = upsertReturning({ error: null, status: 201 });

    await expect(add(client, SPACE_ID, ITEM_ID)).resolves.toEqual({
      ok: true,
    });
    expect(from).toHaveBeenCalledWith(table);
    // Only the pair: the owner is the session's, and pinned/position keep
    // their defaults on a new row and their values on an existing one.
    expect(upsert).toHaveBeenCalledWith(
      { space_id: SPACE_ID, [column]: ITEM_ID },
      { onConflict: `space_id,${column}`, ignoreDuplicates: true },
    );
  });

  it('reports a pair already in the Space as added', async () => {
    // `on conflict do nothing` answers success with no row written.
    upsertReturning({ error: null, status: 201 });

    await expect(add(client, SPACE_ID, ITEM_ID)).resolves.toEqual({
      ok: true,
    });
  });

  it('returns a refusal by code and status, never the message', async () => {
    upsertReturning({
      error: {
        code: '42501',
        message: 'new row violates row-level security policy',
      },
      status: 403,
    });

    await expect(add(client, SPACE_ID, ITEM_ID)).resolves.toStrictEqual({
      ok: false,
      error: { code: '42501', status: 403 },
    });
  });

  it('returns a failure without a code when the request was cut off', async () => {
    upsertReturning({ error: { message: 'fetch failed' }, status: 0 });

    await expect(add(client, SPACE_ID, ITEM_ID)).resolves.toStrictEqual({
      ok: false,
      error: { status: 0 },
    });
  });
});
