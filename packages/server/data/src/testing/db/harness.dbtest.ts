/*
 * The harness proves itself: two real people through ordinary clients, one
 * unable to see or touch the other's rows, and cleanup that removes exactly the
 * run's own users. These run only against a disposable local stack.
 */
import { describe, expect, it } from 'vitest';

import { findSpace } from '../../spaces';
import { setRecordPinned } from '../../records';
import { harnessUserEmails, withTwoUsers, type TestUser } from './index';

async function createSpaceFor(user: TestUser, name: string): Promise<string> {
  const { data, error } = await user.client
    .from('spaces')
    .insert({ name })
    .select('id')
    .single();
  if (error) throw new Error(`creating the space failed: ${error.code}`);
  return data.id;
}

describe('two-user harness', () => {
  it('B cannot read, update or delete A’s Space through the app’s functions or a direct call', async () => {
    await withTwoUsers(async (a, b) => {
      const spaceId = await createSpaceFor(a, 'A only');

      // A sees it; B reads it as missing.
      await expect(findSpace(a.client, spaceId)).resolves.toMatchObject({
        name: 'A only',
      });
      await expect(findSpace(b.client, spaceId)).resolves.toBeNull();

      // The app's pin function writes nothing for B.
      const pinned = await setRecordPinned(b.client, 'spaces', spaceId, true);
      expect(pinned).toEqual({ ok: false, error: { code: 'row_not_written' } });

      // A direct update and a direct delete match no row for B.
      const updated = await b.client
        .from('spaces')
        .update({ name: 'stolen' })
        .eq('id', spaceId)
        .select('id');
      expect(updated.error).toBeNull();
      expect(updated.data).toEqual([]);
      const deleted = await b.client
        .from('spaces')
        .delete()
        .eq('id', spaceId)
        .select('id');
      expect(deleted.data ?? []).toEqual([]);

      // And A's Space is exactly as A left it.
      await expect(findSpace(a.client, spaceId)).resolves.toMatchObject({
        name: 'A only',
        pinnedAt: null,
      });
    });
  });

  it('users are real, distinct and signed in as themselves', async () => {
    await withTwoUsers(async (a, b) => {
      expect(a.id).not.toBe(b.id);
      const [{ data: ua }, { data: ub }] = await Promise.all([
        a.client.auth.getUser(),
        b.client.auth.getUser(),
      ]);
      expect(ua.user?.id).toBe(a.id);
      expect(ub.user?.id).toBe(b.id);
    });
  });

  it('removes exactly the run’s users after a forced failure, and their rows with them', async () => {
    let emails: string[] = [];
    let runId = '';
    let spaceId = '';
    let survivor: string | undefined;
    await expect(
      withTwoUsers(async (a, b) => {
        runId = a.email.split('-')[1]!;
        emails = [a.email, b.email];
        spaceId = await createSpaceFor(a, 'doomed');
        survivor = b.email;
        throw new Error('forced failure');
      }),
    ).rejects.toThrow('forced failure');

    expect(emails).toHaveLength(2);
    expect(survivor).toBeDefined();
    await expect(harnessUserEmails(runId)).resolves.toEqual([]);

    // A fresh pair does not see the first run's Space either.
    await withTwoUsers(async (a) => {
      await expect(findSpace(a.client, spaceId)).resolves.toBeNull();
    });
  });

  it('does not remove another run’s users', async () => {
    await withTwoUsers(async (a) => {
      const runId = a.email.split('-')[1]!;
      await withTwoUsers(async () => undefined);
      await expect(harnessUserEmails(runId)).resolves.toHaveLength(2);
    });
  });
});
