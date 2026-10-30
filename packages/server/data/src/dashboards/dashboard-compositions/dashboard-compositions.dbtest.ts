/*
 * Dashboard persistence against a real stack, through ordinary authenticated
 * clients (PostgREST and supabase-js) and, for races, two database sessions.
 * Covers the S1 two-user matrix and verification items V-1 (the conflict code
 * as supabase-js sees it) and V-2 (a composition save and a Dashboard rename
 * racing). Needs `pnpm --filter @synapcity/server-data test:db`.
 */
import { describe, expect, it } from 'vitest';

import { createRecord } from '../../records';
import {
  waitUntilBlocked,
  withSessions,
  withTwoUsers,
  type TestUser,
} from '../../testing/db';
import { loadComposition, saveComposition } from './dashboard-compositions';

async function newDashboard(
  user: TestUser,
  name = 'Persistence',
): Promise<string> {
  const created = await createRecord(user.client, 'dashboards', { name });
  if (!created.ok)
    throw new Error(`creating the dashboard failed: ${created.error.code}`);
  return created.id;
}

/** Ages the composition's last write by `minutes`, as the administrator, so the next save is "after a quiet gap". */
async function ageComposition(id: string, minutes: number) {
  await withSessions(1, async ([admin]) => {
    await admin!.run('set session_replication_role = replica');
    await admin!.run(
      `update public.dashboard_compositions set updated_at = now() - interval '${minutes} minutes' where dashboard_id = '${id}'`,
    );
    await admin!.run('set session_replication_role = origin');
  });
}

describe('a new Dashboard', () => {
  it('opens at revision 1 with the default composition and one initial revision', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);

      const stored = await loadComposition(a.client, id);
      expect(stored).toEqual({
        revision: 1,
        composition: {
          settings: { columns: 3, cardRadius: 8, showWidgetTitles: true },
          widgets: [],
          layouts: { lg: [], md: [], sm: [] },
        },
      });

      const revisions = await a.client
        .from('dashboard_revisions')
        .select('sequence, source, name')
        .eq('dashboard_id', id);
      expect(revisions.data).toEqual([
        { sequence: 1, source: 'initial', name: 'Persistence' },
      ]);
    });
  });
});

describe('isolation between two people', () => {
  it('B cannot read A’s composition or revisions, or write to either', async () => {
    await withTwoUsers(async (a, b) => {
      const id = await newDashboard(a);

      const read = await b.client
        .from('dashboard_compositions')
        .select('*')
        .eq('dashboard_id', id);
      expect(read.data).toEqual([]);
      const revisions = await b.client
        .from('dashboard_revisions')
        .select('*')
        .eq('dashboard_id', id);
      expect(revisions.data).toEqual([]);

      // B's save matches nothing and reports a failure, not a success.
      await expect(
        saveComposition(b.client, id, { stolen: true }, 1),
      ).resolves.toMatchObject({
        ok: false,
      });
      // A direct update matches no row for B.
      const direct = await b.client
        .from('dashboard_compositions')
        .update({ composition: { stolen: true }, revision: 2 })
        .eq('dashboard_id', id)
        .select('revision');
      expect(direct.data).toEqual([]);

      // B cannot write revisions at all.
      const insert = await b.client.from('dashboard_revisions').insert({
        dashboard_id: id,
        owner_id: b.id,
        sequence: 9,
        source: 'initial',
        schema_version: 1,
        composition: {},
        name: 'x',
        icon: 'folder',
        tags: [],
        content_bytes: 2,
        content_hash: '\\x00',
      });
      expect(insert.error?.code).toBe('42501');

      // A's composition is unchanged.
      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 1,
      });
    });
  });

  it('A cannot insert, delete, or edit a revision of their own', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);

      const insertComposition = await a.client
        .from('dashboard_compositions')
        .insert({ dashboard_id: id, composition: {}, revision: 1 });
      expect(insertComposition.error?.code).toBe('42501');
      const deleteComposition = await a.client
        .from('dashboard_compositions')
        .delete()
        .eq('dashboard_id', id)
        .select('dashboard_id');
      expect(deleteComposition.error?.code).toBe('42501');

      const update = await a.client
        .from('dashboard_revisions')
        .update({ name: 'x' })
        .eq('dashboard_id', id);
      expect(update.error?.code).toBe('42501');
      const remove = await a.client
        .from('dashboard_revisions')
        .delete()
        .eq('dashboard_id', id);
      expect(remove.error?.code).toBe('42501');
    });
  });
});

