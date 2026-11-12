import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { describe, expect, it, vi } from 'vitest';

import {
  createRecord,
  findRecord,
  listLatestRecords,
  listRecordSummaries,
  recordRecordView,
  setRecordPinned,
} from './records';

const row = {
  id: '9ab8c032-8759-44e9-808d-0573d13f290e',
  owner_id: '11111111-1111-4111-8111-111111111111',
  name: 'Launch plan',
  description: null,
  icon: 'file-text',
  tags: ['work'],
  created_at: '2026-10-18T05:12:33.123456+00:00',
  updated_at: '2026-10-18T05:12:33.123456+00:00',
  pinned_at: null,
  last_viewed_at: null,
};

/** A stand-in for the query builder: every method returns it, and awaiting it gives `result`. */
function clientReturning(result: {
  data: unknown;
  error: unknown;
  status?: number;
}) {
  const builder: Record<string, unknown> = {};
  for (const method of [
    'select',
    'order',
    'update',
    'eq',
    'insert',
    'single',
    'limit',
  ]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  const from = vi.fn(() => builder);
  return { client: { from } as never, from, builder };
}

describe('listRecordSummaries', () => {
  it.each([
    ['documents', 'space_documents'],
    ['dashboards', 'space_dashboards'],
  ] as const)(
    'reads %s with the count from %s',
    async (kind, participation) => {
      const { client, from, builder } = clientReturning({
        data: [{ ...row, [participation]: [{ count: 3 }] }],
        error: null,
      });

      const [record] = await listRecordSummaries(client, kind);

      expect(from).toHaveBeenCalledWith(kind);
      expect(builder.select).toHaveBeenCalledWith(
        expect.stringContaining(`${participation}(count)`),
      );
      expect(builder.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(record).toMatchObject({
        id: row.id,
        name: 'Launch plan',
        spacesTotal: 3,
        pinnedAt: null,
      });
      expect(record).not.toHaveProperty('description', null);
    },
  );

  it('counts zero when it is in no space', async () => {
    const { client } = clientReturning({
      data: [{ ...row, space_documents: [] }],
      error: null,
    });

    const [record] = await listRecordSummaries(client, 'documents');

    expect(record?.spacesTotal).toBe(0);
  });

  it('throws with the code, never the database message', async () => {
    const { client } = clientReturning({
      data: null,
      error: { code: '42501', message: 'boom' },
    });

    const failure = listRecordSummaries(client, 'documents');

    await expect(failure).rejects.toThrow(
      'Failed to load documents (code 42501)',
    );
    await expect(failure).rejects.not.toThrow('boom');
  });

  it('rejects a malformed row instead of passing it on', async () => {
    const { client } = clientReturning({
      data: [{ ...row, name: 123, space_documents: [] }],
      error: null,
    });

    await expect(
      listRecordSummaries(client, 'documents'),
    ).rejects.toMatchObject({ name: 'ZodError' });
  });
});

describe('listLatestRecords', () => {
  it.each(['documents', 'dashboards'] as const)(
    'reads the limit of %s in sidebar order, with no participation counts',
    async (kind) => {
      const { client, from, builder } = clientReturning({
        data: [row],
        error: null,
      });

      const [record] = await listLatestRecords(client, kind, 8);

      expect(from).toHaveBeenCalledWith(kind);
      expect(builder.select).toHaveBeenCalledWith(
        expect.not.stringContaining('count'),
      );
      expect((builder.order as ReturnType<typeof vi.fn>).mock.calls).toEqual([
        ['pinned_at', { ascending: false, nullsFirst: false }],
        ['updated_at', { ascending: false }],
        ['created_at', { ascending: false }],
        ['id'],
      ]);
      expect(builder.limit).toHaveBeenCalledWith(8);
      expect(record).toMatchObject({ id: row.id, name: 'Launch plan' });
      expect(record).not.toHaveProperty('spacesTotal');
    },
  );

  it('throws with the code, never the database message', async () => {
    const { client } = clientReturning({
      data: null,
      error: { code: '42501', message: 'boom' },
    });

    const failure = listLatestRecords(client, 'dashboards', 8);

    await expect(failure).rejects.toThrow(
      'Failed to load dashboards (code 42501)',
    );
    await expect(failure).rejects.not.toThrow('boom');
  });
});

describe('setRecordPinned', () => {
  it.each(['spaces', 'documents', 'dashboards'] as const)(
    'pins one of the %s and reports the time the database stamped',
    async (table) => {
      const { client, from, builder } = clientReturning({
        data: [{ pinned_at: '2026-10-18T12:00:00+00:00' }],
        error: null,
      });

      await expect(
        setRecordPinned(client, table, 'id-1', true),
      ).resolves.toEqual({ ok: true, pinnedAt: '2026-10-18T12:00:00+00:00' });
      expect(from).toHaveBeenCalledWith(table);
      expect(builder.eq).toHaveBeenCalledWith('id', 'id-1');
      expect(builder.select).toHaveBeenCalledWith('pinned_at');
      expect(
        (builder.update as ReturnType<typeof vi.fn>).mock.calls[0]![0]
          .pinned_at,
      ).toEqual(expect.any(String));
    },
  );

  it('unpins by clearing the time', async () => {
    const { client, builder } = clientReturning({
      data: [{ pinned_at: null }],
      error: null,
    });

    await expect(
      setRecordPinned(client, 'documents', 'id-1', false),
    ).resolves.toEqual({ ok: true, pinnedAt: null });
    expect(builder.update).toHaveBeenCalledWith({ pinned_at: null });
  });

  it('does not report success when no row was written', async () => {
    const { client } = clientReturning({ data: [], error: null });

    await expect(
      setRecordPinned(client, 'documents', 'id-1', true),
    ).resolves.toStrictEqual({
      ok: false,
      failure: { code: 'row_not_written' },
    });
  });

  it('reports a database error by code and status only', async () => {
    const { client } = clientReturning({
      data: null,
      error: { code: '42501', message: 'boom', details: 'row (secret)' },
    });

    await expect(
      setRecordPinned(client, 'documents', 'id-1', true),
    ).resolves.toStrictEqual({ ok: false, failure: { code: '42501' } });
  });
});

describe('createRecord', () => {
  it.each(['spaces', 'documents', 'dashboards'] as const)(
    'creates one of the %s with only its name and reports the new id',
    async (table) => {
      const { client, from, builder } = clientReturning({
        data: { id: 'new-id' },
        error: null,
      });

      await expect(
        createRecord(client, table, { name: 'Garden plans' }),
      ).resolves.toEqual({ ok: true, id: 'new-id' });
      expect(from).toHaveBeenCalledWith(table);
      // The owner comes from the session (the column defaults to auth.uid()).
      expect(builder.insert).toHaveBeenCalledWith({ name: 'Garden plans' });
      expect(builder.select).toHaveBeenCalledWith('id');
    },
  );

  it('inserts only the create fields, by name, whatever else the input carries', async () => {
    const { client, builder } = clientReturning({
      data: { id: 'new-id' },
      error: null,
    });
    // A non-literal can carry keys the type does not list; none of them may
    // reach the insert as a column (the exact match below refuses owner_id).
    const input = {
      name: 'Garden plans',
      description: 'Beds and paths',
      icon: 'sprout',
      tags: ['outdoors'],
      owner_id: 'someone-else',
    };

    await createRecord(client, 'spaces', input);

    expect(builder.insert).toHaveBeenCalledWith({
      name: 'Garden plans',
      description: 'Beds and paths',
      icon: 'sprout',
      tags: ['outdoors'],
    });
  });

  it('reports a database error by code and status only', async () => {
    const { client } = clientReturning({
      data: null,
      error: { code: '23514', message: 'check (secret)', details: 'row' },
    });

    await expect(
      createRecord(client, 'documents', { name: 'x' }),
    ).resolves.toStrictEqual({ ok: false, failure: { code: '23514' } });
  });

  it('keeps the response status, so a dropped request reads as unconfirmed', async () => {
    const { client } = clientReturning({
      data: null,
      error: { code: '', message: 'TypeError: fetch failed' },
      status: 0,
    });

    await expect(
      createRecord(client, 'spaces', { name: 'x' }),
    ).resolves.toStrictEqual({ ok: false, failure: { code: '', status: 0 } });
  });
});

describe('findRecord', () => {
  it.each(['documents', 'dashboards'] as const)(
    'reads one %s by id',
    async (kind) => {
      const { client, from, builder } = clientReturning({
        data: row,
        error: null,
      });

      const record = await findRecord(client, kind, row.id);

      expect(from).toHaveBeenCalledWith(kind);
      expect(builder.eq).toHaveBeenCalledWith('id', row.id);
      expect(record).toMatchObject({
        id: row.id,
        ownerId: row.owner_id,
        name: 'Launch plan',
        icon: 'file-text',
      });
      expect(record?.description).toBeUndefined();
    },
  );

  it('returns null when no row is visible to the owner', async () => {
    const { client } = clientReturning({ data: null, error: null });

    await expect(findRecord(client, 'documents', row.id)).resolves.toBeNull();
  });

  it('returns null for a malformed id without querying', async () => {
    const { client, from } = clientReturning({ data: row, error: null });

    await expect(
      findRecord(client, 'dashboards', 'not-a-uuid'),
    ).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it('reports a database error with the kind and id', async () => {
    const { client } = clientReturning({
      data: null,
      error: { code: '42501', message: 'boom' },
    });

    await expect(findRecord(client, 'dashboards', row.id)).rejects.toThrow(
      `Failed to load dashboard ${row.id} (code 42501)`,
    );
  });
});

describe('recordRecordView', () => {
  const id = '9ab8c032-8759-44e9-808d-0573d13f290e';
  const now = new Date('2026-10-29T10:00:00.000Z');

  function viewClient(error: unknown = null) {
    const or = vi.fn().mockResolvedValue({ error });
    const eq = vi.fn(() => ({ or }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    return {
      client: { from } as unknown as SupabaseServerClient,
      from,
      update,
      eq,
      or,
    };
  }

  it('stamps the view on the named table, skipping a view under a minute old', async () => {
    const { client, from, update, eq, or } = viewClient();

    await expect(
      recordRecordView(client, 'dashboards', id, now),
    ).resolves.toEqual({ ok: true });

    expect(from).toHaveBeenCalledWith('dashboards');
    expect(update).toHaveBeenCalledWith({
      last_viewed_at: '2026-10-29T10:00:00.000Z',
    });
    expect(eq).toHaveBeenCalledWith('id', id);
    expect(or).toHaveBeenCalledWith(
      'last_viewed_at.is.null,last_viewed_at.lt.2026-10-29T09:59:00.000Z',
    );
  });

  it('reports a failure by code and status only', async () => {
    const { client } = viewClient({ code: '42501', message: 'private' });

    await expect(
      recordRecordView(client, 'dashboards', id, now),
    ).resolves.toEqual({ ok: false, failure: { code: '42501' } });
  });
});
