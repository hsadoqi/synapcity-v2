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

  it('throws when the composition is missing, never an empty value', async () => {
    const { client } = fakeClient({ data: null });
    const failure = await loadComposition(client, ID).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(Error);
    expect(failure).toMatchObject({ code: 'composition_missing' });
    expect((failure as Error).message).toContain(ID);
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
  it('has no insert path: a first save does not exist any more', async () => {
    const { client, calls } = fakeClient();
    await expect(saveComposition(client, ID, {}, 0)).resolves.toEqual({
      ok: false,
      reason: 'failed',
      error: { code: 'invalid_revision' },
    });
    expect(calls).toHaveLength(0);
    expect(calls.some((c) => c.method === 'insert')).toBe(false);
  });

  it.each([-1, 1.5, Number.NaN])(
    'refuses revision %s before asking the database',
    async (revision) => {
      const { client, calls } = fakeClient();
      await expect(
        saveComposition(client, ID, {}, revision),
      ).resolves.toMatchObject({
        ok: false,
        reason: 'failed',
      });
      expect(calls).toHaveLength(0);
    },
  );

  it('updates only the row still at the expected revision and bumps it', async () => {
    const { client, calls } = fakeClient({ data: [{ revision: 4 }] });
    await expect(saveComposition(client, ID, { a: 1 }, 3)).resolves.toEqual({
      ok: true,
      revision: 4,
    });
    expect(calls.find((c) => c.method === 'update')?.args[0]).toMatchObject({
      composition: { a: 1 },
      schema_version: COMPOSITION_SCHEMA_VERSION,
      revision: 4,
    });
    const eqs = calls.filter((c) => c.method === 'eq').map((c) => c.args);
    expect(eqs).toEqual([
      ['dashboard_id', ID],
      ['revision', 3],
    ]);
  });

  describe('when no row was written', () => {
    it('a moved revision is a conflict', async () => {
      const { client } = fakeClient(
        { data: [] },
        { data: { composition: {}, revision: 9 } },
      );
      await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
        ok: false,
        reason: 'conflict',
      });
    });

    it('the next revision holding other content is a conflict, not a success', async () => {
      const { client } = fakeClient(
        { data: [] },
        { data: { composition: { a: 'someone else' }, revision: 4 } },
      );
      await expect(
        saveComposition(client, ID, { a: 'mine' }, 3),
      ).resolves.toEqual({
        ok: false,
        reason: 'conflict',
      });
    });

    it('the next revision holding the submitted content is a success (a retry after a lost response)', async () => {
      const { client } = fakeClient(
        { data: [] },
        {
          data: { composition: { b: [1, 2], a: { y: 1, x: 2 } }, revision: 4 },
        },
      );
      await expect(
        saveComposition(client, ID, { a: { x: 2, y: 1 }, b: [1, 2] }, 3),
      ).resolves.toEqual({ ok: true, revision: 4 });
    });

    it('array order matters: reordered content is not the same save', async () => {
      const { client } = fakeClient(
        { data: [] },
        { data: { composition: { b: [2, 1] }, revision: 4 } },
      );
      await expect(
        saveComposition(client, ID, { b: [1, 2] }, 3),
      ).resolves.toMatchObject({ ok: false, reason: 'conflict' });
    });

    it('a row the caller cannot see is a failure, not a conflict', async () => {
      const { client } = fakeClient({ data: [] }, { data: null });
      await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
        ok: false,
        reason: 'failed',
        error: { code: 'row_not_written' },
      });
    });

    it('a row still at the expected revision is a failure', async () => {
      const { client } = fakeClient(
        { data: [] },
        { data: { composition: {}, revision: 3 } },
      );
      await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
        ok: false,
        reason: 'failed',
        error: { code: 'row_not_written' },
      });
    });
  });

  describe('the database conflict code', () => {
    it('is read back like a zero-row write: a moved revision is a conflict', async () => {
      const { client } = fakeClient(
        { error: { code: 'PT409' }, status: 409 },
        { data: { composition: {}, revision: 9 } },
      );
      await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
        ok: false,
        reason: 'conflict',
      });
    });

    it('is a conflict even when the row can no longer be read', async () => {
      const { client } = fakeClient(
        { error: { code: 'PT409' }, status: 409 },
        { data: null },
      );
      await expect(saveComposition(client, ID, {}, 3)).resolves.toEqual({
        ok: false,
        reason: 'conflict',
      });
    });
  });

  it('reports a refused update as a failure with code and status only', async () => {
    const { client } = fakeClient({
      error: { code: '23514', message: 'private row data' },
      status: 400,
    });
    const outcome = await saveComposition(client, ID, {}, 3);
    expect(outcome).toEqual({
      ok: false,
      reason: 'failed',
      error: { code: '23514', status: 400 },
    });
    expect(JSON.stringify(outcome)).not.toContain('private');
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
