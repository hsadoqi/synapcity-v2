/*
 * Profile setup through a real signed-in client on the disposable stack
 * (`pnpm --filter @synapcity/server-account test:db`): completion with names in
 * one write, stamped by the database and kept once set; skipping only while
 * incomplete; completion refused without a first name.
 */
import { withTwoUsers } from '@synapcity/server-data/testing';
import { describe, expect, it } from 'vitest';

import {
  readProfileSetup,
  saveProfileNames,
  skipProfileSetup,
} from './profile-setup';

describe('profile setup on the stack', () => {
  it('starts incomplete, can be skipped, then completed, and never goes back', async () => {
    await withTwoUsers(async (a) => {
      expect(await readProfileSetup(a.client, a.id)).toMatchObject({
        kind: 'found',
        state: 'incomplete',
      });

      expect(await skipProfileSetup(a.client, a.id)).toEqual({
        kind: 'skipped',
      });
      const skipped = await readProfileSetup(a.client, a.id);
      expect(skipped).toMatchObject({ state: 'skipped' });

      const saved = await saveProfileNames(a.client, a.id, {
        firstName: 'Ada',
        lastName: 'Lovelace',
        displayName: null,
      });
      expect(saved.ok).toBe(true);
      const completed = await readProfileSetup(a.client, a.id);
      expect(completed).toMatchObject({
        state: 'completed',
        firstName: 'Ada',
        lastName: 'Lovelace',
        displayName: null,
      });

      // Saving names again keeps the first completion time.
      await saveProfileNames(a.client, a.id, {
        firstName: 'Augusta',
        lastName: null,
        displayName: 'Countess',
      });
      const again = await readProfileSetup(a.client, a.id);
      expect(again.kind === 'found' && again.completedAt).toBe(
        completed.kind === 'found' && completed.completedAt,
      );

      // A skip after completion changes nothing.
      expect(await skipProfileSetup(a.client, a.id)).toEqual({
        kind: 'already-completed',
      });
    });
  });

  it('refuses completion without a first name, and saves nothing', async () => {
    await withTwoUsers(async (a) => {
      const saved = await saveProfileNames(a.client, a.id, {
        firstName: '   ',
        lastName: null,
        displayName: null,
      });

      expect(saved).toMatchObject({ ok: false, reason: 'first-name-required' });
      expect(await readProfileSetup(a.client, a.id)).toMatchObject({
        state: 'incomplete',
        firstName: null,
      });
    });
  });
});
