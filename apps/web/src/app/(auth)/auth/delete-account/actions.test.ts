import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deleteOwnAccount: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

class Redirected extends Error {
  constructor(readonly url: string) {
    super(`redirect:${url}`);
  }
}

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Redirected(url);
  },
}));
vi.mock('@synapcity/server-account', () => ({
  deleteOwnAccount: mocks.deleteOwnAccount,
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));

import { confirmAccountDeletion } from './actions';

const run = () => confirmAccountDeletion({}, new FormData());

describe('confirmAccountDeletion', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue('client');
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('on success, goes to sign-in saying the account is gone', async () => {
    mocks.deleteOwnAccount.mockResolvedValue({ kind: 'deleted' });

    await expect(run()).rejects.toMatchObject({
      url: '/auth/login?notice=account-deleted',
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(warn).not.toHaveBeenCalled();
  });

  it('still succeeds when the sweep after deletion failed, and logs it by code', async () => {
    mocks.deleteOwnAccount.mockResolvedValue({
      kind: 'deleted',
      cleanupFailure: { code: 'x', status: 500 },
    });

    await expect(run()).rejects.toBeInstanceOf(Redirected);
    expect(warn).toHaveBeenCalledWith('confirmAccountDeletion.cleanup failed', {
      code: 'x',
      status: 500,
    });
  });

  it("takes no input: it deletes through the request's own client only", async () => {
    mocks.deleteOwnAccount.mockResolvedValue({
      kind: 'link-required',
      photoRemoved: false,
    });

    await run();

    expect(mocks.deleteOwnAccount).toHaveBeenCalledExactlyOnceWith('client');
  });

  it.each([
    [
      'an expired link, before anything changed',
      { kind: 'link-required', photoRemoved: false },
      /expired, so nothing was deleted/i,
    ],
    [
      'an expired link, after the photo was removed',
      { kind: 'link-required', photoRemoved: true },
      /not deleted\. your uploaded photo was removed/i,
    ],
    [
      'a signed-out session',
      { kind: 'signed-out' },
      /signed out, so nothing was deleted/i,
    ],
    ['an outage', { kind: 'unavailable' }, /nothing was deleted/i],
    [
      'a failed detach',
      { kind: 'failed', step: 'detach', photoRemoved: false },
      /nothing was deleted/i,
    ],
    [
      'files that could not be removed',
      { kind: 'failed', step: 'files', photoRemoved: true },
      /not deleted\. your uploaded photo was removed.*files could not be removed/i,
    ],
    [
      'stray files that could not be removed, with no photo',
      { kind: 'failed', step: 'files', photoRemoved: false },
      /^Your account was not deleted\. Some stored files/,
    ],
    [
      'a failed deletion after the photo was removed',
      { kind: 'failed', step: 'delete', photoRemoved: true },
      /not deleted\. your uploaded photo was removed/i,
    ],
    [
      'an answer that could not be confirmed',
      { kind: 'unconfirmed' },
      /could not confirm whether your account was deleted/i,
    ],
  ] as const)(
    'says exactly what happened for %s',
    async (_case, outcome, wording) => {
      mocks.deleteOwnAccount.mockResolvedValue(outcome);

      const state = await run();

      expect(state.error).toMatch(wording);
      expect(state.linkRequired).toBe(
        outcome.kind === 'link-required' ? true : undefined,
      );
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it('logs a failure by code, status and step only', async () => {
    mocks.deleteOwnAccount.mockResolvedValue({
      kind: 'failed',
      step: 'delete',
      photoRemoved: true,
      failure: { code: '57014', status: 500 },
    });

    await run();

    expect(warn).toHaveBeenCalledWith('confirmAccountDeletion failed', {
      step: 'delete',
      code: '57014',
      status: 500,
    });
  });
});

describe('confirmAccountDeletion in development fixture mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('deletes nothing and never reaches the deletion operation', async () => {
    const result = await run();

    expect(result.error).toContain('Fixture mode');
    expect(mocks.deleteOwnAccount).not.toHaveBeenCalled();
  });
});
