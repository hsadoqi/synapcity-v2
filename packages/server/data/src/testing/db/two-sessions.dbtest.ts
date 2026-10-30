/*
 * Concurrency smoke test for the two-session runner: the second writer must
 * wait on the first (observed in pg_stat_activity, not assumed from timing),
 * then proceed when the first commits.
 */
import { describe, expect, it } from 'vitest';

import { withSessions, waitUntilBlocked, withTwoUsers } from './index';

describe('two-session runner', () => {
  it('the second writer waits on the first, then proceeds after the commit', async () => {
    await withTwoUsers(async (a) => {
      const { data, error } = await a.client
        .from('spaces')
        .insert({ name: 'contended' })
        .select('id')
        .single();
      if (error) throw new Error(error.code);
      const id = data.id;

      await withSessions(2, async ([first, second]) => {
        await first!.run('begin');
        const held = await first!.run(
          `update public.spaces set name = 'first' where id = '${id}' returning name`,
        );
        expect(held.out.trim()).toBe('first');

        // Sent now, but it cannot finish while the first holds the row.
        let secondDone = false;
        const waiting = second!
          .run(
            `update public.spaces set name = 'second' where id = '${id}' returning name`,
          )
          .then((result) => {
            secondDone = true;
            return result;
          });

        await waitUntilBlocked(second!);
        expect(secondDone).toBe(false);

        await first!.run('commit');
        const result = await waiting;
        expect(result.out.trim()).toBe('second');

        const final = await first!.run(
          `select name from public.spaces where id = '${id}'`,
        );
        expect(final.out.trim()).toBe('second');
      });
    });
  });

  it('reports a failed statement as a result instead of hanging', async () => {
    await withSessions(1, async ([session]) => {
      const result = await session!.run('select 1/0');
      expect(result.err).toContain('division by zero');
    });
  });

  it('a session closed inside a transaction leaves no lock behind', async () => {
    await withTwoUsers(async (a) => {
      const { data } = await a.client
        .from('spaces')
        .insert({ name: 'locked' })
        .select('id')
        .single();
      const id = data!.id;
      await withSessions(1, async ([session]) => {
        await session!.run('begin');
        await session!.run(
          `update public.spaces set name = 'x' where id = '${id}'`,
        );
      });
      await withSessions(1, async ([session]) => {
        await session!.run("set lock_timeout = '2s'");
        const result = await session!.run(
          `update public.spaces set name = 'y' where id = '${id}' returning name`,
        );
        expect(result.out.trim()).toBe('y');
      });
    });
  });
});