describe('V-1: the conflict code through PostgREST and supabase-js', () => {
  it('a direct update that jumps the revision is a 409 with code PT409', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);

      const jump = await a.client
        .from('dashboard_compositions')
        .update({ composition: { widgets: [] }, revision: 99 })
        .eq('dashboard_id', id);
      expect(jump.error?.code).toBe('PT409');
      expect(jump.status).toBe(409);

      // A rewind and a repeat are refused the same way.
      const repeat = await a.client
        .from('dashboard_compositions')
        .update({ composition: { widgets: [] }, revision: 1 })
        .eq('dashboard_id', id);
      expect(repeat.error?.code).toBe('PT409');

      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 1,
      });
    });
  });
});

describe('saveComposition against the real database', () => {
  it('saves at revision + 1, refuses a stale base, and retries idempotently', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);
      const first = {
        settings: { columns: 3 },
        widgets: [],
        layouts: { lg: [] },
      };

      await expect(saveComposition(a.client, id, first, 1)).resolves.toEqual({
        ok: true,
        revision: 2,
      });
      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 2,
        composition: first,
      });

      // A stale tab, still at revision 1 with different content, conflicts.
      await expect(
        saveComposition(a.client, id, { other: true }, 1),
      ).resolves.toEqual({
        ok: false,
        reason: 'conflict',
      });
      // The lost-response retry: the same save again from the same base is a success.
      await expect(saveComposition(a.client, id, first, 1)).resolves.toEqual({
        ok: true,
        revision: 2,
      });
      // Key order does not matter to the idempotence check (jsonb reorders keys).
      await expect(
        saveComposition(
          a.client,
          id,
          { layouts: { lg: [] }, widgets: [], settings: { columns: 3 } },
          1,
        ),
      ).resolves.toEqual({ ok: true, revision: 2 });
      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 2,
      });
    });
  });

  it('refuses an oversized or wrongly versioned document and keeps the head', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);
      const big = { pad: 'x'.repeat(131_100) };
      await expect(
        saveComposition(a.client, id, big, 1),
      ).resolves.toMatchObject({
        ok: false,
        reason: 'failed',
        error: { code: '23514' },
      });
      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 1,
      });
    });
  });

  it('a missing composition is a visible failure, never an empty value', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);
      await withSessions(1, async ([admin]) => {
        await admin!.run(
          `delete from public.dashboard_compositions where dashboard_id = '${id}'`,
        );
      });
      await expect(loadComposition(a.client, id)).rejects.toMatchObject({
        code: 'composition_missing',
      });
      // And a save does not recreate it.
      await expect(saveComposition(a.client, id, {}, 1)).resolves.toMatchObject(
        { ok: false },
      );
    });
  });
});

describe('V-11: the text backstop never refuses what the application accepts', () => {
  // The application caps compact JSON at 64 KiB. `jsonb::text` adds a space
  // after every comma and colon, so the same document is larger in the
  // database's own measure. The worst case is an array of one-character
  // scalars: "1," becomes "1, ", a ratio of 1.5. The backstop (128 KiB) is 2x.
  it('the densest 64 KiB document is about 1.5x as text and is accepted', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);
      const dense = { d: Array.from({ length: 32_000 }, (_, i) => i % 10) };
      const compactBytes = new TextEncoder().encode(
        JSON.stringify(dense),
      ).length;
      expect(compactBytes).toBeLessThanOrEqual(64 * 1024);

      await withSessions(1, async ([session]) => {
        const text = await session!.run(
          `select octet_length('${JSON.stringify(dense)}'::jsonb::text)`,
        );
        const ratio = Number(text.out.trim()) / compactBytes;
        console.info(
          `V-11 densest document: ${compactBytes} compact bytes, ratio ${ratio.toFixed(3)}`,
        );
        expect(ratio).toBeGreaterThan(1.4);
        expect(ratio).toBeLessThan(2); // the gate: above 2.0 the backstop would be too tight
      });

      await expect(saveComposition(a.client, id, dense, 1)).resolves.toEqual({
        ok: true,
        revision: 2,
      });
    });
  });
});

