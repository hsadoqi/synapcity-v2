import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { describe, expect, it, vi } from 'vitest';

import {
  COMPOSITION_SCHEMA_VERSION,
  loadComposition,
  saveComposition,
} from './dashboard-compositions';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

type Result = { data?: unknown; error?: unknown; status?: number };

/**
 * A fake client: each `from()` starts a query chain that ends at `maybeSingle`,
 * `insert`, or the `select` that follows an `update`, and settles with the
 * next queued result.
 */
function fakeClient(...results: Result[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  const queue = [...results];
  const settle = () => Promise.resolve(queue.shift() ?? { data: null });
  const client = {
    from: vi.fn((...args: unknown[]) => {
      calls.push({ method: 'from', args });
      let updated = false;
      const chain: Record<string, unknown> = {};
      for (const method of [
        'select',
        'insert',
        'update',
        'eq',
        'maybeSingle',
      ]) {
        chain[method] = (...a: unknown[]) => {
          calls.push({ method, args: a });
          if (method === 'update') updated = true;
          const ends =
            method === 'maybeSingle' ||
            method === 'insert' ||
            (method === 'select' && updated);
          return ends ? settle() : chain;
        };
      }
      return chain;
    }),
  };
  return { client: client as unknown as SupabaseServerClient, calls };
}

describe('loadComposition', () => {
  it('returns the stored document and revision', async () => {
    const { client } = fakeClient({
      data: {
        composition: { widgets: [] },
        schema_version: COMPOSITION_SCHEMA_VERSION,
        revision: 4,
      },
    });
    await expect(loadComposition(client, ID)).resolves.toEqual({
      composition: { widgets: [] },
      revision: 4,
    });
  });

  it('is null when nothing was saved yet', async () => {
    const { client } = fakeClient({ data: null });
    await expect(loadComposition(client, ID)).resolves.toBeNull();
  });

  it('is null for an id that is not a uuid, without asking the database', async () => {
    const { client, calls } = fakeClient();
    await expect(loadComposition(client, 'nope')).resolves.toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('throws on a failed read, naming only the code', async () => {
    const { client } = fakeClient({
      error: { code: '42501', message: 'secret row data' },
    });
    await expect(loadComposition(client, ID)).rejects.toThrow(/code 42501/);
    await expect(
      loadComposition(
        fakeClient({ error: { code: '42501', message: 'secret row data' } })
          .client,
        ID,
      ),
    ).rejects.not.toThrow(/secret/);
  });

  it('refuses a document version it does not know', async () => {
    const { client } = fakeClient({
      data: { composition: {}, schema_version: 2, revision: 1 },
    });
    await expect(loadComposition(client, ID)).rejects.toThrow(
      /unsupported_schema_version/,
    );
  });
});

describe('saveComposition', () => {
  it('inserts the first save at revision 1', async () => {
    const { client, calls } = fakeClient({ error: null });
    await expect(
      saveComposition(client, ID, { widgets: [] }, 0),
    ).resolves.toEqual({ ok: true, revision: 1 });
    expect(calls.find((c) => c.method === 'insert')?.args[0]).toEqual({
      dashboard_id: ID,
      composition: { widgets: [] },
      schema_version: COMPOSITION_SCHEMA_VERSION,
      revision: 1,
    });
  });

  it('reports a racing first save as a conflict', async () => {
    const { client } = fakeClient({ error: { code: '23505' }, status: 409 });
    await expect(saveComposition(client, ID, {}, 0)).resolves.toEqual({
      ok: false,
      reason: 'conflict',
    });
  });

  it('reports a refused insert as a failure with code and status only', async () => {
    const { client } = fakeClient({
      error: { code: '42501', message: 'private' },
      status: 403,
    });
    const outcome = await saveComposition(client, ID, {}, 0);
    expect(outcome).toEqual({
      ok: false,
      reason: 'failed',
      error: { code: '42501', status: 403 },
    });
  });

  it('updates only the row still at the expected revision and bumps it', async () => {
    const { client, calls } = fakeClient({ data: [{ revision: 4 }] });
    await expect(saveComposition(client, ID, { a: 1 }, 3)).resolves.toEqual({
      ok: true,
      revision: 4,
    });
    expect(calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      composition: { a: 1 },
      revision: 4,
    });
    const eqs = calls.filter((c) => c.method === 'eq').map((c) => c.args);
    expect(eqs).toEqual([
      ['dashboard_id', ID],
      ['revision', 3],
    ]);
  });

  it('never reports success for a zero-row write: a moved revision is a conflict', async () => {
    const { client } = fakeClient({ data: [] }, { data: { revision: 9 } });
    await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
      ok: false,
      reason: 'conflict',
    });
  });

  it('a zero-row write on a row the caller cannot see is a failure, not a conflict', async () => {
    const { client } = fakeClient({ data: [] }, { data: null });
    await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
      ok: false,
      reason: 'failed',
      error: { code: 'row_not_written' },
    });
  });

  it('a zero-row write whose row still has the expected revision is a failure', async () => {
    const { client } = fakeClient({ data: [] }, { data: { revision: 3 } });
    await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
      ok: false,
      reason: 'failed',
      error: { code: 'row_not_written' },
    });
  });

  it('reports a failed update and a failed follow-up read as failures', async () => {
    const { client } = fakeClient({ error: { code: 'PGRST301' }, status: 401 });
    await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
      ok: false,
      reason: 'failed',
      error: { code: 'PGRST301', status: 401 },
    });
    const followUp = fakeClient(
      { data: [] },
      { error: { code: '08006' }, status: 503 },
    );
    await expect(
      saveComposition(followUp.client, ID, {}, 3),
    ).resolves.toMatchObject({ ok: false, reason: 'failed' });
  });
});