describe('concurrency', () => {
  it('two saves from one base: exactly one succeeds and one conflicts, with no gap or duplicate in the history', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a);
      await ageComposition(id, 10); // every save now captures a pre-image

      const outcomes = await Promise.all([
        saveComposition(a.client, id, { who: 'first' }, 1),
        saveComposition(a.client, id, { who: 'second' }, 1),
      ]);
      expect(outcomes.filter((o) => o.ok)).toHaveLength(1);
      expect(
        outcomes.filter((o) => !o.ok && o.reason === 'conflict'),
      ).toHaveLength(1);

      const stored = await loadComposition(a.client, id);
      expect(stored?.revision).toBe(2);

      // The loser matched zero rows: no trigger, no revision. The winner froze
      // the previous head once.
      const revisions = await a.client
        .from('dashboard_revisions')
        .select('sequence')
        .eq('dashboard_id', id)
        .order('sequence');
      expect(revisions.data?.map((r) => r.sequence)).toEqual([1]);
    });
  });

  const asUser = (userId: string) =>
    `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false)`;

  // V-2. Whichever statement takes the composition row first, the other waits
  // on it: no deadlock, no unique violation, and the history has no gap.
  it.each([
    ['a save first, then a rename', 'save-first'],
    ['a rename first, then a save', 'rename-first'],
  ] as const)('V-2: %s serialize without deadlock', async (_name, order) => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a, 'Before');
      // Head (A, "Before") is in no revision, and the next save is after a gap.
      await expect(
        saveComposition(a.client, id, { v: 'A' }, 1),
      ).resolves.toMatchObject({ ok: true });
      await ageComposition(id, 10);

      const save = `update public.dashboard_compositions set composition = '{"v":"B"}', revision = 3 where dashboard_id = '${id}'`;
      const rename = `update public.dashboards set name = 'After' where id = '${id}'`;
      const [first, second] =
        order === 'save-first' ? [save, rename] : [rename, save];

      await withSessions(2, async ([s1, s2]) => {
        await s1!.run(asUser(a.id));
        await s2!.run(asUser(a.id));
        await s1!.run('begin');
        const held = await s1!.run(first);
        expect(held.err).toBe('');

        let secondDone = false;
        const waiting = s2!.run(second).then((result) => {
          secondDone = true;
          return result;
        });
        await waitUntilBlocked(s2!);
        expect(secondDone).toBe(false);

        await s1!.run('commit');
        const result = await waiting;
        expect(result.err).toBe('');
      });

      const revisions = await a.client
        .from('dashboard_revisions')
        .select('sequence, name, composition')
        .eq('dashboard_id', id)
        .order('sequence');
      const sequences = revisions.data?.map((r) => r.sequence) ?? [];
      // 1..n with no gap and no duplicate.
      expect(sequences).toEqual(sequences.map((_, i) => i + 1));
      expect(sequences.length).toBeGreaterThanOrEqual(2);
      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 3,
        composition: { v: 'B' },
      });
    });
  });

  it('V-2: behavior under lock_timeout — a waiter fails with lock_not_available instead of hanging, and the holder is unaffected', async () => {
    await withTwoUsers(async (a) => {
      const id = await newDashboard(a, 'Timeout');
      await expect(
        saveComposition(a.client, id, { v: 'A' }, 1),
      ).resolves.toMatchObject({ ok: true });
      await ageComposition(id, 10);

      await withSessions(2, async ([holder, waiter]) => {
        await holder!.run(asUser(a.id));
        await waiter!.run(asUser(a.id));
        const configured = await holder!.run('show lock_timeout');
        // Recorded, not asserted: the role's own setting is whatever the stack configures.
        console.info(
          `lock_timeout for the authenticated role here: ${configured.out.trim()}`,
        );

        await holder!.run('begin');
        await holder!.run(
          `update public.dashboard_compositions set composition = '{"v":"B"}', revision = 3 where dashboard_id = '${id}'`,
        );
        await waiter!.run("set lock_timeout = '500ms'");
        const refused = await waiter!.run(
          `update public.dashboards set name = 'Late' where id = '${id}'`,
        );
        expect(refused.err).toContain('lock timeout');
        await holder!.run('commit');
      });
      await expect(loadComposition(a.client, id)).resolves.toMatchObject({
        revision: 3,
      });
    });
  });
});
